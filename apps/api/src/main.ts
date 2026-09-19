import { resolve } from 'node:path';
import { crearApp } from './bootstrap';
import { leerEntorno } from './config/entorno';
import { leerVersion } from './config/version';

// Ensayo de rollback (ACTA-DIR-034 §12): cambio inocuo de prueba; se revierte con git revert -m 1.
async function main(): Promise<void> {
  const entorno = leerEntorno();
  const version = leerVersion();
  const directorioMigraciones =
    process.env.PRISMA_MIGRATIONS_DIR ?? resolve(__dirname, '..', '..', '..', 'prisma', 'migrations');

  const app = await crearApp({ entorno, version, directorioMigraciones });
  await app.listen(entorno.port, '0.0.0.0');
  process.stdout.write(
    `${JSON.stringify({ nivel: 'info', evento: 'api_iniciada', ambiente: entorno.appEnv, version, puerto: entorno.port })}\n`,
  );
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : 'error desconocido';
  process.stderr.write(`${JSON.stringify({ nivel: 'error', evento: 'arranque_fallido', mensaje })}\n`);
  process.exit(1);
});
