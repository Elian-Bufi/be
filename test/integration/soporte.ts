import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

declare global {
  // Contenedor compartido entre globalSetup y globalTeardown.
  // eslint-disable-next-line no-var
  var __BE_PG__: StartedPostgreSqlContainer | undefined;
}

export const RAIZ = resolve(__dirname, '..', '..');
const PRISMA_CLI = resolve(RAIZ, 'node_modules', 'prisma', 'build', 'index.js');

/** `prisma migrate deploy` con la misma CLI que usa el contenedor de la API. Lanza si falla. */
export function migrarDeploy(databaseUrl: string, schema: string): void {
  execFileSync(process.execPath, [PRISMA_CLI, 'migrate', 'deploy', '--schema', schema], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
}

/** Misma base, otro schema de PostgreSQL: aísla escenarios destructivos. */
export function urlConSchema(databaseUrl: string, schema: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set('schema', schema);
  return url.toString();
}
