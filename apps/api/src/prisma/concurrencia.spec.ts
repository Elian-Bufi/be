import { Prisma } from '@prisma/client';
import { esViolacionDeUnicidad, sinDuplicar } from './concurrencia';

const errorDePrisma = (code: string) => new Prisma.PrismaClientKnownRequestError('sintético', { code, clientVersion: 'prueba' });

describe('sinDuplicar — una violación de unicidad bajo concurrencia sale como el 409 de la operación', () => {
  it('reconoce solo P2002 como violación de unicidad', () => {
    expect(esViolacionDeUnicidad(errorDePrisma('P2002'))).toBe(true);
    expect(esViolacionDeUnicidad(errorDePrisma('P2025'))).toBe(false);
    expect(esViolacionDeUnicidad(new Error('P2002'))).toBe(false);
  });

  it('devuelve el resultado de la escritura cuando no hay conflicto', async () => {
    await expect(sinDuplicar(Promise.resolve(7), () => new Error('no debería'))).resolves.toBe(7);
  });

  it('traduce P2002 al error que indica la operación', async () => {
    const conflicto = new Error('409 del nombre');
    await expect(sinDuplicar(Promise.reject(errorDePrisma('P2002')), () => conflicto)).rejects.toBe(conflicto);
  });

  it('cualquier otro error pasa sin cambios (el filtro global decide)', async () => {
    const otro = errorDePrisma('P2028');
    await expect(sinDuplicar(Promise.reject(otro), () => new Error('no debería'))).rejects.toBe(otro);
  });
});
