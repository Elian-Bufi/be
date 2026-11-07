/**
 * Instrumentación y lecturas de la medición de la cartera con concurrencia (encargo nocturno del 2026-10-28, §13).
 *
 * Nada de este archivo cambia el código de producto. La instrumentación se monta desde el arnés, sobre la aplicación ya
 * construida, y se puede sacar entre un lote y otro para medir cuánto pesa:
 *
 * - Un middleware de observación (se monta con `antesDeIniciar` de `appDePrueba`, después del request id) abre un contexto
 *   por pedido de `GET /api/v1/me/portfolio` con `AsyncLocalStorage`.
 * - `PdpService.decidirPorAlcance` se envuelve en la instancia que inyecta Nest (una propiedad propia que tapa el método
 *   de la clase): cuenta cada decisión, su duración y el tramo que va de la primera a la última.
 * - `PrismaService.$transaction` se envuelve igual: dentro de una decisión, la transacción es del PDP (y si hay más de una
 *   por decisión, hubo reintentos); fuera, en un pedido de la cartera, es la transacción de lectura de pendientes.
 * - Sacarla es borrar las dos propiedades y apagar el `AsyncLocalStorage`.
 *
 * Las lecturas de la base van por otra conexión, a la base `postgres` del mismo servidor: así sus consultas no se mezclan
 * con las de la API en las estadísticas de `be_test` (`pg_stat_database` y `pg_stat_statements` se filtran por base).
 */
import type { INestApplication } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readdirSync, readFileSync } from 'node:fs';
import { Agent, request as pedidoHttp } from 'node:http';
import { performance, PerformanceObserver } from 'node:perf_hooks';
import { PdpService } from '../../apps/api/src/autorizacion/pdp.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';

export const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// ─── Instrumentación de la aplicación ─────────────────────────────────────────────────────────

type Fase = 'pdp' | 'resto';

/** Lo que el servidor midió de un pedido de la cartera. Los instantes son de `performance.now()` del proceso. */
export interface MedicionDelServidor {
  readonly requestId: string;
  readonly inicio: number;
  fin: number | null;
  status: number | null;
  /** La conexión se cerró antes de terminar la respuesta. */
  abortada: boolean;
  pdpLlamadas: number;
  pdpMs: number;
  pdpMaxMs: number;
  pdpPrimera: number | null;
  pdpUltima: number | null;
  pdpErrores: number;
  pdpTransacciones: number;
  pdpTransaccionesMs: number;
  pdpTransaccionesFallidas: number;
  lecturaTransacciones: number;
  lecturaMs: number;
  lecturaFallidas: number;
  lecturaInicio: number | null;
  lecturaFin: number | null;
}

interface Contexto {
  readonly m: MedicionDelServidor;
  readonly fase: Fase;
}

type Funcion = (...args: unknown[]) => unknown;

function anotarTransaccion(m: MedicionDelServidor, fase: Fase, inicio: number, fin: number, ok: boolean): void {
  if (fase === 'pdp') {
    m.pdpTransacciones++;
    m.pdpTransaccionesMs += fin - inicio;
    if (!ok) m.pdpTransaccionesFallidas++;
    return;
  }
  m.lecturaTransacciones++;
  m.lecturaMs += fin - inicio;
  if (!ok) m.lecturaFallidas++;
  if (m.lecturaInicio === null) m.lecturaInicio = inicio;
  m.lecturaFin = fin;
}

export class Instrumentacion {
  private readonly almacen = new AsyncLocalStorage<Contexto>();
  private readonly registros = new Map<string, MedicionDelServidor>();
  private activa = false;
  private pdp: PdpService | null = null;
  private prisma: Record<string, unknown> | null = null;
  private envolturaDecidir: Funcion | null = null;
  private envolturaTransaccion: Funcion | null = null;
  /** El `$transaction` de la clase, leído antes de envolverlo por primera vez. */
  private transaccionOriginal: Funcion | null = null;

