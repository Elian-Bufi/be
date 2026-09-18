/**
 * Reproducibilidad del despliegue (ASR-09, 07 §30/§36/§62) contra PostgreSQL real.
 * TEST-RUN-002 readiness · TEST-RUN-003 migration deploy.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { crearApp } from '../../apps/api/src/bootstrap';
import { migrarDeploy, RAIZ, urlConSchema } from './soporte';
import { entornoDePrueba } from './soporte-api';

const VERSION = { aplicacion: '0.1.0', commit: 'integracion', construidoEn: null };
const MIGRACIONES = join(RAIZ, 'prisma', 'migrations');

async function appContra(directorioMigraciones: string): Promise<INestApplication> {
  const app = await crearApp({
    entorno: entornoDePrueba(),
    version: VERSION,
    directorioMigraciones,
  });
  await app.init();
  return app;
}

describe('Despliegue reproducible — ASR-09', () => {
  let app: INestApplication | undefined;
  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('TEST-RUN-002: /health/ready 200 contra base real con migraciones al día', async () => {
    app = await appContra(MIGRACIONES);
    const res = await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(res.body.data.dependencias).toEqual({ baseDeDatos: 'OK', migraciones: 'OK' });
    expect(res.body.data.ambiente).toBe('test');
  });

  it('TEST-RUN-002: artefacto con migración no aplicada → 503 DB_UNAVAILABLE / PENDIENTES', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'be-migr-'));
    cpSync(MIGRACIONES, dir, { recursive: true });
    mkdirSync(join(dir, '20991231000000_no_aplicada'));
    app = await appContra(dir);
    const res = await request(app.getHttpServer()).get('/health/ready').expect(503);
    expect(res.body.error.code).toBe('DB_UNAVAILABLE');
    expect(res.body.error.details.dependencias).toEqual({ baseDeDatos: 'OK', migraciones: 'PENDIENTES' });
  });

  it('TEST-RUN-003 / 07 §62: una migración fallida aborta el deploy y no queda registrada como aplicada', async () => {
    const trabajo = mkdtempSync(join(tmpdir(), 'be-deploy-roto-'));
    cpSync(join(RAIZ, 'prisma'), trabajo, { recursive: true });
    const rota = join(trabajo, 'migrations', '20991231000000_rota');
    mkdirSync(rota);
    writeFileSync(join(rota, 'migration.sql'), 'ALTER TABLE tabla_inexistente ADD COLUMN x int;');

    const url = urlConSchema(process.env.DATABASE_URL as string, 'deploy_roto');
    expect(() => migrarDeploy(url, join(trabajo, 'schema.prisma'))).toThrow();

    const aislada = new PrismaClient({ datasources: { db: { url } } });
    try {
      const filas = await aislada.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
        SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at`;
      expect(filas.find((f) => f.migration_name === '20260916180000_identidad')?.finished_at).not.toBeNull();
      expect(filas.find((f) => f.migration_name === '20991231000000_rota')?.finished_at).toBeNull();
    } finally {
      await aislada.$executeRawUnsafe('DROP SCHEMA IF EXISTS "deploy_roto" CASCADE');
      await aislada.$disconnect();
    }
  });
});
