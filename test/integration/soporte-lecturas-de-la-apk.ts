/**
 * DL-152 · soporte de `lecturas-de-las-apk.int-spec.ts`: pedir como pide una APK publicada y leer cada respuesta con el
 * esquema que esa APK usa, congelado en `packages/domain/fixtures/lecturas-de-la-apk/<versión>.json` (lo genera
 * `node scripts/congelar-lo-que-lee-la-apk.mjs <tag>` desde las fuentes del commit de la APK; no se edita a mano).
 *
 * Cómo pide la APK, según lo congelado: la ruta y el verbo de su contrato, sus cabeceras (`X-BE-Surface: APK` y, desde
 * DL-122, las capacidades que declara), el Bearer y la Idempotency-Key solo donde su cliente los manda, y la consulta sin
 * los valores vacíos (`query` del cliente). El cuerpo que arma la prueba se valida antes contra el esquema del pedido de
 * ese commit: la prueba no puede mandar algo que esa APK no mandaría.
 *
 * Cómo lee: toda respuesta 2xx con el esquema congelado de esa operación (estricto donde el de la APK es estricto), más
 * las reglas que JSON Schema no dice (`reglasQueElJsonNoDice`); todo rechazo, con el sobre de error congelado y, para los
 * códigos que la APK lee con su propio esquema, con el de su detalle. Lo que no pasa no corta la prueba: se junta en
 * `rechazos()` con la operación, la versión y el campo, para verlo todo junto.
 */
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { RAIZ } from './soporte';

interface Problema {
  readonly path: readonly PropertyKey[];
  readonly code: string;
  readonly message: string;
  readonly keys?: readonly string[];
}
interface EsquemaLeido {
  safeParse(valor: unknown): { success: boolean; error?: { issues: Problema[] } };
}
/** El zod del dominio (4.6.5, el mismo de las APK congeladas): `apps/api` no importa zod. */
const { fromJSONSchema } = require(require.resolve('zod', { paths: [join(RAIZ, 'packages', 'domain')] })) as { fromJSONSchema: (esquema: unknown) => EsquemaLeido };

export interface Lectura {
  readonly metodo: 'get' | 'post' | 'put' | 'patch' | 'delete';
  readonly ruta: string;
  readonly llamadas: readonly string[];
  readonly conSesion: boolean;
  readonly conClave: boolean;
  readonly esquema: string | null;
  readonly respuesta: unknown;
  readonly noRepresentado: readonly string[];
  readonly pedido: { properties?: Record<string, unknown> } | null;
}
export interface Congelado {
  readonly apk: { readonly version: string; readonly versionCode: number; readonly tag: string; readonly commit: string };
  readonly cabeceras: Readonly<Record<string, string>>;
  readonly textos: Readonly<Record<string, string>>;
  readonly errores: { readonly respuesta: unknown; readonly detalles: Readonly<Record<string, { readonly esquema: string; readonly respuesta: unknown }>> };
  readonly lecturas: Readonly<Record<string, Lectura>>;
}

const CARPETA = join(RAIZ, 'packages', 'domain', 'fixtures', 'lecturas-de-la-apk');
/** Las APK congeladas: un archivo por versión. Sumar una congela su lectura y obliga a ejercitarla. */
export const VERSIONES: readonly string[] = readdirSync(CARPETA)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

export interface Pedido {
  /** El Bearer, cuando la APK lo manda en esa operación. */
  readonly token?: string;
  /** Los parámetros de la ruta, con su nombre en el contrato (`{ planId: '…' }`). */
  readonly params?: Readonly<Record<string, string>>;
  /** La consulta, como la arma el cliente: los valores vacíos o ausentes no viajan. */
  readonly consulta?: Readonly<Record<string, string | undefined>>;
  /** El cuerpo JSON, tal como lo manda la APK. */
  readonly cuerpo?: unknown;
  /** API-MED-02: la ruta firmada que dio la intención y los bytes con su tipo. */
  readonly rutaFirmada?: string;
  readonly bytes?: { readonly contenido: Buffer; readonly tipo: string };
  /** La Idempotency-Key de un reintento; sin ella, una nueva, como cada intento lógico de la APK. */
  readonly clave?: string;
  /** El status esperado; sin él, cualquier 2xx. */
  readonly status?: number;
  /** Otra app (por ejemplo, con la exigencia de evidencia visual activa). */
  readonly app?: INestApplication;
}

export interface Respuesta {
  readonly status: number;
  /** El cuerpo que respondió la API, ya leído con el esquema de la APK (o con el sobre de error). */
  readonly body: any;
}

/** Una APK congelada: pide como ella y lee como ella. */
export class LaApk {
  readonly congelado: Congelado;
  private readonly esquemas = new Map<string, EsquemaLeido>();
  private readonly leidas = new Set<string>();
  private readonly detallesLeidos = new Set<string>();
  private readonly problemas: string[] = [];