  /** Middleware de observación. Sin instrumentación activa, o en otra ruta, no hace nada. */
  readonly middleware = (req: Request & { requestId?: string }, res: Response, next: NextFunction): void => {
    if (!this.activa || req.method !== 'GET' || !req.originalUrl.startsWith('/api/v1/me/portfolio') || !req.requestId) {
      next();
      return;
    }
    const m: MedicionDelServidor = {
      requestId: req.requestId,
      inicio: performance.now(),
      fin: null,
      status: null,
      abortada: false,
      pdpLlamadas: 0,
      pdpMs: 0,
      pdpMaxMs: 0,
      pdpPrimera: null,
      pdpUltima: null,
      pdpErrores: 0,
      pdpTransacciones: 0,
      pdpTransaccionesMs: 0,
      pdpTransaccionesFallidas: 0,
      lecturaTransacciones: 0,
      lecturaMs: 0,
      lecturaFallidas: 0,
      lecturaInicio: null,
      lecturaFin: null,
    };
    this.registros.set(m.requestId, m);
    res.once('finish', () => {
      m.fin = performance.now();
      m.status = res.statusCode;
    });
    res.once('close', () => {
      if (m.fin !== null) return;
      m.abortada = true;
      m.fin = performance.now();
    });
    this.almacen.run({ m, fase: 'resto' }, () => next());
  };

  conectar(app: INestApplication): void {
    this.pdp = app.get(PdpService);
    this.prisma = app.get(PrismaService) as unknown as Record<string, unknown>;
  }

  get estaActiva(): boolean {
    return this.activa;
  }

  /** Monta las dos envolturas. Es idempotente: no envuelve una envoltura. */
  activar(): void {
    if (this.activa) return;
    if (!this.pdp || !this.prisma) throw new Error('Instrumentación sin conectar a la aplicación');
    const almacen = this.almacen;
    const decidirOriginal = PdpService.prototype.decidirPorAlcance;
    const envolturaDecidir = async function (this: PdpService, ...args: Parameters<PdpService['decidirPorAlcance']>) {
      const c = almacen.getStore();
      if (!c) return decidirOriginal.apply(this, args);
      const m = c.m;
      const t0 = performance.now();
      if (m.pdpPrimera === null) m.pdpPrimera = t0;
      try {
        return await almacen.run({ m, fase: 'pdp' }, () => decidirOriginal.apply(this, args));
      } catch (e) {
        m.pdpErrores++;
        throw e;
      } finally {
        const t1 = performance.now();
        m.pdpLlamadas++;
        m.pdpMs += t1 - t0;
        if (t1 - t0 > m.pdpMaxMs) m.pdpMaxMs = t1 - t0;
        m.pdpUltima = t1;
      }
    };
    Object.defineProperty(this.pdp, 'decidirPorAlcance', { value: envolturaDecidir, configurable: true, writable: true, enumerable: false });
    this.envolturaDecidir = envolturaDecidir as unknown as Funcion;

    // `$transaction` se lee por el proxy del cliente de Prisma (el método de la clase) y la envoltura se asigna por el mismo
    // proxy, que la guarda como propiedad propia. Se llama con el mismo `this` que la llamada original.
    this.transaccionOriginal ??= this.prisma.$transaction as Funcion;
    const transaccionOriginal = this.transaccionOriginal;
    const envolturaTransaccion = function (this: unknown, ...args: unknown[]): unknown {
      const c = almacen.getStore();
      if (!c || typeof args[0] !== 'function') return transaccionOriginal.apply(this, args);
      const { m, fase } = c;
      const t0 = performance.now();
      return (transaccionOriginal.apply(this, args) as Promise<unknown>).then(
        (v) => {
          anotarTransaccion(m, fase, t0, performance.now(), true);
          return v;
        },
        (e: unknown) => {
          anotarTransaccion(m, fase, t0, performance.now(), false);
          throw e;
        },
      );
    };
    this.prisma.$transaction = envolturaTransaccion;
    this.envolturaTransaccion = envolturaTransaccion;
    this.activa = true;
  }

