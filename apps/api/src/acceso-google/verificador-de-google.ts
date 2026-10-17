import { Inject, Injectable, Logger } from '@nestjs/common';
import { identificadorLocalValido, normalizarIdentificadorLocal } from '@be/domain';
import { createPublicKey, verify as verificarFirma, type KeyObject } from 'node:crypto';
import { ENTORNO } from '../config/tokens';
import type { Entorno } from '../config/entorno';
import { AGENTE_DE_BE } from '../integraciones/proveedor-http';

/**
 * Lo único que BE toma de un ID token de Google verificado (DL-138): el identificador estable de la cuenta (`sub`, que
 * Google nunca reasigna) y su correo verificado, normalizado como el identificador local. Ni el nombre ni la foto: no
 * hacen falta para entrar (minimización).
 */
export interface CuentaDeGoogle {
  readonly sub: string;
  readonly correo: string;
}

export type MotivoDeTokenInvalido =
  | 'FORMA'
  | 'ALGORITMO'
  | 'CLAVE_DESCONOCIDA'
  | 'FIRMA'
  | 'EMISOR'
  | 'AUDIENCIA'
  | 'VENCIDO'
  | 'TODAVIA_NO_VALIDO'
  | 'VIGENCIA_EXCESIVA'
  | 'SUJETO'
  | 'CORREO';

/** UC-E05 E03, «resultado no verificable»: no se abre nada. El motivo queda solo en la auditoría. */
export class TokenDeGoogleInvalido extends Error {
  constructor(readonly motivo: MotivoDeTokenInvalido) {
    super(`ID token de Google no válido: ${motivo}`);
  }
}

/** Google no verificó el correo: BE no lo usa para encontrar ni para crear una cuenta. */
export class CorreoDeGoogleNoVerificado extends Error {
  constructor() {
    super('el correo de la cuenta de Google no está verificado');
  }
}

/** UC-E05 E01: sin client IDs configurados, o sin las claves de Google. El acceso local sigue. */
export class GoogleNoDisponible extends Error {
  constructor(readonly motivo: 'GOOGLE_NO_CONFIGURADO' | 'CLAVES_NO_DISPONIBLES') {
    super(`Google no disponible: ${motivo}`);
  }
}

/** Los dos valores de `iss` que Google documenta para sus ID tokens. */
export const EMISORES_DE_GOOGLE: readonly string[] = ['accounts.google.com', 'https://accounts.google.com'];
/** Tolerancia de reloj, en segundos, para `exp`, `iat` y `nbf`: chica, para no estirar la vida del token. */
export const TOLERANCIA_DE_RELOJ_S = 60;
/** Un ID token de Google dura una hora; uno que diga durar más de un día no es de Google (como google-auth-library). */
const VIGENCIA_MAXIMA_S = 24 * 60 * 60;
/** Una clave desconocida obliga a releer las de Google (las rota), pero como mucho una vez por minuto. */
export const ESPERA_ENTRE_CONSULTAS_MS = 60_000;
/** La vigencia de las claves leídas: la de su Cache-Control, entre un minuto y un día; sin max-age, cinco minutos. */
const VIGENCIA_MINIMA_DE_CLAVES_MS = 60_000;
const VIGENCIA_MAXIMA_DE_CLAVES_MS = 24 * 60 * 60 * 1000;
const VIGENCIA_POR_DEFECTO_DE_CLAVES_MS = 5 * 60_000;
/** Unas pocas claves RSA ocupan un par de kilobytes: algo mucho mayor no es la respuesta de Google. */
const TAMANO_MAXIMO_DE_CLAVES = 64 * 1024;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
/** Google documenta el `sub` como hasta 255 caracteres ASCII, sensible a mayúsculas. */
const SUB = /^[!-~]{1,255}$/;

/**
 * Verifica ID tokens de Google en la propia API (DL-138), sin dependencias nuevas: las claves públicas de Google (JWKS)
 * se leen de `GOOGLE_JWKS_URL` y se guardan según su Cache-Control; la firma RS256 se verifica con `node:crypto`.
 * - **El algoritmo es fijo** (RS256): nunca el que declare el token (sin `none`, sin HS256 con la clave pública).
 * - **Emisor, audiencia, vencimiento y correo verificado** se exigen todos (`iss`, `aud` ∈ client IDs de BE, `exp`/`iat`
 *   con una tolerancia chica, `email_verified === true`).
 * - **El token nunca se registra**: ni en los logs ni en la auditoría ni en un error. Solo el motivo de un rechazo.
 * - **Sin las claves de Google** se siguen usando las últimas leídas (Google las publica con días de margen); sin ninguna,
 *   503 con el acceso local disponible.
 */
