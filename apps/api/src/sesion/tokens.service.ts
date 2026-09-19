import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { ENTORNO } from '../config/tokens';
import type { Entorno } from '../config/entorno';
import { errores } from '../http/errores';

export interface ReclamosDeSesion {
  /** Identidad titular. */
  readonly sub: string;
  /** Id de la fila `Sesion` (la verdad está en la base, no en el token). */
  readonly sid: string;
  /** `ControlDeSesion.version` al emitir (tokenVersion, 07:1795). */
  readonly tv: number;
}

const EMISOR = 'be-api';
const AUDIENCIA = 'be';

/**
 * JWT HS256 corto (07 §43-bis, opción A+B; DEUDA_LEGAJO DL-012). El token solo identifica la fila de sesión:
 * «Un token puramente stateless sin lista de revocación no satisface esta política» (08 §26.1), por eso el guard
 * vuelve a la base en cada request. Algoritmo fijo: nunca se acepta el `alg` que declare el token.
 */
@Injectable()
export class TokensService {
  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  firmar(reclamos: ReclamosDeSesion, expiraEn: Date): string {
    const exp = Math.floor(expiraEn.getTime() / 1000);
    return jwt.sign({ sid: reclamos.sid, tv: reclamos.tv, exp }, this.entorno.jwtSecret, {
      algorithm: 'HS256',
      subject: reclamos.sub,
      issuer: EMISOR,
      audience: AUDIENCIA,
    });
  }

  /** @param ignorarExpiracion solo para el logout idempotente (API-ACC-03). */
  verificar(token: string, ignorarExpiracion = false): ReclamosDeSesion {
    try {
      const r = jwt.verify(token, this.entorno.jwtSecret, {
        algorithms: ['HS256'],
        issuer: EMISOR,
        audience: AUDIENCIA,
        ignoreExpiration: ignorarExpiracion,
      });
      if (typeof r !== 'object' || typeof r.sub !== 'string' || typeof r.sid !== 'string' || typeof r.tv !== 'number') {
        throw errores.sesionInvalida();
      }
      return { sub: r.sub, sid: r.sid, tv: r.tv };
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) throw errores.sesionExpirada();
      throw errores.sesionInvalida();
    }
  }
}

/** `Authorization: Bearer <token>` (09v7 T01). */
export function extraerBearer(encabezado: string | undefined): string | null {
  if (!encabezado) return null;
  const [esquema, valor, ...resto] = encabezado.trim().split(/\s+/);
  if (resto.length > 0 || esquema?.toLowerCase() !== 'bearer' || !valor) return null;
  return valor;
}