  /** Saca las envolturas y apaga el contexto asíncrono: la aplicación queda como sin instrumentar. */
  desactivar(): void {
    if (this.pdp) delete (this.pdp as unknown as Record<string, unknown>).decidirPorAlcance;
    if (this.prisma) delete this.prisma.$transaction;
    this.envolturaDecidir = null;
    this.envolturaTransaccion = null;
    this.activa = false;
    this.almacen.disable();
  }

  /** Si las envolturas están puestas (y nada más las tapa). */
  envolturasPuestas(): boolean {
    if (!this.pdp || !this.prisma) return false;
    return (
      (this.pdp as unknown as Record<string, unknown>).decidirPorAlcance === this.envolturaDecidir &&
      this.envolturaDecidir !== null &&
      this.prisma.$transaction === this.envolturaTransaccion &&
      this.envolturaTransaccion !== null
    );
  }

  /** Si las envolturas no están: los dos métodos vuelven a ser los de la clase. */
  envolturasQuitadas(): boolean {
    if (!this.pdp || !this.prisma) return false;
    return (
      (this.pdp as unknown as Record<string, unknown>).decidirPorAlcance === PdpService.prototype.decidirPorAlcance &&
      (this.transaccionOriginal === null || this.prisma.$transaction === this.transaccionOriginal)
    );
  }

  /** Entrega (y olvida) lo que el servidor midió de ese pedido. */
  tomar(requestId: string | null): MedicionDelServidor | null {
    if (!requestId) return null;
    const m = this.registros.get(requestId) ?? null;
    if (m) this.registros.delete(requestId);
    return m;
  }

  descartarTodo(): void {
    this.registros.clear();
  }
}

/** Lo que se guarda por pedido de lo que midió el servidor. Los tramos son en milisegundos. */
export interface ServidorEnLaMuestra {
  readonly totalMs: number | null;
  readonly abortada: boolean;
  /** De la entrada del pedido a la primera decisión: sesión, límite y la consulta de vínculos (paso 1). */
  readonly antesDelPdpMs: number | null;
  /** De la primera decisión a la última (el bloque del PDP, en tiempo de reloj). */
  readonly pdpTramoMs: number | null;
  /** Suma de las duraciones de cada decisión (sin los huecos entre una y otra). */
  readonly pdpSumaMs: number;
  readonly pdpLlamadas: number;
  readonly pdpMaxMs: number;
  readonly pdpTransacciones: number;
  readonly pdpTransaccionesMs: number;
  readonly pdpTransaccionesFallidas: number;
  readonly pdpErrores: number;
  /** Entre la última decisión y el comienzo de la transacción de lectura. */
  readonly entrePdpYLecturaMs: number | null;
  /** La transacción de lectura de pendientes (paso 3). */
  readonly lecturaMs: number;
  readonly lecturaTransacciones: number;
  readonly lecturaFallidas: number;
  /** Del fin de la lectura al fin de la respuesta: orden, paginación y serialización. */
  readonly despuesDeLecturaMs: number | null;
}

const redondeo = (n: number | null): number | null => (n === null ? null : Math.round(n * 100) / 100);

export function resumirServidor(m: MedicionDelServidor): ServidorEnLaMuestra {
  const total = m.fin !== null ? m.fin - m.inicio : null;
  return {
    totalMs: redondeo(total),
    abortada: m.abortada,
    antesDelPdpMs: redondeo(m.pdpPrimera !== null ? m.pdpPrimera - m.inicio : null),
    pdpTramoMs: redondeo(m.pdpPrimera !== null && m.pdpUltima !== null ? m.pdpUltima - m.pdpPrimera : null),
    pdpSumaMs: redondeo(m.pdpMs) ?? 0,
    pdpLlamadas: m.pdpLlamadas,
    pdpMaxMs: redondeo(m.pdpMaxMs) ?? 0,
    pdpTransacciones: m.pdpTransacciones,
    pdpTransaccionesMs: redondeo(m.pdpTransaccionesMs) ?? 0,
    pdpTransaccionesFallidas: m.pdpTransaccionesFallidas,
    pdpErrores: m.pdpErrores,
    entrePdpYLecturaMs: redondeo(m.pdpUltima !== null && m.lecturaInicio !== null ? m.lecturaInicio - m.pdpUltima : null),
    lecturaMs: redondeo(m.lecturaMs) ?? 0,
    lecturaTransacciones: m.lecturaTransacciones,
    lecturaFallidas: m.lecturaFallidas,
    despuesDeLecturaMs: redondeo(m.lecturaFin !== null && m.fin !== null ? m.fin - m.lecturaFin : null),
  };
}

