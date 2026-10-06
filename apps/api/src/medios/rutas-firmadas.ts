import { Inject, Injectable } from '@nestjs/common';
import { LIMITES_DE_MEDIO } from '@be/domain';
import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';
import { ENTORNO } from '../config/tokens';
import type { Entorno } from '../config/entorno';

/** Para qué sirve una ruta firmada: subir los bytes (API-MED-02) o leerlos (API-MED-04). Una no vale por la otra. */
export type PropositoDeRuta = 'SUBIDA' | 'LECTURA';

const LETRA: Readonly<Record<PropositoDeRuta, string>> = { SUBIDA: 's', LECTURA: 'l' };
const VIGENCIA_SEGUNDOS: Readonly<Record<PropositoDeRuta, number>> = {
  SUBIDA: LIMITES_DE_MEDIO.vigenciaDeSubidaSegundos,
  LECTURA: LIMITES_DE_MEDIO.vigenciaDeLecturaSegundos,
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * DL-120 · rutas firmadas de los medios privados (09v12 §24; 08 §21: URL de 15 minutos como máximo).
 * - El token es `carga.firma`, los dos en base64url: solo `[A-Za-z0-9._-]`. La carga lleva el propósito, el medio y el
 *   vencimiento; no lleva nada de la persona.
 * - La firma es HMAC-SHA256 con una clave **derivada** (HKDF) del secreto del servidor, el mismo que firma las sesiones:
 *   no hay otra credencial que custodiar, y la clave de las rutas no sirve para firmar una sesión ni al revés.
 * - Se compara en tiempo constante. Un token alterado, vencido o de otro propósito no se distingue de uno inexistente:
 *   quien llama responde el mismo 404.
 * - La identidad del medio no es la ruta: la ruta vence, el medio no.
 */
@Injectable()
export class RutasFirmadas {
  private readonly clave: Buffer;
  /** Reloj reemplazable en pruebas. */
  ahora: () => number = Date.now;

  constructor(@Inject(ENTORNO) entorno: Entorno) {
    this.clave = Buffer.from(hkdfSync('sha256', entorno.jwtSecret, 'be-medios-privados', 'rutas-firmadas-de-medios-v1', 32));
  }

  /** Vencimiento de una ruta nueva de ese propósito, a partir de ahora. */
  vencimiento(proposito: PropositoDeRuta): Date {
    return new Date(Math.floor(this.ahora() / 1000) * 1000 + VIGENCIA_SEGUNDOS[proposito] * 1000);
  }

  firmar(medioId: string, proposito: PropositoDeRuta, vence: Date): string {
    const carga = Buffer.from(`${LETRA[proposito]}.${medioId}.${Math.floor(vence.getTime() / 1000)}`, 'utf8').toString('base64url');
    return `${carga}.${this.firma(carga).toString('base64url')}`;
  }

  /** El medio de una ruta válida, vigente y de ese propósito; `null` en cualquier otro caso. */
  verificar(token: string, proposito: PropositoDeRuta): { readonly medioId: string; readonly vence: Date } | null {
    if (typeof token !== 'string' || token.length > 256 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
    const [carga, firma] = token.split('.') as [string, string];
    const esperada = this.firma(carga);
    const recibida = Buffer.from(firma, 'base64url');
    if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
    const [letra, medioId, vence] = Buffer.from(carga, 'base64url').toString('utf8').split('.');
    if (letra !== LETRA[proposito] || !medioId || !UUID.test(medioId) || !vence || !/^\d{1,12}$/.test(vence)) return null;
    const venceEn = new Date(Number(vence) * 1000);
    if (venceEn.getTime() <= this.ahora()) return null;
    return { medioId, vence: venceEn };
  }

  private firma(carga: string): Buffer {
    return createHmac('sha256', this.clave).update(carga, 'utf8').digest();
  }
}
