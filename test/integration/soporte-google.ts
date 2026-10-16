/**
 * DL-138 · un Google falso local para las pruebas del acceso con Google: un servidor HTTP en 127.0.0.1 que publica las
 * claves públicas (JWKS) de un par RSA propio, y la firma de ID tokens con esa clave. Las pruebas nunca llaman a Google:
 * la CI no depende de un tercero, y cada caso (firma ajena, audiencia ajena, vencido, sin correo verificado, Google caído)
 * se reproduce igual siempre. Todos los datos son sintéticos: correos en `example.invalid` y `sub` inventados.
 */
import { generateKeyPairSync, randomInt, sign, type KeyObject } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Entorno } from '../../apps/api/src/config/entorno';

/** Client IDs sintéticos, con la forma de los de Google (la configuración no admite otra). */
export const CLIENTE_WEB = '000000000001-sinteticoweb.apps.googleusercontent.com';
export const CLIENTE_APK = '000000000001-sinteticoapk.apps.googleusercontent.com';

export interface ClaveDeGoogle {
  readonly kid: string;
  readonly privada: KeyObject;
  readonly jwk: Record<string, unknown>;
}

export function claveDeGoogle(kid: string): ClaveDeGoogle {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { kid, privada: privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' } };
}

export interface GoogleFalso {
  /** La URL de las claves, para `GOOGLE_JWKS_URL`. */
  readonly jwksUrl: string;
  readonly clave: ClaveDeGoogle;
  /** Cuántas veces se leyeron las claves. */
  consultas(): number;
  /** Mientras está caído, las claves responden 503. */
  caer(caido: boolean): void;
  cerrar(): Promise<void>;
}

export async function levantarGoogleFalso(): Promise<GoogleFalso> {
  const clave = claveDeGoogle('clave-sintetica-de-prueba');
  let consultas = 0;
  let caido = false;
  const servidor: Server = createServer((req, res) => {
    if (req.url !== '/oauth2/v3/certs') {
      res.writeHead(404).end();
      return;
    }
    consultas++;
    if (caido) {
      res.writeHead(503, { 'content-type': 'text/plain' }).end('no disponible');
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'public, max-age=600' }).end(JSON.stringify({ keys: [clave.jwk] }));
  });
  await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
  const { port } = servidor.address() as AddressInfo;
  return {
    jwksUrl: `http://127.0.0.1:${port}/oauth2/v3/certs`,
    clave,
    consultas: () => consultas,
    caer: (valor) => {
      caido = valor;
    },
    cerrar: () => new Promise<void>((listo) => servidor.close(() => listo())),
  };
}

/** La configuración de Google del entorno de prueba, con las claves del Google falso. */
export function googleDePrueba(google: GoogleFalso, clientIds: readonly string[] = [CLIENTE_WEB, CLIENTE_APK]): Pick<Entorno, 'google'> {
  return { google: { clientIds, jwksUrl: google.jwksUrl, presupuestoMs: 2_000 } };
}

/** Un `sub` sintético, distinto en cada prueba: 21 dígitos, como los de Google. */
export function subSintetico(): string {
  return `9${Array.from({ length: 20 }, () => randomInt(10)).join('')}`;
}

/** Los reclamos de un ID token de Google válido para ese `sub` y ese correo, emitido hace un momento. */
export function reclamosDeGoogle(sub: string, correo: string, cambios: Record<string, unknown> = {}): Record<string, unknown> {
  const ahora = Math.floor(Date.now() / 1000);
  return {
    iss: 'https://accounts.google.com',
    azp: CLIENTE_WEB,
    aud: CLIENTE_WEB,
    sub,
    email: correo,
    email_verified: true,
    name: 'Persona Sintética',
    iat: ahora - 5,
    exp: ahora + 3595,
    ...cambios,
  };
}

const base64url = (valor: unknown) => Buffer.from(JSON.stringify(valor)).toString('base64url');

/** Un ID token firmado con RS256 por `clave` (por defecto, la del Google falso). */
export function idTokenDeGoogle(google: GoogleFalso, reclamos: Record<string, unknown>, opciones: { clave?: ClaveDeGoogle; alg?: string } = {}): string {
  const clave = opciones.clave ?? google.clave;
  const encabezado = base64url({ alg: opciones.alg ?? 'RS256', kid: clave.kid, typ: 'JWT' });
  const cuerpo = base64url(reclamos);
  const firma = sign('RSA-SHA256', Buffer.from(`${encabezado}.${cuerpo}`), clave.privada).toString('base64url');
  return `${encabezado}.${cuerpo}.${firma}`;
}