// ─── Cliente HTTP de la carga ─────────────────────────────────────────────────────────────────

export interface RespuestaDeCartera {
  /** 0 si no hubo respuesta (error de red o tiempo agotado). */
  readonly status: number;
  readonly error: string | null;
  readonly requestId: string | null;
  readonly items: number | null;
  readonly hasMore: boolean | null;
  readonly nextCursor: string | null;
  readonly partialView: boolean | null;
  /** Ítems por `dominio|tipo`, solo si se pidió (inventario). */
  readonly porTipo: Record<string, number> | null;
  readonly bytes: number;
  readonly inicio: number;
  readonly fin: number;
}

/** Conexiones persistentes, como un navegador: el tiempo de abrir una conexión no entra en cada pedido. */
const agente = new Agent({ keepAlive: true, maxSockets: 64 });

export function cerrarAgente(): void {
  agente.destroy();
}

type Sin<T, K extends keyof T> = Omit<T, K>;

/**
 * `GET /api/v1/me/portfolio` con el token del profesional. Nunca rechaza: un 4xx, un 5xx, un error de red o un tiempo
 * agotado vuelven como una respuesta con su `status` y su `error`, para que el informe los cuente.
 */
export function pedirCartera(puerto: number, token: string, query: string, opciones: { readonly timeoutMs: number; readonly contarTipos?: boolean }): Promise<RespuestaDeCartera> {
  return new Promise((resolver) => {
    let listo = false;
    const inicio = performance.now();
    const terminar = (r: Sin<RespuestaDeCartera, 'inicio' | 'fin'>): void => {
      if (listo) return;
      listo = true;
      resolver({ ...r, inicio, fin: performance.now() });
    };
    const vacia = { requestId: null, items: null, hasMore: null, nextCursor: null, partialView: null, porTipo: null, bytes: 0 };
    const req = pedidoHttp(
      {
        host: '127.0.0.1',
        port: puerto,
        method: 'GET',
        path: `/api/v1/me/portfolio${query}`,
        agent: agente,
        headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      },
      (res) => {
        const partes: Buffer[] = [];
        res.on('data', (c: Buffer) => partes.push(c));
        res.on('error', (e: Error) => terminar({ ...vacia, status: res.statusCode ?? 0, error: `RESPUESTA_INTERRUMPIDA: ${e.message}` }));
        res.on('end', () => {
          const cuerpo = Buffer.concat(partes);
          const cabecera = res.headers['x-request-id'];
          const requestId = typeof cabecera === 'string' ? cabecera : null;
          const status = res.statusCode ?? 0;
          let json: unknown = null;
          try {
            json = JSON.parse(cuerpo.toString('utf8'));
          } catch {
            json = null;
          }
          const j = (json && typeof json === 'object' ? json : {}) as { data?: { items?: unknown; partialView?: unknown }; page?: { hasMore?: unknown; nextCursor?: unknown }; error?: { code?: unknown } };
          const datos = j.data ?? {};
          const pagina = j.page ?? {};
          const codigo = j.error?.code;
          if (status !== 200) {
            terminar({ ...vacia, status, requestId, bytes: cuerpo.length, error: typeof codigo === 'string' ? codigo : `HTTP_${status}` });
            return;
          }
          const items = Array.isArray(datos.items) ? (datos.items as { domain?: unknown; kind?: unknown }[]) : null;
          let porTipo: Record<string, number> | null = null;
          if (opciones.contarTipos && items) {
            porTipo = {};
            for (const i of items) {
              const clave = `${String(i.domain)}|${String(i.kind)}`;
              porTipo[clave] = (porTipo[clave] ?? 0) + 1;
            }
          }
          const hasMore = pagina.hasMore;
          const nextCursor = pagina.nextCursor;
          const partialView = datos.partialView;
          terminar({
            status,
            error: items ? null : 'CUERPO_INVALIDO',
            requestId,
            items: items ? items.length : null,
            hasMore: typeof hasMore === 'boolean' ? hasMore : null,
            nextCursor: typeof nextCursor === 'string' ? nextCursor : null,
            partialView: typeof partialView === 'boolean' ? partialView : null,
            porTipo,
            bytes: cuerpo.length,
          });
        });
      },
    );
    req.setTimeout(opciones.timeoutMs, () => req.destroy(new Error('TIMEOUT')));
    req.on('error', (e: Error) => terminar({ ...vacia, status: 0, error: e.message === 'TIMEOUT' ? 'TIMEOUT' : `RED: ${e.message}` }));
    req.end();
  });
}

