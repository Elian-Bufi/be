import type { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import type { AlmacenDeMedios } from '../medios/almacen-de-medios';
import { curarImagen, curarZonas, TIEMPOS_DE_LA_CURADURIA } from './curaduria';

/**
 * HALLAZGO-P2028 · las dos transacciones de la curaduría no usan los 5 s por omisión de Prisma, que vencen cuando el comando
 * corre contra una base remota. Sin base: un cliente falso que anota las opciones de cada transacción y no la abre (lo que
 * pasa adentro lo prueba la integración, en test/integration/catalogo-visual.int-spec.ts).
 */
function baseFalsa() {
  const opciones: unknown[] = [];
  const prisma = {
    $transaction: async (...args: unknown[]) => {
      opciones.push(args[1]);
      return [];
    },
  } as unknown as PrismaClient;
  return { prisma, opciones };
}

const SENTADILLA = '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01';
const OPERADOR = { operador: 'Prueba unitaria', fundamento: 'HALLAZGO-P2028', escribir: false };

describe('HALLAZGO-P2028 · los tiempos de las transacciones de la curaduría', () => {
  it('dejan margen para una base remota: más que los 5 s de Prisma para la transacción y que sus 2 s para abrirla', () => {
    expect(TIEMPOS_DE_LA_CURADURIA.timeout).toBeGreaterThanOrEqual(60_000);
    expect(TIEMPOS_DE_LA_CURADURIA.maxWait).toBeGreaterThan(2_000);
  });

  it('las zonas abren su transacción con esos tiempos', async () => {
    const { prisma, opciones } = baseFalsa();
    await curarZonas(prisma, [{ exerciseId: SENTADILLA, muscleZones: [{ zoneId: 'pectoral', role: 'PRIMARY' }] }], OPERADOR);
    expect(opciones).toEqual([TIEMPOS_DE_LA_CURADURIA]);
  });

  it('la imagen también, después de procesarla fuera de la transacción', async () => {
    const { prisma, opciones } = baseFalsa();
    const bytes = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 30, g: 120, b: 200 } } })
      .png()
      .toBuffer();
    await curarImagen(
      prisma,
      {} as AlmacenDeMedios,
      {
        exerciseId: SENTADILLA,
        bytes,
        contentType: 'image/png',
        provenance: 'AI_GENERATED',
        authorship: 'Generada en la prueba (ninguna foto real)',
        altText: 'Un cuadrado azul liso',
        license: { kind: 'NO_EXTERNAL_LICENSE', usage: 'Solo para la prueba' },
        technicalReview: 'PENDING_PROFESSIONAL_REVIEW',
      },
      { ...OPERADOR, curador: 'curadora@example.invalid' },
    );
    expect(opciones).toEqual([TIEMPOS_DE_LA_CURADURIA]);
  });
});
