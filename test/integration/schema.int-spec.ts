/**
 * El schema desplegado coincide con el 06 (WP-01 §3).
 * T-06-01 Identidad BE · T-06-02 Estado operativo de cuenta · T-06-24 / REG-06-18 par temporal.
 */
import { EstadoOperativoDeCuenta, ESTADO_INICIAL_DE_CUENTA } from '@be/domain';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

/** Ejecuta dentro de una transacción que siempre se revierte: la base queda sin filas de Identidad (DL-003). */
async function sinPersistir(fn: (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => Promise<void>): Promise<void> {
  const REVERTIR = new Error('revertir');
  await expect(
    prisma.$transaction(async (tx) => {
      await fn(tx);
      throw REVERTIR;
    }),
  ).rejects.toBe(REVERTIR);
}

describe('Schema vs 06 — TEST-RUN-003 migration deploy', () => {
  it('la migración inicial quedó aplicada por migrate deploy', async () => {
    const filas = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    expect(filas.map((f) => f.migration_name)).toContain('20260916180000_identidad');
  });

  it('T-06-02: el enum de la base es exactamente el conjunto cerrado de @be/domain (06 §5.7.2)', async () => {
    const filas = await prisma.$queryRaw<{ valor: string }[]>`
      SELECT e.enumlabel AS valor FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'EstadoOperativoDeCuenta' ORDER BY e.enumsortorder`;
    expect(filas.map((f) => f.valor)).toEqual(Object.values(EstadoOperativoDeCuenta));
  });

  it('T-06-01/T-06-02/T-06-24: columnas de identidad con nulabilidad y defaults del 06', async () => {
    const columnas = await prisma.$queryRaw<{ columna: string; nulable: string; tipo: string; defecto: string | null }[]>`
      SELECT column_name AS columna, is_nullable AS nulable, udt_name AS tipo, column_default AS defecto
      FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'identidad'
      ORDER BY ordinal_position`;
    expect(columnas).toEqual([
      { columna: 'id', nulable: 'NO', tipo: 'uuid', defecto: 'gen_random_uuid()' },
      { columna: 'estado_operativo_de_cuenta', nulable: 'NO', tipo: 'EstadoOperativoDeCuenta', defecto: `'${ESTADO_INICIAL_DE_CUENTA}'::"EstadoOperativoDeCuenta"` },
      { columna: 'momento_de_ocurrencia', nulable: 'YES', tipo: 'timestamptz', defecto: null },
      { columna: 'momento_de_registro', nulable: 'NO', tipo: 'timestamptz', defecto: 'CURRENT_TIMESTAMP' },
    ]);
  });

  it('los estados son enums, nunca booleanos: no hay columnas boolean en el schema', async () => {
    const [{ cantidad }] = await prisma.$queryRaw<{ cantidad: bigint }[]>`
      SELECT count(*) AS cantidad FROM information_schema.columns
      WHERE table_schema = current_schema() AND data_type = 'boolean'`;
    expect(Number(cantidad)).toBe(0);
  });

  it('REG-06-18: ocurrencia desconocida queda NULL; el registro no se copia en su lugar', async () => {
    await sinPersistir(async (tx) => {
      const identidad = await tx.identidad.create({ data: {} });
      expect(identidad.momentoDeOcurrencia).toBeNull();
      expect(identidad.momentoDeRegistro).toBeInstanceOf(Date);
      expect(identidad.estadoOperativoDeCuenta).toBe('OPERATIVA');
      expect(identidad.id).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  it('T-06-02: un valor fuera del conjunto cerrado es rechazado por la base', async () => {
    await expect(
      prisma.$executeRawUnsafe(`INSERT INTO identidad (estado_operativo_de_cuenta) VALUES ('ACTIVA')`),
    ).rejects.toThrow();
  });

  it('la base no contiene filas de Identidad (sin seed, DEUDA_LEGAJO DL-003)', async () => {
    expect(await prisma.identidad.count()).toBe(0);
  });
});