@Injectable()
export class VerificadorDeGoogle {
  private readonly registro = new Logger('VerificadorDeGoogle');
  private claves = new Map<string, KeyObject>();
  private vigentesHasta = 0;
  private ultimaConsulta = Number.NEGATIVE_INFINITY;
  private consultaEnCurso: Promise<void> | null = null;
  /** Reloj reemplazable en pruebas. */
  ahora: () => number = Date.now;

  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  /** Con al menos un client ID configurado. Sin ninguno, la familia GOO responde 503 (UC-E05 E01). */
  get configurado(): boolean {
    return this.entorno.google.clientIds.length > 0;
  }

  async verificar(idToken: string): Promise<CuentaDeGoogle> {
    if (!this.configurado) throw new GoogleNoDisponible('GOOGLE_NO_CONFIGURADO');
    const partes = idToken.split('.');
    if (partes.length !== 3 || !partes.every((p) => BASE64URL.test(p))) throw new TokenDeGoogleInvalido('FORMA');
    const [crudoDelEncabezado, crudoDeLosReclamos, crudoDeLaFirma] = partes as [string, string, string];
    const encabezado = jsonDe(crudoDelEncabezado);
    const reclamos = jsonDe(crudoDeLosReclamos);
    if (!encabezado || !reclamos) throw new TokenDeGoogleInvalido('FORMA');
    if (encabezado.alg !== 'RS256') throw new TokenDeGoogleInvalido('ALGORITMO');
    if (typeof encabezado.kid !== 'string' || encabezado.kid.length === 0) throw new TokenDeGoogleInvalido('CLAVE_DESCONOCIDA');

    const clave = await this.claveDe(encabezado.kid);
    const firmaValida = verificarFirma('RSA-SHA256', Buffer.from(`${crudoDelEncabezado}.${crudoDeLosReclamos}`), clave, Buffer.from(crudoDeLaFirma, 'base64url'));
    if (!firmaValida) throw new TokenDeGoogleInvalido('FIRMA');

    if (typeof reclamos.iss !== 'string' || !EMISORES_DE_GOOGLE.includes(reclamos.iss)) throw new TokenDeGoogleInvalido('EMISOR');
    const audiencias = Array.isArray(reclamos.aud) ? reclamos.aud : [reclamos.aud];
    const propias = this.entorno.google.clientIds;
    if (audiencias.length === 0 || !audiencias.every((a) => typeof a === 'string') || !audiencias.some((a) => propias.includes(a as string))) {
      throw new TokenDeGoogleInvalido('AUDIENCIA');
    }
    // Con más de una audiencia, la parte autorizada (`azp`) tiene que ser un cliente de BE (OpenID Connect Core §3.1.3.7).
    if (audiencias.length > 1 && (typeof reclamos.azp !== 'string' || !propias.includes(reclamos.azp))) throw new TokenDeGoogleInvalido('AUDIENCIA');

    const ahoraS = Math.floor(this.ahora() / 1000);
    if (typeof reclamos.exp !== 'number' || typeof reclamos.iat !== 'number') throw new TokenDeGoogleInvalido('FORMA');
    if (ahoraS > reclamos.exp + TOLERANCIA_DE_RELOJ_S) throw new TokenDeGoogleInvalido('VENCIDO');
    if (reclamos.iat > ahoraS + TOLERANCIA_DE_RELOJ_S) throw new TokenDeGoogleInvalido('TODAVIA_NO_VALIDO');
    if (typeof reclamos.nbf === 'number' && reclamos.nbf > ahoraS + TOLERANCIA_DE_RELOJ_S) throw new TokenDeGoogleInvalido('TODAVIA_NO_VALIDO');
    if (reclamos.exp - reclamos.iat > VIGENCIA_MAXIMA_S) throw new TokenDeGoogleInvalido('VIGENCIA_EXCESIVA');

    if (typeof reclamos.sub !== 'string' || !SUB.test(reclamos.sub)) throw new TokenDeGoogleInvalido('SUJETO');
    const correo = typeof reclamos.email === 'string' ? normalizarIdentificadorLocal(reclamos.email) : '';
    if (!identificadorLocalValido(correo)) throw new TokenDeGoogleInvalido('CORREO');
    // Solo `true`: un valor ausente, `false` o el texto "true" no alcanzan (DL-138).
    if (reclamos.email_verified !== true) throw new CorreoDeGoogleNoVerificado();
    return { sub: reclamos.sub, correo };
  }

