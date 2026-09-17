/**
 * Jest globalSetup — integración contra PostgreSQL 16 real.
 * Referencia: harness de be-health (test/integration/global-setup.ts), reducido a la ruta Testcontainers.
 * - Imagen postgres:16-alpine, la misma versión que el ambiente test en Render (07 §21, §35).
 * - Aplica migraciones con `prisma migrate deploy`, igual que el despliegue (07 §36). Nunca `migrate dev`/`db push`.
 * - No imprime URLs ni contraseñas (08 §30).
 */
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrarDeploy, RAIZ } from './soporte';

export default async function globalSetup(): Promise<void> {
  const contenedor = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('be_test')
    .withUsername('be_test')
    .withPassword('be_test_sintetico')
    .start();

  const url = contenedor.getConnectionUri();
  const host = new URL(url).hostname;
  if (!['localhost', '127.0.0.1', '::1'].includes(host) && !host.endsWith('.docker.internal')) {
    await contenedor.stop();
    throw new Error('Guardia: la base de integración no es local. Abortado.');
  }

  migrarDeploy(url, `${RAIZ}/prisma/schema.prisma`);
  process.env.DATABASE_URL = url;
  globalThis.__BE_PG__ = contenedor;
}