// ─── Lecturas de PostgreSQL ───────────────────────────────────────────────────────────────────

/** Una fila de `pg_stat_statements`, acumulada. La clave es `queryid|toplevel`. */
export interface FilaDeSentencia {
  readonly calls: number;
  readonly ms: number;
  readonly rows: number;
  readonly hit: number;
  readonly read: number;
  readonly walRecords: number;
  readonly walBytes: number;
}

/** [clave, llamadas, ms, filas, bloques en memoria, bloques leídos, registros WAL, bytes WAL] */
export type DeltaDeSentencia = [string, number, number, number, number, number, number, number];

export function deltaDeSentencias(antes: ReadonlyMap<string, FilaDeSentencia>, despues: ReadonlyMap<string, FilaDeSentencia>): DeltaDeSentencia[] {
  const filas: DeltaDeSentencia[] = [];
  for (const [clave, d] of despues) {
    const a = antes.get(clave);
    const llamadas = d.calls - (a?.calls ?? 0);
    if (llamadas <= 0) continue;
    const r = (n: number): number => Math.round(n * 1000) / 1000;
    filas.push([clave, llamadas, r(d.ms - (a?.ms ?? 0)), d.rows - (a?.rows ?? 0), d.hit - (a?.hit ?? 0), d.read - (a?.read ?? 0), d.walRecords - (a?.walRecords ?? 0), d.walBytes - (a?.walBytes ?? 0)]);
  }
  return filas;
}

export type Contadores = Record<string, number>;

export function deltaDeContadores(antes: Contadores | null, despues: Contadores | null): Contadores | null {
  if (!antes || !despues) return null;
  const d: Contadores = {};
  for (const [k, v] of Object.entries(despues)) d[k] = Math.round((v - (antes[k] ?? 0)) * 1000) / 1000;
  return d;
}

const ESTADISTICAS_ENCENDIDAS: Readonly<Record<string, string>> = {
  'pg_stat_statements.track': 'all',
  track_io_timing: 'on',
  track_wal_io_timing: 'on',
  track_functions: 'all',
};
const ESTADISTICAS_APAGADAS: Readonly<Record<string, string>> = {
  'pg_stat_statements.track': 'none',
  track_io_timing: 'off',
  track_wal_io_timing: 'off',
  track_functions: 'none',
};

export const PARAMETROS_REGISTRADOS = [
  'server_version',
  'shared_buffers',
  'effective_cache_size',
  'work_mem',
  'max_connections',
  'fsync',
  'synchronous_commit',
  'full_page_writes',
  'wal_level',
  'wal_compression',
  'max_wal_size',
  'checkpoint_timeout',
  'commit_delay',
  'autovacuum',
  'autovacuum_naptime',
  'autovacuum_vacuum_insert_threshold',
  'autovacuum_vacuum_insert_scale_factor',
  'random_page_cost',
  'jit',
  'huge_pages',
  'max_worker_processes',
  'shared_preload_libraries',
  'pg_stat_statements.max',
  'pg_stat_statements.track',
  'pg_stat_statements.track_utility',
  'track_io_timing',
  'track_wal_io_timing',
  'track_functions',
  'default_transaction_isolation',
];

