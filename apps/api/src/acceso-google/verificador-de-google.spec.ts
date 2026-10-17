/**
 * DL-138 · el verificador de ID tokens de Google, sin red: un par de claves RSA propio, un JWKS falso servido por un
 * `fetch` reemplazado y un reloj fijo. Todos los datos son sintéticos.
 */
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import type { Entorno } from '../config/entorno';
import { CorreoDeGoogleNoVerificado, GoogleNoDisponible, TokenDeGoogleInvalido, VerificadorDeGoogle, vigenciaSegun } from './verificador-de-google';

const CLIENTE_WEB = '000000000001-sinteticoweb.apps.googleusercontent.com';
const CLIENTE_APK = '000000000001-sinteticoapk.apps.googleusercontent.com';
const AHORA_MS = Date.parse('2026-10-16T12:00:00Z');
const AHORA_S = AHORA_MS / 1000;

function parDeClaves(kid: string): { privada: KeyObject; jwk: Record<string, unknown> } {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { privada: privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' } };
}

const PRINCIPAL = parDeClaves('clave-sintetica-1');
const OTRA = parDeClaves('clave-sintetica-2');

const b64 = (valor: unknown) => Buffer.from(JSON.stringify(valor)).toString('base64url');

function token(reclamos: Record<string, unknown>, opciones: { clave?: KeyObject; kid?: string; alg?: string } = {}): string {
  const encabezado = b64({ alg: opciones.alg ?? 'RS256', kid: opciones.kid ?? 'clave-sintetica-1', typ: 'JWT' });
  const cuerpo = b64(reclamos);
  const firma = sign('RSA-SHA256', Buffer.from(`${encabezado}.${cuerpo}`), opciones.clave ?? PRINCIPAL.privada).toString('base64url');
  return `${encabezado}.${cuerpo}.${firma}`;
}

function reclamos(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: 'https://accounts.google.com',
    aud: CLIENTE_WEB,
    sub: '100000000000000000001',
    email: '  Persona.Sintetica@Example.Invalid ',
    email_verified: true,
    iat: AHORA_S - 10,
    exp: AHORA_S + 3590,
    ...cambios,
  };
}

function entorno(clientIds: readonly string[] = [CLIENTE_WEB, CLIENTE_APK]): Entorno {
  return { google: { clientIds, jwksUrl: 'https://claves-sinteticas.example.invalid/certs', presupuestoMs: 1000 } } as unknown as Entorno;
}

let consultas = 0;
let respuestaDeClaves: () => Response;

beforeEach(() => {
  consultas = 0;
  respuestaDeClaves = () => new Response(JSON.stringify({ keys: [PRINCIPAL.jwk] }), { status: 200, headers: { 'cache-control': 'public, max-age=600' } });
  jest.spyOn(global, 'fetch').mockImplementation(async () => {
    consultas++;
    return respuestaDeClaves();
  });
});
afterEach(() => jest.restoreAllMocks());

function verificador(clientIds?: readonly string[]): VerificadorDeGoogle {
  const v = new VerificadorDeGoogle(entorno(clientIds));
  v.ahora = () => AHORA_MS;
  return v;
}

async function motivoDe(promesa: Promise<unknown>): Promise<string> {
  try {
    await promesa;
    return 'ACEPTADO';
  } catch (e) {
    if (e instanceof TokenDeGoogleInvalido) return e.motivo;
    if (e instanceof GoogleNoDisponible) return e.motivo;
    if (e instanceof CorreoDeGoogleNoVerificado) return 'CORREO_NO_VERIFICADO';
    throw e;
  }
}

