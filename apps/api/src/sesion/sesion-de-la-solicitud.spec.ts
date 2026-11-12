/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-T17 y UF-T22) · la sesión del pedido falla cerrada (revisión adversarial de la etapa 2):
 * `SesionGuard` sin el contexto del pedido no deja pasar, en vez de dejar que un profesional sin el segundo factor actúe
 * como profesional (`puedeActuarComoProfesional` responde «sin condición» cuando no hay sesión anotada).
 */
import type { ExecutionContext } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { anotarLaSesionDelPedido, dentroDeUnPedido, puedeActuarComoProfesional } from './sesion-de-la-solicitud';
import { SesionGuard } from './sesion.guard';
import type { TokensService } from './tokens.service';

const PROFESIONAL = '00000000-0000-4000-8000-0000000000a1';
const SESION = '00000000-0000-4000-8000-0000000000b1';

/** Un profesional con autenticador activo, en una sesión que todavía no escribió el código: REQUERIDO. */
function guardDeUnProfesionalSinElCodigo(): SesionGuard {
  const prisma = {
    sesion: {
      findUnique: async () => ({
        identidadId: PROFESIONAL,
        estado: 'ACTIVA',
        expiraEn: new Date(Date.now() + 60 * 60 * 1000),
        momentoDeOcurrencia: new Date(Date.now() - 60 * 60 * 1000),
        versionDeControl: 1,
        clase: 'PERSONAL',
        segundoFactor: { verificadoEn: null, metodo: null },
        identidad: { estadoOperativoDeCuenta: 'OPERATIVA', controlDeSesion: { version: 1 }, perfilProfesional: { id: 'perfil' }, factoresTotp: [{ id: 'factor' }] },
      }),
    },
  } as unknown as PrismaService;
  const tokens = { verificar: () => ({ sid: SESION, sub: PROFESIONAL, tv: 1 }) } as unknown as TokensService;
  return new SesionGuard(prisma, tokens);
}

const contextoHttp = (req: Record<string, unknown>): ExecutionContext => ({ switchToHttp: () => ({ getRequest: () => req }) }) as unknown as ExecutionContext;
const pedido = () => ({ get: (h: string) => (h.toLowerCase() === 'authorization' ? 'Bearer token-sintetico' : undefined) });

describe('la sesión del pedido (UF-11)', () => {
  it('anotar la sesión fuera de un pedido falla, en vez de dejar lo profesional sin condición', () => {
    expect(() => anotarLaSesionDelPedido({ identidadId: PROFESIONAL, sesionId: SESION, segundoFactor: { estado: 'REQUERIDO' } })).toThrow(/contexto/);
  });

  it('SesionGuard sin el contexto del pedido no deja pasar', async () => {
    await expect(guardDeUnProfesionalSinElCodigo().canActivate(contextoHttp(pedido()))).rejects.toThrow(/contexto/);
  });

  it('dentro de un pedido, el profesional sin el código no actúa como profesional; como persona ajena, sin condición', async () => {
    await dentroDeUnPedido(async () => {
      expect(await guardDeUnProfesionalSinElCodigo().canActivate(contextoHttp(pedido()))).toBe(true);
      expect(puedeActuarComoProfesional(PROFESIONAL)).toBe(false);
      expect(puedeActuarComoProfesional('00000000-0000-4000-8000-0000000000c1')).toBe(true);
    });
  });
});