  private async claveDe(kid: string): Promise<KeyObject> {
    if (this.claves.size === 0 || this.ahora() >= this.vigentesHasta) await this.consultar();
    let clave = this.claves.get(kid);
    if (!clave && this.ahora() - this.ultimaConsulta >= ESPERA_ENTRE_CONSULTAS_MS) {
      // Google rota sus claves: una desconocida puede ser nueva. Se vuelve a leer, como mucho una vez por minuto, para
      // que un token con un `kid` inventado no haga que BE consulte a Google en cada pedido.
      await this.consultar();
      clave = this.claves.get(kid);
    }
    if (!clave) throw new TokenDeGoogleInvalido('CLAVE_DESCONOCIDA');
    return clave;
  }

  /** Una sola lectura a la vez: los pedidos simultáneos esperan la misma. */
  private consultar(): Promise<void> {
    this.consultaEnCurso ??= this.leer().finally(() => {
      this.consultaEnCurso = null;
    });
    return this.consultaEnCurso;
  }

  private async leer(): Promise<void> {
    this.ultimaConsulta = this.ahora();
    try {
      const { claves, vigenciaMs } = await leerClavesDeGoogle(this.entorno.google.jwksUrl, this.entorno.google.presupuestoMs);
      this.claves = claves;
      this.vigentesHasta = this.ahora() + vigenciaMs;
    } catch (e) {
      // Sin la URL ni el token en el mensaje: solo el motivo.
      this.registro.warn(`No se pudieron leer las claves de Google: ${e instanceof Error ? e.message : 'desconocido'}`);
      if (this.claves.size === 0) throw new GoogleNoDisponible('CLAVES_NO_DISPONIBLES');
      // Se siguen usando las que había, y se vuelve a probar en un minuto.
      this.vigentesHasta = this.ahora() + ESPERA_ENTRE_CONSULTAS_MS;
    }
  }
}

/** Un objeto JSON desde base64url, o `null` si no lo es. */
function jsonDe(crudo: string): Record<string, unknown> | null {
  try {
    const valor: unknown = JSON.parse(Buffer.from(crudo, 'base64url').toString('utf8'));
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Lee el JWKS: con presupuesto de tiempo, sin seguir redirecciones (como WP-08 D-E), con tope de tamaño, y solo claves
 * RSA de firma. Devuelve también cuánto valen según el Cache-Control.
 */
export async function leerClavesDeGoogle(url: string, presupuestoMs: number): Promise<{ readonly claves: Map<string, KeyObject>; readonly vigenciaMs: number }> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), presupuestoMs);
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': AGENTE_DE_BE }, signal: controlador.signal, redirect: 'manual' });
    if (r.status !== 200) {
      await r.body?.cancel().catch(() => undefined);
      throw new Error(`status ${r.status}`);
    }
    const declarado = Number(r.headers.get('content-length'));
    if (Number.isFinite(declarado) && declarado > TAMANO_MAXIMO_DE_CLAVES) {
      await r.body?.cancel().catch(() => undefined);
      throw new Error('respuesta demasiado grande');
    }
    const texto = await r.text();
    if (Buffer.byteLength(texto) > TAMANO_MAXIMO_DE_CLAVES) throw new Error('respuesta demasiado grande');
    const cuerpo = JSON.parse(texto) as { keys?: unknown };
    const claves = new Map<string, KeyObject>();
    for (const jwk of Array.isArray(cuerpo.keys) ? cuerpo.keys : []) {
      if (!jwk || typeof jwk !== 'object') continue;
      const { kty, kid, n, e, alg, use } = jwk as Record<string, unknown>;
      if (kty !== 'RSA' || typeof kid !== 'string' || typeof n !== 'string' || typeof e !== 'string') continue;
      if ((alg !== undefined && alg !== 'RS256') || (use !== undefined && use !== 'sig')) continue;
      try {
        claves.set(kid, createPublicKey({ key: { kty: 'RSA', n, e }, format: 'jwk' }));
      } catch {
        // Una clave mal formada no invalida las demás.
      }
    }
    if (claves.size === 0) throw new Error('sin claves RSA de firma');
    return { claves, vigenciaMs: vigenciaSegun(r.headers.get('cache-control')) };
  } finally {
    clearTimeout(temporizador);
  }
}

/** La vigencia que pide el Cache-Control (`max-age`), acotada; `no-store` o `no-cache`, el mínimo. */
export function vigenciaSegun(cacheControl: string | null): number {
  if (!cacheControl) return VIGENCIA_POR_DEFECTO_DE_CLAVES_MS;
  if (/\b(no-store|no-cache)\b/i.test(cacheControl)) return VIGENCIA_MINIMA_DE_CLAVES_MS;
  const maxAge = cacheControl.match(/\bmax-age=(\d+)\b/i);
  if (!maxAge) return VIGENCIA_POR_DEFECTO_DE_CLAVES_MS;
  return Math.min(VIGENCIA_MAXIMA_DE_CLAVES_MS, Math.max(VIGENCIA_MINIMA_DE_CLAVES_MS, Number(maxAge[1]) * 1000));
}
