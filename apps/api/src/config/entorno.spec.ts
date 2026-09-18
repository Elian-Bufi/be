import { leerEntorno } from './entorno';

/** Valores sintéticos: el secreto de prueba no firma nada fuera de este test. */
const BASE = {
  APP_ENV: 'test',
  DATABASE_URL: 'postgresql://sintetico@localhost/be_test',
  JWT_SECRET: 'secreto-sintetico-de-prueba-de-32-caracteres-o-mas',
};

describe('leerEntorno — TEST-RUN-004 validación de configuración', () => {
  it('acepta configuración mínima válida con valores por defecto', () => {
    expect(leerEntorno(BASE)).toEqual({
      appEnv: 'test',
      port: 3000,
      databaseUrl: BASE.DATABASE_URL,
      corsAllowedOrigins: [],
      jwtSecret: BASE.JWT_SECRET,
      costoBcrypt: 10,
      limites: { login: { maximo: 5, ventanaMs: 900000 }, registro: { maximo: 10, ventanaMs: 3600000 } },
      saltosDeProxy: 1,
    });
  });

  it.each(['staging', 'prod', '', undefined])('rechaza APP_ENV=%p (07 §26: sin staging)', (APP_ENV) => {
    expect(() => leerEntorno({ ...BASE, APP_ENV })).toThrow(/APP_ENV/);
  });

  it('rechaza ausencia de DATABASE_URL sin imprimir valores', () => {
    expect(() => leerEntorno({ APP_ENV: 'test', JWT_SECRET: BASE.JWT_SECRET })).toThrow('Configuración inválida: DATABASE_URL es obligatoria');
  });

  it('rechaza CORS comodín (07 §29)', () => {
    expect(() => leerEntorno({ ...BASE, CORS_ALLOWED_ORIGINS: 'https://a.example,*' })).toThrow(/CORS/);
  });

  it('parsea allowlist CORS', () => {
    expect(leerEntorno({ ...BASE, CORS_ALLOWED_ORIGINS: ' https://a.example , https://b.example ' }).corsAllowedOrigins).toEqual([
      'https://a.example',
      'https://b.example',
    ]);
  });

  it.each([undefined, '', 'corto'])('rechaza JWT_SECRET=%p sin imprimir su valor', (JWT_SECRET) => {
    let mensaje = '';
    try {
      leerEntorno({ ...BASE, JWT_SECRET });
    } catch (e) {
      mensaje = (e as Error).message;
    }
    expect(mensaje).toMatch(/JWT_SECRET es obligatorio/);
    if (JWT_SECRET) expect(mensaje).not.toContain(JWT_SECRET);
  });

  it.each(['9', '16', 'diez'])('rechaza BCRYPT_COST=%p (08 §24.2: costo ≥ 10)', (BCRYPT_COST) => {
    expect(() => leerEntorno({ ...BASE, BCRYPT_COST })).toThrow(/BCRYPT_COST/);
  });

  it('rechaza límites de intentos inválidos', () => {
    expect(() => leerEntorno({ ...BASE, RATE_LIMIT_LOGIN_MAX: '0' })).toThrow(/RATE_LIMIT_LOGIN_MAX/);
    expect(() => leerEntorno({ ...BASE, RATE_LIMIT_REGISTRO_WINDOW_MS: '10' })).toThrow(/RATE_LIMIT_REGISTRO_WINDOW_MS/);
  });

  it('rechaza TRUST_PROXY_HOPS fuera de rango', () => {
    expect(() => leerEntorno({ ...BASE, TRUST_PROXY_HOPS: '-1' })).toThrow(/TRUST_PROXY_HOPS/);
  });
});