describe('VerificadorDeGoogle (DL-138)', () => {
  it('un ID token válido da el sub y el correo normalizado; nada más', async () => {
    await expect(verificador().verificar(token(reclamos()))).resolves.toEqual({ sub: '100000000000000000001', correo: 'persona.sintetica@example.invalid' });
    // También el client ID de la APK, y el emisor sin esquema que Google documenta.
    await expect(verificador().verificar(token(reclamos({ aud: CLIENTE_APK, iss: 'accounts.google.com' })))).resolves.toMatchObject({ sub: '100000000000000000001' });
  });

  it.each([
    ['otro emisor', { iss: 'https://emisor-sintetico.example.invalid' }, 'EMISOR'],
    ['otra audiencia', { aud: '000000000002-otraapp.apps.googleusercontent.com' }, 'AUDIENCIA'],
    ['varias audiencias sin azp de BE', { aud: [CLIENTE_WEB, '000000000002-otraapp.apps.googleusercontent.com'] }, 'AUDIENCIA'],
    ['vencido más allá de la tolerancia', { iat: AHORA_S - 3700, exp: AHORA_S - 61 }, 'VENCIDO'],
    ['emitido en el futuro', { iat: AHORA_S + 120, exp: AHORA_S + 3720 }, 'TODAVIA_NO_VALIDO'],
    ['con nbf en el futuro', { nbf: AHORA_S + 120 }, 'TODAVIA_NO_VALIDO'],
    ['que dice durar más de un día', { iat: AHORA_S - 10, exp: AHORA_S + 2 * 86400 }, 'VIGENCIA_EXCESIVA'],
    ['sin exp', { exp: undefined }, 'FORMA'],
    ['sin sub', { sub: undefined }, 'SUJETO'],
    ['con un sub con espacios', { sub: 'sub con espacios' }, 'SUJETO'],
    ['sin correo', { email: undefined }, 'CORREO'],
    ['con un correo inválido', { email: 'no-es-un-correo' }, 'CORREO'],
    ['con el correo sin verificar', { email_verified: false }, 'CORREO_NO_VERIFICADO'],
    ['con email_verified como texto', { email_verified: 'true' }, 'CORREO_NO_VERIFICADO'],
    ['sin email_verified', { email_verified: undefined }, 'CORREO_NO_VERIFICADO'],
  ])('rechaza un token %s', async (_caso, cambio, motivo) => {
    expect(await motivoDe(verificador().verificar(token(reclamos(cambio))))).toBe(motivo);
  });

  it('acepta un token vencido dentro de la tolerancia chica de reloj (60 s)', async () => {
    expect(await motivoDe(verificador().verificar(token(reclamos({ iat: AHORA_S - 3650, exp: AHORA_S - 50 }))))).toBe('ACEPTADO');
  });

  it('con varias audiencias, acepta si la parte autorizada (azp) es un cliente de BE', async () => {
    expect(await motivoDe(verificador().verificar(token(reclamos({ aud: [CLIENTE_WEB, 'otra-sintetica'], azp: CLIENTE_APK }))))).toBe('ACEPTADO');
  });

  it('la firma: otra clave con el mismo kid, un token alterado o una firma vacía no pasan', async () => {
    const v = verificador();
    expect(await motivoDe(v.verificar(token(reclamos(), { clave: OTRA.privada })))).toBe('FIRMA');
    const [h, , f] = token(reclamos()).split('.');
    expect(await motivoDe(v.verificar(`${h}.${b64(reclamos({ sub: '100000000000000000999' }))}.${f}`))).toBe('FIRMA');
    expect(await motivoDe(v.verificar(`${h}.${b64(reclamos())}.`))).toBe('FORMA');
  });

  it('el algoritmo es fijo: none, HS256 o cualquier otro que declare el token se rechazan', async () => {
    const v = verificador();
    for (const alg of ['none', 'HS256', 'RS512', 'ES256']) expect(await motivoDe(v.verificar(token(reclamos(), { alg })))).toBe('ALGORITMO');
  });

  it('un token que no es un JWT se rechaza por su forma, sin consultar las claves', async () => {
    const v = verificador();
    for (const malo of ['', 'a.b', 'a.b.c.d', 'no es base64url.x.y', `${b64([1])}.${b64({})}.x`]) expect(await motivoDe(v.verificar(malo))).toBe('FORMA');
    expect(consultas).toBe(0);
  });

  it('sin client IDs configurados: Google no disponible, sin consultar nada', async () => {
    expect(await motivoDe(verificador([]).verificar(token(reclamos())))).toBe('GOOGLE_NO_CONFIGURADO');
    expect(consultas).toBe(0);
  });

  it('las claves se guardan según el Cache-Control y se vuelven a leer al vencer', async () => {
    const v = verificador();
    let reloj = AHORA_MS;
    v.ahora = () => reloj;
    await v.verificar(token(reclamos()));
    await v.verificar(token(reclamos()));
    expect(consultas).toBe(1);
    reloj += 601_000; // max-age=600 vencido
    await v.verificar(token(reclamos({ iat: reloj / 1000 - 10, exp: reloj / 1000 + 3590 })));
    expect(consultas).toBe(2);
  });

  it('un kid desconocido relee las claves (Google las rota), pero como mucho una vez por minuto', async () => {
    const v = verificador();
    let reloj = AHORA_MS;
    v.ahora = () => reloj;
    await v.verificar(token(reclamos()));
    expect(await motivoDe(v.verificar(token(reclamos(), { kid: 'inventada' })))).toBe('CLAVE_DESCONOCIDA');
    expect(await motivoDe(v.verificar(token(reclamos(), { kid: 'inventada' })))).toBe('CLAVE_DESCONOCIDA');
    expect(consultas).toBe(1);
    // Pasado el minuto, Google publicó la clave nueva: se relee una vez y el token pasa.
    reloj += 61_000;
    respuestaDeClaves = () => new Response(JSON.stringify({ keys: [PRINCIPAL.jwk, OTRA.jwk] }), { status: 200, headers: { 'cache-control': 'max-age=600' } });
    const nuevo = reclamos({ iat: reloj / 1000 - 10, exp: reloj / 1000 + 3590 });
    expect(await motivoDe(v.verificar(token(nuevo, { clave: OTRA.privada, kid: 'clave-sintetica-2' })))).toBe('ACEPTADO');
    expect(consultas).toBe(2);
  });

  it('sin respuesta de Google y sin claves: no disponible; con claves ya leídas, se siguen usando', async () => {
    respuestaDeClaves = () => new Response('caído', { status: 503 });
    expect(await motivoDe(verificador().verificar(token(reclamos())))).toBe('CLAVES_NO_DISPONIBLES');

    respuestaDeClaves = () => new Response(JSON.stringify({ keys: [PRINCIPAL.jwk] }), { status: 200, headers: { 'cache-control': 'max-age=60' } });
    const v = verificador();
    let reloj = AHORA_MS;
    v.ahora = () => reloj;
    await v.verificar(token(reclamos()));
    reloj += 120_000;
    respuestaDeClaves = () => new Response('caído', { status: 503 });
    const nuevo = reclamos({ iat: reloj / 1000 - 10, exp: reloj / 1000 + 3590 });
    expect(await motivoDe(v.verificar(token(nuevo)))).toBe('ACEPTADO');
  });

  it('un JWKS sin claves RSA de firma no sirve: no disponible', async () => {
    respuestaDeClaves = () => new Response(JSON.stringify({ keys: [{ kty: 'EC', kid: 'clave-sintetica-1' }, { ...PRINCIPAL.jwk, use: 'enc' }] }), { status: 200 });
    expect(await motivoDe(verificador().verificar(token(reclamos())))).toBe('CLAVES_NO_DISPONIBLES');
  });

  it('vigenciaSegun: max-age acotado entre un minuto y un día; no-store y no-cache, un minuto; sin dato, cinco minutos', () => {
    expect(vigenciaSegun('public, max-age=19214, must-revalidate, no-transform')).toBe(19_214_000);
    expect(vigenciaSegun('max-age=5')).toBe(60_000);
    expect(vigenciaSegun('max-age=999999')).toBe(86_400_000);
    expect(vigenciaSegun('no-store')).toBe(60_000);
    expect(vigenciaSegun('no-cache, max-age=600')).toBe(60_000);
    expect(vigenciaSegun(null)).toBe(300_000);
    expect(vigenciaSegun('public')).toBe(300_000);
  });
});
