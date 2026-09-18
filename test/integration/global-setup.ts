/**
 * Jest globalSetup — integración contra PostgreSQL 16 real.
 * Referencia: harness de be-health (test/integration/global-setup.ts).
 * - Por defecto (CI): contenedor postgres:16-alpine, la misma versión que el ambiente test en Render (07 §21, §35).
 * - Local sin Docker: `TEST_DATABASE_URL` apuntando a un PostgreSQL 16 en localhost (nunca remoto: guardia).
 * - Aplica migraciones con `prisma migrate deploy`, igual que el despliegue (07 §36). Nunca `migrate dev`/`db push`.
 * - No imprime URLs ni contraseñas (08 §30).
 */
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrarDeploy, RAIZ } from './soporte';

function esLocal(url: string): boolean {
  const host = new URL(url).hostname;
  return ['localhost', '127.0.0.1', '::1'].includes(host) || host.endsWith('.docker.internal');
}

export default async function globalSetup(): Promise<void> {
  const externa = process.env.TEST_DATABASE_URL;
  if (externa) {
    if (!esLocal(externa)) throw new Error('Guardia: TEST_DATABASE_URL no es local. Abortado.');
    migrarDeploy(externa, `${RAIZ}/prisma/schema.prisma`);
    process.env.DATABASE_URL = externa;
    return;
  }

  const contenedor = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('be_test')
    .withUsername('be_test')
    .withPassword('be_test_sintetico')
    .start();

  const url = contenedor.getConnectionUri();
  if (!esLocal(url)) {
    await contenedor.stop();
    throw new Error('Guardia: la base de integración no es local. Abortado.');
  }

  migrarDeploy(url, `${RAIZ}/prisma/schema.prisma`);
  process.env.DATABASE_URL = url;
  globalThis.__BE_PG__ = contenedor;
}
