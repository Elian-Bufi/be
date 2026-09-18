import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ENTORNO } from '../config/tokens';
import type { Entorno } from '../config/entorno';
import { errores } from '../http/errores';

export type LimiteNombrado = 'login' | 'registro';

/**
 * Rate limiting (08 §24.5; 09v12: «429 RATE_LIMITED con respuestas neutras»).
 * Ventana fija en memoria de la instancia única (DEUDA_LEGAJO DL-015). La clave no depende de que la cuenta exista:
 * un identificador inexistente consume el mismo cupo que uno real, así el 429 no es un oráculo de existencia.
 * Las claves se guardan hasheadas para no retener identificadores en claro en memoria de larga vida.
 */
@Injectable()
export class LimitadorService {
  private readonly ventanas = new Map<string, { usados: number; vence: number }>();
  /** Reloj reemplazable en pruebas. */
  ahora: () => number = Date.now;

  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  consumir(limite: LimiteNombrado, ...partes: (string | null | undefined)[]): void {
    const { maximo, ventanaMs } = this.entorno.limites[limite];
    const clave = createHash('sha256').update(`${limite}|${partes.map((p) => p ?? '').join('|')}`).digest('hex');
    const t = this.ahora();
    const actual = this.ventanas.get(clave);
    if (!actual || actual.vence <= t) {
      this.ventanas.set(clave, { usados: 1, vence: t + ventanaMs });
      this.limpiar(t);
      return;
    }
    actual.usados += 1;
    if (actual.usados > maximo) throw errores.limiteDeIntentos();
  }

  private limpiar(t: number): void {
    if (this.ventanas.size < 10_000) return;
    for (const [k, v] of this.ventanas) if (v.vence <= t) this.ventanas.delete(k);
  }
}
