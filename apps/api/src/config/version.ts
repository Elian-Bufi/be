import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Identidad del artefacto desplegado (07 §30, §34): versión + commit SHA + build.
 * Un dato desconocido se declara `null`; nunca se inventa (garantía de ausencia declarada).
 */
export interface VersionDesplegada {
  readonly aplicacion: string;
  readonly commit: string | null;
  readonly construidoEn: string | null;
}

function leerJson(ruta: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(ruta, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function leerVersion(env: NodeJS.ProcessEnv = process.env, raizApi = resolve(__dirname, '..', '..')): VersionDesplegada {
  const pkg = leerJson(resolve(raizApi, 'package.json'));
  // build-info.json lo escribe el Dockerfile al construir la imagen.
  const buildInfo = leerJson(resolve(raizApi, 'dist', 'build-info.json'));
  const commit = env.RENDER_GIT_COMMIT || env.GIT_COMMIT || (buildInfo?.commit as string | undefined) || null;
  return {
    aplicacion: typeof pkg?.version === 'string' ? pkg.version : '0.0.0',
    commit,
    construidoEn: typeof buildInfo?.construidoEn === 'string' ? buildInfo.construidoEn : null,
  };
}
