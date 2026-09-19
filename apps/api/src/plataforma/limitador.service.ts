import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { isIPv4, isIPv6 } from 'node:net';
import { ENTORNO } from '../config/tokens';
import type { Entorno } from '../config/entorno';
import { errores } from '../http/errores';

export type LimiteNombrado = 'login' | 'loginPorIp' | 'registro';

/**
 * Rate limiting (08 §24.5; 09v12: «429 RATE_LIMITED con respuestas neutras»).
 * Ventana fija en memoria de la instancia única (DEUDA_LEGAJO DL-015). La clave no depende de que la cuenta exista:
 * un identificador inexistente consume el mismo cupo que uno real, así el 429 no es un oráculo de existencia.
 * Las claves se guardan hasheadas para no retener identificadores en claro en memoria de larga vida.
 * La dirección se agrupa por red (`redDe`): quien controla un /64 de IPv6 no obtiene un cupo por dirección.
 */
@Injectable()
export class LimitadorService {
  private readonly ventanas = new Map<string, { usados: number; vence: number }>();
  /** Reloj reemplazable en pruebas. */
  ahora: () => number = Date.now;

  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  /** Consume un intento del cupo `limite` para la red de `ip` y las partes adicionales (p. ej. el identificador). */
  consumir(limite: LimiteNombrado, ip: string | null, ...partes: (string | null | undefined)[]): void {
    const { maximo, ventanaMs } = this.entorno.limites[limite];
    const clave = createHash('sha256').update(`${limite}|${redDe(ip)}|${partes.map((p) => p ?? '').join('|')}`).digest('hex');
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

/**
 * Red a la que se aplica el cupo: IPv4 tal cual (también la mapeada en IPv6, `::ffff:a.b.c.d`) y, para IPv6, el
 * prefijo /64, que es la unidad mínima que se asigna a un cliente. Sin dirección conocida, una clave fija.
 */
export function redDe(ip: string | null): string {
  if (!ip) return 'sin-ip';
  const mapeada = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapeada && isIPv4(mapeada[1])) return mapeada[1];
  if (isIPv4(ip)) return ip;
  if (!isIPv6(ip)) return 'ip-no-reconocida';
  const [cabeza, cola = ''] = ip.split('%')[0].split('::');
  const izquierda = cabeza ? cabeza.split(':') : [];
  const derecha = ip.includes('::') && cola ? cola.split(':') : [];
  const completa = [...izquierda, ...Array(8 - izquierda.length - derecha.length).fill('0'), ...derecha];
  return `${completa.slice(0, 4).map((h) => parseInt(h, 16).toString(16)).join(':')}::/64`;
}