/** Lecturas de estadísticas por la conexión a la base `postgres`, filtradas por la base que se mide. */
export class Monitor {
  private encendidas: boolean | null = null;

  constructor(
    private readonly pg: PrismaClient,
    readonly base: string,
  ) {}

  async preparar(): Promise<void> {
    await this.pg.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
    await this.estadisticas(true);
  }

  /**
   * Prende o apaga lo que agrega costo en el servidor (pg_stat_statements, tiempos de E/S y de WAL, funciones). Van por
   * `ALTER SYSTEM` y se recargan: en la línea de comandos no se podrían cambiar sin reiniciar.
   */
  async estadisticas(encendidas: boolean): Promise<void> {
    if (this.encendidas === encendidas) return;
    for (const [k, v] of Object.entries(encendidas ? ESTADISTICAS_ENCENDIDAS : ESTADISTICAS_APAGADAS)) await this.pg.$executeRawUnsafe(`ALTER SYSTEM SET ${k} = '${v}'`);
    await this.pg.$queryRawUnsafe('SELECT pg_reload_conf() AS "recargada"');
    this.encendidas = encendidas;
    await esperar(300);
  }

  get estadisticasEncendidas(): boolean | null {
    return this.encendidas;
  }

  async sentencias(): Promise<Map<string, FilaDeSentencia>> {
    const filas = await this.pg.$queryRawUnsafe<{ queryid: string; toplevel: boolean; calls: number; ms: number; rows: number; hit: number; read: number; wal_records: number; wal_bytes: number }[]>(
      `SELECT s.queryid::text AS queryid, s.toplevel, s.calls::float8 AS calls, s.total_exec_time AS ms, s.rows::float8 AS rows,
              s.shared_blks_hit::float8 AS hit, s.shared_blks_read::float8 AS read, s.wal_records::float8 AS wal_records, s.wal_bytes::float8 AS wal_bytes
         FROM pg_stat_statements(false) s
        WHERE s.dbid = (SELECT oid FROM pg_database WHERE datname = $1)`,
      this.base,
    );
    return new Map(filas.map((f) => [`${f.queryid}|${f.toplevel ? 1 : 0}`, { calls: f.calls, ms: f.ms, rows: f.rows, hit: f.hit, read: f.read, walRecords: f.wal_records, walBytes: f.wal_bytes }]));
  }

  /** El texto normalizado de cada sentencia (sin valores), para ponerle nombre en el análisis. */
  async textos(): Promise<Record<string, string>> {
    const filas = await this.pg.$queryRawUnsafe<{ queryid: string; toplevel: boolean; query: string }[]>(
      `SELECT s.queryid::text AS queryid, s.toplevel, left(s.query, 900) AS query
         FROM pg_stat_statements(true) s
        WHERE s.dbid = (SELECT oid FROM pg_database WHERE datname = $1)`,
      this.base,
    );
    return Object.fromEntries(filas.map((f) => [`${f.queryid}|${f.toplevel ? 1 : 0}`, f.query]));
  }

  async baseDeDatos(): Promise<Contadores> {
    const [f] = await this.pg.$queryRawUnsafe<Contadores[]>(
      `SELECT numbackends::float8 AS numbackends, xact_commit::float8 AS xact_commit, xact_rollback::float8 AS xact_rollback,
              blks_read::float8 AS blks_read, blks_hit::float8 AS blks_hit, tup_returned::float8 AS tup_returned,
              tup_fetched::float8 AS tup_fetched, tup_inserted::float8 AS tup_inserted, tup_updated::float8 AS tup_updated,
              tup_deleted::float8 AS tup_deleted, conflicts::float8 AS conflicts, temp_files::float8 AS temp_files,
              temp_bytes::float8 AS temp_bytes, deadlocks::float8 AS deadlocks, blk_read_time, blk_write_time,
              session_time, active_time, idle_in_transaction_time, sessions::float8 AS sessions
         FROM pg_stat_database WHERE datname = $1`,
      this.base,
    );
    return f ?? {};
  }