  constructor(
    readonly version: string,
    private readonly app: () => INestApplication,
  ) {
    this.congelado = JSON.parse(readFileSync(join(CARPETA, `${version}.json`), 'utf8')) as Congelado;
  }

  /** Si esta APK llama la operación. */
  lee(operacion: string): boolean {
    return operacion in this.congelado.lecturas;
  }

  /** Si el pedido de esa operación, en esta APK, tiene el campo (por ejemplo, la declaración de mayoría de edad del alta). */
  mandaElCampo(operacion: string, campo: string): boolean {
    return campo in (this.lectura(operacion).pedido?.properties ?? {});
  }

  /** Las versiones de los textos que esta APK manda como aceptadas: las de su commit. */
  get textos(): Readonly<Record<string, string>> {
    return this.congelado.textos;
  }

  async pide(operacion: string, p: Pedido = {}): Promise<Respuesta> {
    const l = this.lectura(operacion);
    let ruta = p.rutaFirmada ?? l.ruta.replace(/\{([^}]+)\}/g, (_: string, nombre: string) => {
      const valor = p.params?.[nombre];
      if (valor === undefined) throw new Error(`${operacion}: falta el parámetro {${nombre}} de ${l.ruta}`);
      return encodeURIComponent(valor);
    });
    const pares = Object.entries(p.consulta ?? {}).filter((x): x is [string, string] => typeof x[1] === 'string' && x[1].length > 0);
    if (pares.length > 0) ruta += `?${pares.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;

    const pedido = request((p.app ?? this.app()).getHttpServer())[l.metodo](`/api/v1${ruta}`).set('Accept', 'application/json');
    if (p.bytes) {
      // La subida de bytes (API-MED-02) lleva solo la superficie: ni sesión ni capacidades (`subirBytes` del cliente).
      pedido.set('X-BE-Surface', this.congelado.cabeceras['X-BE-Surface']!);
    } else {
      for (const [nombre, valor] of Object.entries(this.congelado.cabeceras)) pedido.set(nombre, valor);
    }
    if (l.conSesion) {
      if (!p.token) throw new Error(`${operacion}: la APK ${this.version} la pide con su sesión`);
      pedido.set('Authorization', `Bearer ${p.token}`);
    } else if (p.token) {
      throw new Error(`${operacion}: la APK ${this.version} la pide sin sesión`);
    }
    if (l.conClave) pedido.set('Idempotency-Key', p.clave ?? `apk-${randomUUID()}`);
    else if (p.clave) throw new Error(`${operacion}: la APK ${this.version} no manda Idempotency-Key`);

    if (p.bytes) {
      pedido.set('Content-Type', p.bytes.tipo).send(p.bytes.contenido);
    } else if (p.cuerpo !== undefined) {
      if (l.pedido) {
        const valido = this.esquema(`${operacion} · pedido`, l.pedido).safeParse(p.cuerpo);
        if (!valido.success) throw new Error(`${operacion}: la prueba arma un pedido que la APK ${this.version} no mandaría: ${resumen(valido.error?.issues ?? [])}`);
      }
      pedido.send(p.cuerpo as object);
    }

    const r = await pedido;
    const esperado = p.status === undefined ? r.status >= 200 && r.status < 300 : r.status === p.status;
    if (!esperado) throw new Error(`${operacion} (APK ${this.version}): se esperaba ${p.status ?? '2xx'} y respondió ${r.status} ${JSON.stringify(r.body).slice(0, 800)}`);
    if (r.status >= 200 && r.status < 300) {
      if (l.respuesta) this.revisar(operacion, `${operacion} · respuesta`, l.respuesta, r.body);
      this.leidas.add(operacion);
    } else {
      this.revisarElRechazo(operacion, r.status, r.body);
    }
    return { status: r.status, body: r.body };
  }

  /** Lo que la APK rechazaría, desde la última vez que se preguntó. */
  rechazos(): string[] {
    return this.problemas.splice(0);
  }

  /** Las operaciones que esta APK llama y todavía no tuvieron una respuesta exitosa leída con su esquema. */
  sinLeer(): string[] {
    return Object.keys(this.congelado.lecturas)
      .filter((op) => !this.leidas.has(op))
      .sort();
  }

  /** Los códigos de rechazo cuyo detalle esta APK lee con su esquema y todavía no se leyeron. */
  detallesSinLeer(): string[] {
    return Object.keys(this.congelado.errores.detalles)
      .filter((codigo) => !this.detallesLeidos.has(codigo))
      .sort();
  }

  private lectura(operacion: string): Lectura {
    const l = this.congelado.lecturas[operacion];
    if (!l) throw new Error(`La APK ${this.version} no llama ${operacion}: la prueba no la puede pedir en su nombre`);
    return l;
  }

  private esquema(clave: string, json: unknown): EsquemaLeido {
    let e = this.esquemas.get(clave);
    if (!e) {
      e = fromJSONSchema(json);
      this.esquemas.set(clave, e);
    }
    return e;
  }

  private revisar(operacion: string, clave: string, json: unknown, cuerpo: unknown): void {
    const r = this.esquema(clave, json).safeParse(cuerpo);
    if (!r.success) this.problemas.push(`APK ${this.version} · ${operacion}: ${resumen(r.error?.issues ?? [])}`);
    for (const regla of reglasQueElJsonNoDice(cuerpo)) this.problemas.push(`APK ${this.version} · ${operacion}: ${regla}`);
  }

  private revisarElRechazo(operacion: string, status: number, cuerpo: unknown): void {
    const sobre = this.esquema('ErrorEnvelopeSchema', this.congelado.errores.respuesta).safeParse(cuerpo);
    if (!sobre.success) {
      this.problemas.push(`APK ${this.version} · ${operacion}: el rechazo ${status} no tiene la forma que la APK reconoce (diría «respuesta no reconocida»): ${resumen(sobre.error?.issues ?? [])}`);
      return;
    }
    const error = (cuerpo as { error: { code: string; details?: unknown } }).error;
    const detalle = this.congelado.errores.detalles[error.code];
    if (!detalle) return;
    const leido = this.esquema(`detalle de ${error.code}`, detalle.respuesta).safeParse(error.details);
    if (leido.success) this.detallesLeidos.add(error.code);
    else this.problemas.push(`APK ${this.version} · ${operacion}: el detalle de ${error.code} no tiene la forma que la APK lee (${detalle.esquema}): ${resumen(leido.error?.issues ?? [])}`);
  }
}

/** Los problemas de zod en una línea: el campo, el código y, si sobran claves, cuáles. */
function resumen(issues: readonly Problema[]): string {
  return issues
    .slice(0, 8)
    .map((i) => `${i.path.map(String).join('.') || '(raíz)'} ${i.code}${i.keys?.length ? ` [${i.keys.join(', ')}]` : ''}: ${i.message}`)
    .join('; ');
}

/**
 * Las reglas de los esquemas de las APK que JSON Schema no representa (`noRepresentado` en lo congelado; la prueba del
 * dominio exige que no haya otras). Se revisan en cualquier lugar de la respuesta donde aparece esa forma:
 * - el rango de repeticiones de una serie termina después de empezar (`RepeticionesPrescriptasSchema`);
 * - un parámetro profesional numérico declara su unidad (`ParametroProfesionalSchema`);
 * - el objetivo de la próxima acción de una revisión termina su vigencia después de empezarla (`ContenidoDeObjetivo…`);
 * - un instante de un evento de tiempo es monotónico si y solo si trae su reloj (`InstanteDeEventoApiSchema`).
 */
export function reglasQueElJsonNoDice(valor: unknown, camino = '$'): string[] {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => reglasQueElJsonNoDice(v, `${camino}[${i}]`));
  if (!valor || typeof valor !== 'object') return [];
  const o = valor as Record<string, unknown>;
  const fallas: string[] = [];
  const repeticiones = o.repetitions as { min?: unknown; max?: unknown } | null | undefined;
  if (repeticiones && typeof repeticiones.min === 'number' && typeof repeticiones.max === 'number' && repeticiones.max < repeticiones.min) {
    fallas.push(`${camino}.repetitions: el rango termina antes de empezar`);
  }
  if (Array.isArray(o.professionalParameters)) {
    o.professionalParameters.forEach((x, i) => {
      const p = x as { value?: unknown; unit?: unknown };
      if (typeof p.value === 'number' && (typeof p.unit !== 'string' || p.unit.trim().length === 0)) fallas.push(`${camino}.professionalParameters[${i}]: un valor numérico sin unidad`);
    });
  }
  const objetivo = o.objective as { effectiveFrom?: unknown; effectiveUntil?: unknown } | null | undefined;
  if (objetivo && typeof objetivo.effectiveFrom === 'string' && typeof objetivo.effectiveUntil === 'string' && !(objetivo.effectiveUntil > objetivo.effectiveFrom)) {
    fallas.push(`${camino}.objective: la vigencia termina antes de empezar`);
  }
  const instante = o.at as { source?: unknown; monotonic?: unknown } | null | undefined;
  if (instante && typeof instante === 'object' && 'source' in instante && 'monotonic' in instante && (instante.source === 'MONOTONIC') !== (instante.monotonic !== null)) {
    fallas.push(`${camino}.at: el origen del instante no coincide con su reloj monotónico`);
  }
  for (const [clave, v] of Object.entries(o)) fallas.push(...reglasQueElJsonNoDice(v, `${camino}.${clave}`));
  return fallas;
}
