import type { INestApplication } from '@nestjs/common';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { crearApp } from '../bootstrap';
import { PrismaService } from '../prisma/prisma.service';

const VERSION = { aplicacion: '0.1.0', commit: 'abc1234', construidoEn: '2026-09-16T00:00:00Z' };
const ENTORNO = {
  appEnv: 'test' as const,
  port: 0,
  databaseUrl: 'postgresql://sintetico@localhost/x',
  corsAllowedOrigins: [],
  jwtSecret: 'secreto-sintetico-de-prueba-de-32-caracteres-o-mas',
  costoBcrypt: 10,
  limites: {
    login: { maximo: 5, ventanaMs: 900000 },
    loginPorIp: { maximo: 100, ventanaMs: 900000 },
    loginPorIdentificador: { maximo: 20, ventanaMs: 900000 },
    registro: { maximo: 10, ventanaMs: 3600000 },
  },
  saltosDeProxy: 1,
};

function directorioCon(migraciones: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'be-migr-'));
  for (const m of migraciones) mkdirSync(join(dir, m));
  return dir;
}

async function appCon(prismaFalso: Partial<PrismaService>, migraciones: string[]): Promise<INestApplication> {
  const app = await crearApp({ entorno: ENTORNO, version: VERSION, directorioMigraciones: directorioCon(migraciones) });
  // Reemplaza la conexión real: pruebas unitarias sin base de datos.
  Object.assign(app.get(PrismaService), prismaFalso);
  await app.init();
  return app;
}

/** $queryRaw falso: responde SELECT 1 y la lista de migraciones aplicadas. */
function prismaCon(aplicadas: string[] | Error, baseCaida = false): Partial<PrismaService> {
  return {
    $queryRaw: jest.fn((partes: TemplateStringsArray) => {
      if (baseCaida) return Promise.reject(new Error('conexión rechazada'));
      if (partes.join('').includes('_prisma_migrations')) {
        return aplicadas instanceof Error ? Promise.reject(aplicadas) : Promise.resolve(aplicadas.map((migration_name) => ({ migration_name })));
      }
      return Promise.resolve([{ '?column?': 1 }]);
    }) as unknown as PrismaService['$queryRaw'],
  };
}

describe('Health — 07 §30 · TEST-RUN-001/002', () => {
  let app: INestApplication;
  afterEach(async () => app?.close());

  it('GET /health/live responde 200 con ambiente y versión, sin consultar la base', async () => {
    const prisma = prismaCon([], true);
    app = await appCon(prisma, ['20260916000000_identidad']);
    // El arranque consulta una vez la base (costo del hash señuelo); lo que importa es que /live no la consulte.
    (prisma.$queryRaw as jest.Mock).mockClear();
    const res = await request(app.getHttpServer()).get('/health/live').expect(200);
    expect(res.body).toEqual({ data: { estado: 'OK', ambiente: 'test', version: VERSION } });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it.each(['/health', '/health/ready'])('GET %s responde 200 cuando base y migraciones están al día', async (ruta) => {
    app = await appCon(prismaCon(['20260916000000_identidad']), ['20260916000000_identidad']);
    const res = await request(app.getHttpServer()).get(ruta).expect(200);
    expect(res.body).toEqual({
      data: { estado: 'OK', ambiente: 'test', version: VERSION, dependencias: { baseDeDatos: 'OK', migraciones: 'OK' } },
    });
  });

  it('503 DB_UNAVAILABLE cuando la base no responde; migraciones NO_VERIFICADO', async () => {
    app = await appCon(prismaCon([], true), ['20260916000000_identidad']);
    const res = await request(app.getHttpServer()).get('/health/ready').expect(503);
    expect(res.body).toEqual({
      error: {
        code: 'DB_UNAVAILABLE',
        message: 'El servicio no está listo.',
        details: { ambiente: 'test', version: VERSION, dependencias: { baseDeDatos: 'NO_DISPONIBLE', migraciones: 'NO_VERIFICADO' } },
      },
    });
  });

  it('503 con migraciones PENDIENTES cuando el artefacto trae una migración no aplicada', async () => {
    app = await appCon(prismaCon(['20260916000000_identidad']), ['20260916000000_identidad', '20261001000000_futura']);
    const res = await request(app.getHttpServer()).get('/health').expect(503);
    expect(res.body.error.details.dependencias).toEqual({ baseDeDatos: 'OK', migraciones: 'PENDIENTES' });
  });

  it('503 PENDIENTES cuando la base nunca fue migrada (sin _prisma_migrations)', async () => {
    app = await appCon(prismaCon(new Error('relation "_prisma_migrations" does not exist')), ['20260916000000_identidad']);
    const res = await request(app.getHttpServer()).get('/health/ready').expect(503);
    expect(res.body.error.details.dependencias.migraciones).toBe('PENDIENTES');
  });

  it('200 cuando la base tiene migraciones más nuevas que el artefacto (rollback de app, 07 §39)', async () => {
    app = await appCon(prismaCon(['20260916000000_identidad', '20261001000000_futura']), ['20260916000000_identidad']);
    await request(app.getHttpServer()).get('/health/ready').expect(200);
  });

  it('ruta inexistente responde ErrorEnvelope 404 RESOURCE_NOT_FOUND sin eco de la ruta (09 §3.2)', async () => {
    app = await appCon(prismaCon([]), []);
    const res = await request(app.getHttpServer()).get('/api/v1/identidades/no-existe').expect(404);
    expect(res.body).toEqual({ error: { code: 'RESOURCE_NOT_FOUND', message: 'Recurso no encontrado.' } });
    expect(JSON.stringify(res.body)).not.toContain('no-existe');
  });

  it('health no queda bajo /api/v1', async () => {
    app = await appCon(prismaCon([]), []);
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(404);
  });
});