  async wal(): Promise<Contadores> {
    const [f] = await this.pg.$queryRawUnsafe<Contadores[]>(
      `SELECT wal_records::float8 AS wal_records, wal_fpi::float8 AS wal_fpi, wal_bytes::float8 AS wal_bytes,
              wal_buffers_full::float8 AS wal_buffers_full, wal_write::float8 AS wal_write, wal_sync::float8 AS wal_sync,
              wal_write_time, wal_sync_time
         FROM pg_stat_wal`,
    );
    return f ?? {};
  }

  async escritor(): Promise<Contadores> {
    const [f] = await this.pg.$queryRawUnsafe<Contadores[]>(
      `SELECT checkpoints_timed::float8 AS checkpoints_timed, checkpoints_req::float8 AS checkpoints_req,
              checkpoint_write_time, checkpoint_sync_time, buffers_checkpoint::float8 AS buffers_checkpoint,
              buffers_clean::float8 AS buffers_clean, buffers_backend::float8 AS buffers_backend,
              buffers_backend_fsync::float8 AS buffers_backend_fsync, buffers_alloc::float8 AS buffers_alloc
         FROM pg_stat_bgwriter`,
    );
    return f ?? {};
  }

  async actividad(): Promise<{ app: string; estado: string; tipoDeEspera: string; espera: string; tipo: string }[]> {
    return this.pg.$queryRawUnsafe(
      `SELECT coalesce(application_name, '') AS app, coalesce(state, '') AS estado, coalesce(wait_event_type, '') AS "tipoDeEspera",
              coalesce(wait_event, '') AS espera, coalesce(backend_type, '') AS tipo
         FROM pg_stat_activity
        WHERE datname = $1`,
      this.base,
    );
  }

  async parametros(): Promise<Record<string, string>> {
    const filas = await this.pg.$queryRaw<{ name: string; setting: string; unit: string }[]>`
      SELECT name, setting, coalesce(unit, '') AS unit FROM pg_settings WHERE name = ANY(${PARAMETROS_REGISTRADOS}::text[])`;
    return Object.fromEntries(filas.map((f) => [f.name, f.unit ? `${f.setting} ${f.unit}` : f.setting]));
  }

  async version(): Promise<string> {
    const [f] = await this.pg.$queryRawUnsafe<{ v: string }[]>('SELECT version() AS v');
    return f?.v ?? '';
  }
}

/** Resumen de una muestra de `pg_stat_activity` de la base medida. */
export interface MuestraDeActividad {
  readonly t: number;
  readonly api: { readonly activas: number; readonly enTransaccionOciosas: number; readonly ociosas: number; readonly total: number };
  /** Esperas de las conexiones activas de la API, por tipo (vacío = en CPU). */
  readonly esperas: Record<string, number>;
  readonly autovacuum: number;
  readonly otras: number;
}

export class Muestreador {
  private parar = false;
  private promesa: Promise<void> | null = null;
  readonly muestras: MuestraDeActividad[] = [];
  errores = 0;

  constructor(
    private readonly monitor: Monitor,
    private readonly t0: number,
    private readonly cadaMs: number,
    private readonly appDeLaApi: string,
  ) {}

  iniciar(): void {
    this.promesa = (async () => {
      while (!this.parar) {
        const t = performance.now() - this.t0;
        try {
          const filas = await this.monitor.actividad();
          const api = { activas: 0, enTransaccionOciosas: 0, ociosas: 0, total: 0 };
          const esperas: Record<string, number> = {};
          let autovacuum = 0;
          let otras = 0;
          for (const f of filas) {
            if (f.tipo === 'autovacuum worker') {
              autovacuum++;
              continue;
            }
            if (f.app !== this.appDeLaApi) {
              otras++;
              continue;
            }
            api.total++;
            if (f.estado === 'active') {
              api.activas++;
              const clave = f.tipoDeEspera ? `${f.tipoDeEspera}:${f.espera}` : 'CPU';
              esperas[clave] = (esperas[clave] ?? 0) + 1;
            } else if (f.estado.startsWith('idle in transaction')) api.enTransaccionOciosas++;
            else api.ociosas++;
          }
          this.muestras.push({ t: Math.round(t), api, esperas, autovacuum, otras });
        } catch {
          this.errores++;
        }
        await esperar(this.cadaMs);
      }
    })();
  }

