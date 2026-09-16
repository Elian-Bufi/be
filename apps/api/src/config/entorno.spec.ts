import { leerEntorno } from './entorno';

const BASE = { APP_ENV: 'test', DATABASE_URL: 'postgresql://sintetico@localhost/be_test' };

describe('leerEntorno — TEST-RUN-004 validación de configuración', () => {
  it('acepta configuración mínima válida con PORT por defecto', () => {
    expect(leerEntorno(BASE)).toEqual({
      appEnv: 'test',
      port: 3000,
      databaseUrl: BASE.DATABASE_URL,
      corsAllowedOrigins: [],
    });
  });

  it.each(['staging', 'prod', '', undefined])('rechaza APP_ENV=%p (07 §26: sin staging)', (APP_ENV) => {
    expect(() => leerEntorno({ ...BASE, APP_ENV })).toThrow(/APP_ENV/);
  });

  it('rechaza ausencia de DATABASE_URL sin imprimir valores', () => {
    expect(() => leerEntorno({ APP_ENV: 'test' })).toThrow('Configuración inválida: DATABASE_URL es obligatoria');
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
});
