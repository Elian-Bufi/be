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
      limites: {
        login: { maximo: 5, ventanaMs: 900000 },
        loginPorIp: { maximo: 100, ventanaMs: 900000 },
        loginPorIdentificador: { maximo: 20, ventanaMs: 900000 },
        registro: { maximo: 10, ventanaMs: 3600000 },
        consultaProtegida: { maximo: 120, ventanaMs: 60000 },
        invitacion: { maximo: 10, ventanaMs: 900000 },
        reanudacion: { maximo: 300, ventanaMs: 900000 },
        loginAdministrativo: { maximo: 5, ventanaMs: 900000 },
        segundoFactor: { maximo: 10, ventanaMs: 900000 },
      },
      saltosDeProxy: 1,
      caducidadDeSolicitudMs: 30 * 24 * 60 * 60 * 1000,
      demoProfesionales: [],
      proveedores: { openFoodFactsUrl: 'https://world.openfoodfacts.org', wgerUrl: 'https://wger.de', presupuestoMs: 5000 },
      mediosAlmacen: 'postgres',
      evidenciaVisualExigida: false,
      avisos: { canal: 'desactivado', expoUrl: 'https://exp.host', expoToken: null, presupuestoMs: 5000 },
      secretoDeTareas: null,
      google: { clientIds: [], jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs', presupuestoMs: 5000 },
      claveDelSegundoFactor: null,
    });
  });

  it('DL-138 · Google: sin client IDs, apagado; los client IDs se leen separados por coma; un valor que no es un client ID o una URL de claves sin https no arranca, y el mensaje no repite el valor', () => {
    const web = '000000000001-sinteticoweb.apps.googleusercontent.com';
    const apk = '000000000001-sinteticoapk.apps.googleusercontent.com';
    expect(leerEntorno({ ...BASE, GOOGLE_CLIENT_IDS: ` ${web}, ${apk},${web} ` }).google).toEqual({
      clientIds: [web, apk],
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
      presupuestoMs: 5000,
    });
    // Fuera de producción, las pruebas leen las claves de un servidor local.
    expect(leerEntorno({ ...BASE, GOOGLE_JWKS_URL: 'http://127.0.0.1:4010/certs' }).google.jwksUrl).toBe('http://127.0.0.1:4010/certs');
    const fallas: [Record<string, string>, RegExp][] = [
      [{ GOOGLE_CLIENT_IDS: 'GOCSPX-secreto-sintetico-pegado' }, /GOOGLE_CLIENT_IDS/],
      [{ GOOGLE_CLIENT_IDS: `${web},otro-sintetico.example.invalid` }, /GOOGLE_CLIENT_IDS/],
      [{ GOOGLE_JWKS_URL: 'http://claves-sinteticas.example.invalid/certs' }, /GOOGLE_JWKS_URL/],
      [{ APP_ENV: 'production', GOOGLE_JWKS_URL: 'http://127.0.0.1:4010/certs' }, /GOOGLE_JWKS_URL/],
    ];
    for (const [cambio, nombre] of fallas) {
      let mensaje = '';
      try {
        leerEntorno({ ...BASE, ...cambio });
      } catch (e) {
        mensaje = (e as Error).message;
      }
      expect(mensaje).toMatch(nombre);
      for (const [clave, valor] of Object.entries(cambio)) if (clave !== 'APP_ENV') expect(mensaje).not.toContain(valor);
    }
  });

  it('DL-133 · los avisos: desactivados por defecto; «expo» los activa con su origen y su token; el secreto de la tarea, de 32 caracteres; ningún mensaje repite un valor', () => {
    const con = leerEntorno({ ...BASE, BE_AVISOS_PUSH: 'expo', EXPO_ACCESS_TOKEN: 'token-de-acceso-sintetico', BE_SECRETO_DE_TAREAS: 's'.repeat(40) });
    expect(con.avisos).toEqual({ canal: 'expo', expoUrl: 'https://exp.host', expoToken: 'token-de-acceso-sintetico', presupuestoMs: 5000 });
    expect(con.secretoDeTareas).toBe('s'.repeat(40));
    const fallas: [Record<string, string>, RegExp][] = [
      [{ BE_AVISOS_PUSH: 'firebase-sintetico' }, /BE_AVISOS_PUSH/],
      [{ BE_SECRETO_DE_TAREAS: 'corto-sintetico' }, /BE_SECRETO_DE_TAREAS/],
      [{ EXPO_ACCESS_TOKEN: 'con espacios sintetico' }, /EXPO_ACCESS_TOKEN/],
      [{ EXPO_PUSH_URL: 'ftp://exp.host' }, /EXPO_PUSH_URL/],
    ];
    for (const [cambio, nombre] of fallas) {
      let mensaje = '';
      try {
        leerEntorno({ ...BASE, ...cambio });
      } catch (e) {
        mensaje = (e as Error).message;
      }
      expect(mensaje).toMatch(nombre);
      for (const valor of Object.values(cambio)) expect(mensaje).not.toContain(valor);
    }
  });

  it('DL-125 · BE_EVIDENCIA_VISUAL_EXIGIDA: false por defecto; true la activa; otro valor no arranca, y el mensaje no repite el valor', () => {
    expect(leerEntorno({ ...BASE, BE_EVIDENCIA_VISUAL_EXIGIDA: 'true' }).evidenciaVisualExigida).toBe(true);
    expect(leerEntorno({ ...BASE, BE_EVIDENCIA_VISUAL_EXIGIDA: 'false' }).evidenciaVisualExigida).toBe(false);
    expect(leerEntorno({ ...BASE, BE_EVIDENCIA_VISUAL_EXIGIDA: '' }).evidenciaVisualExigida).toBe(false);
    for (const otro of ['activada', 'yes', 'TRUE', 'exigida-sintetica']) {
      let mensaje = '';
      try {
        leerEntorno({ ...BASE, BE_EVIDENCIA_VISUAL_EXIGIDA: otro });
      } catch (e) {
        mensaje = (e as Error).message;
      }
      expect(mensaje).toMatch(/BE_EVIDENCIA_VISUAL_EXIGIDA solo admite «true» o «false»/);
      expect(mensaje).not.toContain(otro);
    }
  });

  it('DL-120 · BE_MEDIOS_ALMACEN: postgres por defecto; S3 u otro valor no arranca, y el mensaje no repite el valor', () => {
    expect(leerEntorno({ ...BASE, BE_MEDIOS_ALMACEN: 'postgres' }).mediosAlmacen).toBe('postgres');
    expect(leerEntorno({ ...BASE, BE_MEDIOS_ALMACEN: '' }).mediosAlmacen).toBe('postgres');
    for (const otro of ['s3', 'disco', 'S3-bucket-sintetico']) {
      let mensaje = '';
      try {
        leerEntorno({ ...BASE, BE_MEDIOS_ALMACEN: otro });
      } catch (e) {
        mensaje = (e as Error).message;
      }
      expect(mensaje).toMatch(/BE_MEDIOS_ALMACEN solo admite «postgres»: el almacenamiento compatible con S3 no está configurado/);
      expect(mensaje).not.toContain(otro);
    }
  });

  it('WP-08 · el origen de cada proveedor es configurable, https en producción, sin ruta; un origen local solo fuera de producción', () => {
    const e = leerEntorno({ ...BASE, OPEN_FOOD_FACTS_BASE_URL: 'http://127.0.0.1:4010/', WGER_BASE_URL: 'https://wger.example.org' });
    expect(e.proveedores).toEqual({ openFoodFactsUrl: 'http://127.0.0.1:4010', wgerUrl: 'https://wger.example.org', presupuestoMs: 5000 });
    for (const malo of ['http://wger.de', 'https://wger.de/api/v2', 'ftp://wger.de', 'wger.de']) {
      expect(() => leerEntorno({ ...BASE, WGER_BASE_URL: malo })).toThrow(/WGER_BASE_URL/);
    }
    expect(() => leerEntorno({ ...BASE, APP_ENV: 'production', OPEN_FOOD_FACTS_BASE_URL: 'http://localhost:4010' })).toThrow(/OPEN_FOOD_FACTS_BASE_URL/);
  });

  it('WP-03 · plazo de caducidad de solicitudes parametrizado (DL-037): entero de 1 a 365 días', () => {
    expect(leerEntorno({ ...BASE, SOLICITUD_DE_VINCULO_CADUCIDAD_DIAS: '7' }).caducidadDeSolicitudMs).toBe(7 * 24 * 60 * 60 * 1000);
    for (const malo of ['0', '366', '1.5', 'x']) {
      expect(() => leerEntorno({ ...BASE, SOLICITUD_DE_VINCULO_CADUCIDAD_DIAS: malo })).toThrow(/SOLICITUD_DE_VINCULO_CADUCIDAD_DIAS/);
    }
  });

  it('WP-03 · profesionales demo (DL-036): por identidad registrada y nunca en production', () => {
    const pn = '2F8FA677-663E-43BB-B043-19A1057D8873';
    const pt = '3113dacf-e61b-45a0-9106-596bdbc21444';
    const valor = `${pn}|NUTRICION|SANITARIO|Lic. Demo;${pt}|ENTRENAMIENTO|NO_SANITARIO|Prof. Demo`;
    expect(leerEntorno({ ...BASE, BE_DEMO_PROFESIONALES: valor }).demoProfesionales).toEqual([
      { identidadId: pn.toLowerCase(), alcance: 'NUTRICION', tipo: 'SANITARIO', nombreVisible: 'Lic. Demo', estadoInicial: 'VERIFICADO' },
      { identidadId: pt, alcance: 'ENTRENAMIENTO', tipo: 'NO_SANITARIO', nombreVisible: 'Prof. Demo', estadoInicial: 'VERIFICADO' },
    ]);
    expect(() => leerEntorno({ ...BASE, APP_ENV: 'production', BE_DEMO_PROFESIONALES: valor })).toThrow(/BE_DEMO_PROFESIONALES/);
    // WP-05: la capacidad antropométrica es transversal y «nunca tercera Especialidad» (06:2774). Una misma identidad
    // se declara una vez por alcance: suma la capacidad a su Especialidad, no la reemplaza.
    const transversal = `${pt}|ENTRENAMIENTO|NO_SANITARIO|Prof. Demo;${pt}|ANTROPOMETRIA|NO_SANITARIO|Prof. Demo`;
    expect(leerEntorno({ ...BASE, BE_DEMO_PROFESIONALES: transversal }).demoProfesionales.map((p) => p.alcance)).toEqual(['ENTRENAMIENTO', 'ANTROPOMETRIA']);
    // Un correo ya no identifica: cualquiera podría registrarlo primero.
    for (const malo of ['demo.pn@example.invalid|NUTRICION|SANITARIO|X', `${pt}|PSICOLOGIA|SANITARIO|X`, `${pt}|NUTRICION|OTRO|X`, `${pt}|NUTRICION|SANITARIO|`]) {
      expect(() => leerEntorno({ ...BASE, BE_DEMO_PROFESIONALES: malo })).toThrow(/BE_DEMO_PROFESIONALES/);
    }
  });

  it('WP-ADMINISTRACION · un quinto campo PENDIENTE deja el área para revisar; otro valor o un campo de más no arrancan', () => {
    const pt = '3113dacf-e61b-45a0-9106-596bdbc21444';
    expect(leerEntorno({ ...BASE, BE_DEMO_PROFESIONALES: `${pt}|NUTRICION|SANITARIO|Lic. Demo|PENDIENTE` }).demoProfesionales).toEqual([
      { identidadId: pt, alcance: 'NUTRICION', tipo: 'SANITARIO', nombreVisible: 'Lic. Demo', estadoInicial: 'PENDIENTE' },
    ]);
    for (const malo of [`${pt}|NUTRICION|SANITARIO|X|VERIFICADO`, `${pt}|NUTRICION|SANITARIO|X|PENDIENTE|otro`]) {
      expect(() => leerEntorno({ ...BASE, BE_DEMO_PROFESIONALES: malo })).toThrow(/BE_DEMO_PROFESIONALES/);
    }
  });

  it('WP-ADMINISTRACION · la clave del segundo factor: base64 (común o url) de 32 bytes o más; sin ella, null; el mensaje no repite el valor', () => {
    const clave = Buffer.alloc(32, 7).toString('base64url');
    expect(leerEntorno({ ...BASE, BE_CLAVE_DEL_SEGUNDO_FACTOR: clave }).claveDelSegundoFactor?.length).toBe(32);
    expect(leerEntorno(BASE).claveDelSegundoFactor).toBeNull();
    // Render (`generateValue`) la da en base64 común: con «+», «/» y relleno. Vale igual, con los mismos bytes.
    const bytes = Buffer.from(Array.from({ length: 32 }, (_, i) => (i * 37 + 251) % 256));
    const comun = bytes.toString('base64');
    expect(comun).toMatch(/[+/]/);
    expect(leerEntorno({ ...BASE, BE_CLAVE_DEL_SEGUNDO_FACTOR: comun }).claveDelSegundoFactor?.equals(bytes)).toBe(true);
    expect(leerEntorno({ ...BASE, BE_CLAVE_DEL_SEGUNDO_FACTOR: bytes.toString('base64url') }).claveDelSegundoFactor?.equals(bytes)).toBe(true);
    for (const mala of [Buffer.alloc(16, 7).toString('base64url'), 'esto no es base64url!']) {
      let mensaje = '';
      try {
        leerEntorno({ ...BASE, BE_CLAVE_DEL_SEGUNDO_FACTOR: mala });
      } catch (e) {
        mensaje = (e as Error).message;
      }
      expect(mensaje).toMatch(/BE_CLAVE_DEL_SEGUNDO_FACTOR/);
      expect(mensaje).not.toContain(mala);
    }
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
