/**
 * El schema desplegado coincide con el 06 y sostiene sus garantías aunque el código se equivoque.
 * T-06-01 Identidad BE · T-06-02 Estado operativo · T-06-24 / REG-06-18 par temporal · INV-06-22 · 08 §12.2 · 08 §29
 */
import {
  ALCANCES,
  CATALOGO_DE_TEXTOS,
  DIMENSIONES_DE_AUTORIZACION,
  EstadoDeAlcanceDeVinculo,
  EstadoDeHabilitacion,
  EstadoDeSolicitudDeVinculo,
  EstadoDeVerificacionProfesional,
  EstadoOperativoDeCuenta,
  ESTADO_INICIAL_DE_CUENTA,
  Finalidad,
  SituacionDeConsentimiento,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'SCHEMA', superficie: null, requestId: null };

/** Ejecuta dentro de una transacción que siempre se revierte. */
async function sinPersistir(fn: (tx: Tx) => Promise<void>): Promise<void> {
  const REVERTIR = new Error('revertir');
  await expect(
    prisma.$transaction(async (tx) => {
      await fn(tx);
      throw REVERTIR;
    }),
  ).rejects.toBe(REVERTIR);
}

describe('Schema vs 06 — TEST-RUN-003 migration deploy', () => {
  it('TEST-RUN-003: las migraciones de WP-01, WP-02 y WP-03 quedaron aplicadas por migrate deploy', async () => {
    const filas = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    expect(filas.map((f) => f.migration_name)).toEqual(
      expect.arrayContaining([
        '20260916180000_identidad',
        '20260918200000_identidad_y_sesiones',
        '20260919200000_wp03_valores_de_enum',
        '20260919200100_vinculo_consentimiento_y_pdp',
      ]),
    );
  });

  it('T-06-02: el enum de la base es exactamente el conjunto cerrado de @be/domain (06 §5.7.2)', async () => {
    const filas = await prisma.$queryRaw<{ valor: string }[]>`
      SELECT e.enumlabel AS valor FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'EstadoOperativoDeCuenta' ORDER BY e.enumsortorder`;
    expect(filas.map((f) => f.valor)).toEqual(Object.values(EstadoOperativoDeCuenta));
  });

  it.each([
    ['Alcance', [...ALCANCES]],
    ['Finalidad', Object.values(Finalidad)],
    ['EstadoDeVerificacionProfesional', Object.values(EstadoDeVerificacionProfesional)],
    ['EstadoDeHabilitacion', Object.values(EstadoDeHabilitacion)],
    ['EstadoDeSolicitudDeVinculo', Object.values(EstadoDeSolicitudDeVinculo)],
    ['EstadoDeAlcanceDeVinculo', Object.values(EstadoDeAlcanceDeVinculo)],
    ['SituacionDeConsentimiento', Object.values(SituacionDeConsentimiento)],
    ['DimensionDeAutorizacion', [...DIMENSIONES_DE_AUTORIZACION]],
  ])('WP-03 · el enum %s de la base es exactamente el conjunto de @be/domain (06 §6.8, §7; RF-021)', async (tipo, valores) => {
    const filas = await prisma.$queryRaw<{ valor: string }[]>`
      SELECT e.enumlabel AS valor FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = ${tipo} ORDER BY e.enumsortorder`;
    expect(filas.map((f) => f.valor)).toEqual(valores);
  });

  it('T-06-01/T-06-02/T-06-24: columnas de identidad del 06 §5.4.2 con nulabilidad y defaults', async () => {
    const columnas = await prisma.$queryRaw<{ columna: string; nulable: string; tipo: string; defecto: string | null }[]>`
      SELECT column_name AS columna, is_nullable AS nulable, udt_name AS tipo, column_default AS defecto
      FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'identidad'
      ORDER BY column_name`;
    expect(columnas).toEqual([
      { columna: 'autoria_de_creacion_id', nulable: 'NO', tipo: 'uuid', defecto: null },
      { columna: 'estado_operativo_de_cuenta', nulable: 'NO', tipo: 'EstadoOperativoDeCuenta', defecto: `'${ESTADO_INICIAL_DE_CUENTA}'::"EstadoOperativoDeCuenta"` },
      { columna: 'id', nulable: 'NO', tipo: 'uuid', defecto: 'gen_random_uuid()' },
      { columna: 'momento_de_ocurrencia', nulable: 'YES', tipo: 'timestamptz', defecto: null },
      { columna: 'momento_de_registro', nulable: 'NO', tipo: 'timestamptz', defecto: 'CURRENT_TIMESTAMP' },
      { columna: 'procedencia', nulable: 'NO', tipo: 'jsonb', defecto: null },
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
      const identidad = await tx.identidad.create({ data: { autoriaDeCreacionId: '00000000-0000-4000-8000-000000000000', procedencia: PROCEDENCIA } });
      expect(identidad.momentoDeOcurrencia).toBeNull();
      expect(identidad.momentoDeRegistro).toBeInstanceOf(Date);
      expect(identidad.estadoOperativoDeCuenta).toBe('OPERATIVA');
    });
  });

  it('T-06-02: un valor fuera del conjunto cerrado es rechazado por la base', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO identidad (autoria_de_creacion_id, procedencia, estado_operativo_de_cuenta) VALUES (gen_random_uuid(), '{}'::jsonb, 'ACTIVA')`,
      ),
    ).rejects.toThrow(/invalid input value for enum/);
  });
});

describe('INV-06-22 — exactamente un Perfil propio por Identidad', () => {
  it('INV-06-22: una Identidad sin Perfil propio no puede confirmarse (constraint trigger diferido)', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.identidad.create({ data: { autoriaDeCreacionId: '00000000-0000-4000-8000-000000000000', procedencia: PROCEDENCIA } });
      }),
    ).rejects.toThrow(/INV-06-22/);
  });

  it('INV-06-22: un segundo Perfil propio para la misma Identidad viola el índice único', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const identidad = await tx.identidad.create({ data: { autoriaDeCreacionId: '00000000-0000-4000-8000-000000000000', procedencia: PROCEDENCIA } });
        await tx.perfilPropio.create({ data: { identidadId: identidad.id } });
        await tx.perfilPropio.create({ data: { identidadId: identidad.id } });
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});

describe('08 §12.2 — catálogo de textos versionados', () => {
  it('el catálogo de la base es idéntico al de @be/domain, y cada hash es el SHA-256 del texto', async () => {
    const filas = await prisma.versionDeTexto.findMany({ orderBy: { id: 'asc' } });
    const esperado = [...CATALOGO_DE_TEXTOS].sort((a, b) => a.id.localeCompare(b.id));
    expect(filas.map((f) => ({ id: f.id, tipo: f.tipo, finalidad: f.finalidad, hash: f.hash, texto: f.texto, vigenteDesde: f.vigenteDesde.toISOString() }))).toEqual(
      esperado.map((v) => ({ id: v.id, tipo: v.tipo, finalidad: v.finalidad, hash: v.hash, texto: v.texto, vigenteDesde: v.vigenteDesde })),
    );
    for (const f of filas) expect(createHash('sha256').update(f.texto, 'utf8').digest('hex')).toBe(f.hash);
  });

  it('una versión publicada no se reescribe ni se borra', async () => {
    const id = CATALOGO_DE_TEXTOS[0].id;
    await expect(prisma.$executeRawUnsafe(`UPDATE version_de_texto SET texto = 'otro' WHERE id = '${id}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM version_de_texto WHERE id = '${id}'`)).rejects.toThrow(/append-only/);
  });
});

