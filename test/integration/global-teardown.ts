import './soporte';

/** Teardown explícito del contenedor (en be-health dependía del reaper). */
export default async function globalTeardown(): Promise<void> {
  await globalThis.__BE_PG__?.stop();
  globalThis.__BE_PG__ = undefined;
}