  async detener(): Promise<void> {
    this.parar = true;
    await this.promesa;
  }
}

// ─── La máquina ───────────────────────────────────────────────────────────────────────────────

/** Primera línea de /proc/stat: user nice system idle iowait irq softirq steal (en ticks). `null` fuera de Linux. */
export function cpuDelHost(): number[] | null {
  try {
    const linea = readFileSync('/proc/stat', 'utf8').split('\n')[0] ?? '';
    return linea.trim().split(/\s+/).slice(1, 9).map(Number);
  } catch {
    return null;
  }
}

export function deltaDeCpuDelHost(antes: number[] | null, despues: number[] | null, nucleos: number): { readonly nucleosOcupados: number; readonly iowait: number; readonly steal: number } | null {
  if (!antes || !despues) return null;
  const d = despues.map((v, i) => v - (antes[i] ?? 0));
  const total = d.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  const [usuario = 0, nice = 0, sistema = 0, , iowait = 0, irq = 0, softirq = 0, steal = 0] = d;
  const ocupado = usuario + nice + sistema + irq + softirq + steal;
  return { nucleosOcupados: Math.round((ocupado / total) * nucleos * 100) / 100, iowait: Math.round((iowait / total) * 1000) / 1000, steal: Math.round((steal / total) * 1000) / 1000 };
}

/** Ticks de CPU (usuario + sistema) de los procesos `postgres` vivos. Aproximado: un proceso que terminó no cuenta. */
export function ticksDePostgres(): { readonly ticks: number; readonly procesos: number } | null {
  try {
    let ticks = 0;
    let procesos = 0;
    for (const d of readdirSync('/proc')) {
      if (!/^\d+$/.test(d)) continue;
      let s: string;
      try {
        s = readFileSync(`/proc/${d}/stat`, 'utf8');
      } catch {
        continue;
      }
      const cierre = s.lastIndexOf(')');
      if (s.slice(s.indexOf('(') + 1, cierre) !== 'postgres') continue;
      const campos = s.slice(cierre + 2).split(' ');
      ticks += Number(campos[11] ?? 0) + Number(campos[12] ?? 0);
      procesos++;
    }
    return { ticks, procesos };
  } catch {
    return null;
  }
}

export interface EventoDeGc {
  readonly inicio: number;
  readonly ms: number;
  readonly tipo: number;
}

/** Pausas del recolector de basura de V8 (tipos: 1 menor, 2 mayor, 4 incremental, 8 de callbacks débiles). */
export class ObservadorDeGc {
  private eventos: EventoDeGc[] = [];
  private readonly observador = new PerformanceObserver((lista) => {
    for (const e of lista.getEntries()) this.eventos.push({ inicio: e.startTime, ms: e.duration, tipo: (e as unknown as { detail?: { kind?: number } }).detail?.kind ?? 0 });
  });

  iniciar(): void {
    this.observador.observe({ entryTypes: ['gc'] });
  }

  tomar(): EventoDeGc[] {
    const e = this.eventos;
    this.eventos = [];
    return e;
  }

  detener(): void {
    this.observador.disconnect();
  }
}

/** Milisegundos de pausas del recolector que caen dentro de [inicio, fin]. */
export function gcDentro(eventos: readonly EventoDeGc[], inicio: number, fin: number): number {
  let ms = 0;
  for (const e of eventos) {
    const desde = Math.max(inicio, e.inicio);
    const hasta = Math.min(fin, e.inicio + e.ms);
    if (hasta > desde) ms += hasta - desde;
  }
  return Math.round(ms * 100) / 100;
}