describe('08 §29 — historia por adición', () => {
  /** Inserta una fila sintética y trata de modificarla en la misma transacción (que se revierte siempre). */
  const FILAS: Record<string, string> = {
    registro_de_auditoria: `INSERT INTO registro_de_auditoria (operacion, resultado) VALUES ('PRUEBA', 'EXITO')`,
    registro_de_supresion: `INSERT INTO registro_de_supresion (categoria, sujeto_id, fundamento, ejecutor, momento_de_ocurrencia)
      VALUES ('PRUEBA', gen_random_uuid(), 'prueba sintética', 'PRUEBA', now())`,
    registro_de_idempotencia: `INSERT INTO registro_de_idempotencia (operacion, ambito, clave, huella, estado_http, cuerpo)
      VALUES ('PRUEBA', 'PRUEBA', gen_random_uuid()::text, 'x', 201, '{}'::jsonb)`,
  };

  it.each(Object.keys(FILAS).flatMap((t) => [[t, 'UPDATE'], [t, 'DELETE']]))('%s: %s es rechazado por la base', async (tabla, operacion) => {
    const sentencia = operacion === 'UPDATE' ? `UPDATE ${tabla} SET id = id` : `DELETE FROM ${tabla}`;
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(FILAS[tabla]);
        await tx.$executeRawUnsafe(sentencia);
      }),
    ).rejects.toThrow(/append-only/);
  });

  it.each([
    'evento_de_dominio',
    'registro_de_auditoria',
    'registro_de_supresion',
    'solicitud_de_cierre_de_cuenta',
    'acto_registrable',
    'identidad',
    'version_de_texto',
    'perfil_propio',
    'metodo_de_acceso',
    'credencial_local',
    'sesion',
    'control_de_sesion',
    'registro_de_idempotencia',
    // WP-03
    'perfil_profesional',
    'verificacion_profesional',
    'habilitacion',
    'evento_de_verificacion',
    'solicitud_de_vinculo',
    'vinculo',
    'alcance_de_vinculo',
    'consentimiento',
    'version_de_consentimiento',
    'evento_de_vinculo',
    'decision_de_acceso',
  ])(
    'TRUNCATE %s es rechazado (esquivaría los triggers de fila)',
    async (tabla) => {
      await expect(prisma.$executeRawUnsafe(`TRUNCATE ${tabla} CASCADE`)).rejects.toThrow(/append-only/);
    },
  );
});

describe('T-06-24 — una sesión no termina antes de empezar', () => {
  it('CHECK sesion_cierre_coherente: la base rechaza una finalización anterior al inicio', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const identidad = await tx.identidad.create({ data: { autoriaDeCreacionId: '00000000-0000-4000-8000-000000000000', procedencia: PROCEDENCIA } });
        await tx.perfilPropio.create({ data: { identidadId: identidad.id } });
        const inicio = new Date('2026-09-18T12:00:00Z');
        const sesion = await tx.sesion.create({
          data: { identidadId: identidad.id, momentoDeOcurrencia: inicio, expiraEn: new Date('2026-09-19T00:00:00Z'), versionDeControl: 0 },
        });
        await tx.$executeRaw`UPDATE "sesion" SET "estado" = 'FINALIZADA', "momento_de_finalizacion" = ${new Date('2026-09-18T11:59:59Z')} WHERE "id" = ${sesion.id}::uuid`;
      }),
    ).rejects.toThrow(/sesion_cierre_coherente/);
  });
});
