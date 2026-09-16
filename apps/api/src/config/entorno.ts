/**
 * Validación de configuración al arranque (07 §27, TEST-RUN-004).
 * Si la configuración es inválida el proceso no arranca: el readiness gate del deploy
 * falla y la plataforma conserva la versión anterior (07 §36).
 * Nunca se imprimen valores: solo nombres de variables (08 §32).
 */
export const AMBIENTES = ['development', 'test', 'production'] as const;
export type Ambiente = (typeof AMBIENTES)[number];

export interface Entorno {
  readonly appEnv: Ambiente;
  readonly port: number;
  readonly databaseUrl: string;
  readonly corsAllowedOrigins: readonly string[];
}

export function leerEntorno(env: NodeJS.ProcessEnv = process.env): Entorno {
  const errores: string[] = [];

  const appEnv = env.APP_ENV;
  if (!appEnv || !(AMBIENTES as readonly string[]).includes(appEnv)) {
    errores.push(`APP_ENV debe ser uno de: ${AMBIENTES.join(', ')}`);
  }

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) errores.push('DATABASE_URL es obligatoria');

  const port = env.PORT === undefined || env.PORT === '' ? 3000 : Number(env.PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) errores.push('PORT debe ser un entero entre 1 y 65535');

  const corsAllowedOrigins = (env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  // 07 §29 / 08 T-19: CORS nunca `*`.
  if (corsAllowedOrigins.includes('*')) errores.push('CORS_ALLOWED_ORIGINS no admite "*"');

  if (errores.length > 0) {
    throw new Error(`Configuración inválida: ${errores.join('; ')}`);
  }

  return { appEnv: appEnv as Ambiente, port, databaseUrl: databaseUrl as string, corsAllowedOrigins };
}
