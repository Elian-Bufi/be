import { Inject, Injectable } from '@nestjs/common';
import { VIGENCIA_DE_LA_DESCARGA_SEGUNDOS } from '@be/domain';
import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * UF-06 (DL-169; 09 v0.12 §15: «una URL de descarga, si existe, es temporal y autenticada/firmada»; 08 §21: 15 minutos
 * como máximo): la ruta firmada de la descarga de una exportación propia. Es la misma construcción que las de los medios
 * (`medios/rutas-firmadas.ts`), con otra clave derivada: una ruta de un medio no abre una exportación ni al revés.
 * - El token es `carga.firma` en base64url; la carga lleva la exportación y el vencimiento, nada de la persona.
 * - HMAC-SHA256 con una clave derivada (HKDF) del secreto del servidor, comparado en tiempo constante.
 * - Alterada, vencida o de otra clase: `null`, y quien llama responde el mismo 404 que lo inexistente.
 */
@Injectable()
export class RutaDeExportacion {
  private readonly clave: Buffer;
  /** Reloj reemplazable en pruebas. */
  ahora: () => number = Date.now;

  constructor(@Inject(ENTORNO) entorno: Entorno) {
    this.clave = Buffer.from(hkdfSync('sha256', entorno.jwtSecret, 'be-exportaciones-propias', 'rutas-firmadas-de-exportaciones-v1', 32));
  }

  /** Vencimiento de una ruta nueva: 15 minutos desde ahora. */
  vencimiento(): Date {
    return new Date(Math.floor(this.ahora() / 1000) * 1000 + VIGENCIA_DE_LA_DESCARGA_SEGUNDOS * 1000);
  }

  firmar(exportacionId: string, vence: Date): string {
    const carga = Buffer.from(`e.${exportacionId}.${Math.floor(vence.getTime() / 1000)}`, 'utf8').toString('base64url');
    return `${carga}.${this.firma(carga).toString('base64url')}`;
  }

  /** La exportación de una ruta válida y vigente; `null` en cualquier otro caso. */
  verificar(token: string): { readonly exportacionId: string; readonly vence: Date } | null {
    if (typeof token !== 'string' || token.length > 256 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
    const [carga, firma] = token.split('.') as [string, string];
    const esperada = this.firma(carga);
    const recibida = Buffer.from(firma, 'base64url');
    if (recibida.toString('base64url') !== firma) return null;
    if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
    const [letra, exportacionId, vence] = Buffer.from(carga, 'base64url').toString('utf8').split('.');
    if (letra !== 'e' || !exportacionId || !UUID.test(exportacionId) || !vence || !/^\d{1,12}$/.test(vence)) return null;
    const venceEn = new Date(Number(vence) * 1000);
    if (venceEn.getTime() <= this.ahora()) return null;
    return { exportacionId, vence: venceEn };
  }

  private firma(carga: string): Buffer {
    return createHmac('sha256', this.clave).update(carga, 'utf8').digest();
  }
}
