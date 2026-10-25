/**
 * Validación de configuración al arranque (07 §27, TEST-RUN-004).
 * Si la configuración es inválida el proceso no arranca: el readiness gate del deploy
 * falla y la plataforma conserva la versión anterior (07 §36).
 * Nunca se imprimen valores: solo nombres de variables (08 §32).
 */
import { esAlcance, PRESUPUESTO_DEL_PROVEEDOR_MS, TipoDePerfilProfesional, type Alcance } from '@be/domain';

export const AMBIENTES = ['development', 'test', 'production'] as const;
export type Ambiente = (typeof AMBIENTES)[number];

export interface Limite {
  readonly maximo: number;
  readonly ventanaMs: number;
}

export interface Entorno {
  readonly appEnv: Ambiente;
  readonly port: number;
  readonly databaseUrl: string;
  readonly corsAllowedOrigins: readonly string[];
  /** Firma de sesión (HS256). Mínimo 32 caracteres; lo genera Render (render.yaml generateValue). */
  readonly jwtSecret: string;
  /** 08 §24.2: bcrypt costo 10 como mínimo. */
  readonly costoBcrypt: number;
  /**
   * 08 §38 PROPUESTA BE (DEUDA_LEGAJO DL-015): login 5 / 15 min por red + identificador; login global 100 / 15 min por
   * red («global por IP: generoso», 08:786); login 20 / 15 min por identificador desde cualquier red (defensa en
   * profundidad ante pools de direcciones, DL-030); registro 10 / h por red. Red = IPv4 o prefijo /64 de IPv6.
   * WP-03: consultas protegidas por el PDP, 120 / min por actor. Cada una registra sus decisiones, que no se borran:
   * sin límite, una sola cuenta podría llenar la base (revisión adversarial del PDP, hallazgo 11).
   * WP-INVITACION (DL-136): ver o usar una invitación, 10 / 15 min por cuenta, desde cualquier red (como el cupo por
   * identificador del login, DL-030): adivinar un código de 40 bits no es viable con ese ritmo.
   * DL-147: reanudar la sesión del website, 300 / 15 min por red: cada recarga de cada pestaña es una, y un consultorio
   * entero puede salir por la misma IP. El secreto es de 256 bits: el cupo no protege de adivinarlo sino de un cliente que
   * reintenta sin parar.
   */
  readonly limites: {
    readonly login: Limite;
    readonly loginPorIp: Limite;
    readonly loginPorIdentificador: Limite;
    readonly registro: Limite;
    readonly consultaProtegida: Limite;
    readonly invitacion: Limite;
    readonly reanudacion: Limite;
    /** WP-ADMINISTRACION (DL-155): el primer factor de Administración, 5 / 15 min por red + correo (como el login). */
    readonly loginAdministrativo: Limite;
    /** WP-ADMINISTRACION: los códigos del segundo factor, 10 / 15 min por identidad, desde cualquier red. */
    readonly segundoFactor: Limite;
  };
  /** Saltos de proxy confiables para `req.ip` (Express `trust proxy`). Render: 1. */
  readonly saltosDeProxy: number;
  /** WP-03 · plazo de caducidad de una solicitud de vínculo (DEUDA_LEGAJO DL-037). 30 días por defecto. */
  readonly caducidadDeSolicitudMs: number;
  /**
   * WP-03 · profesionales de demostración que el servicio interno verifica y habilita al arrancar (DEUDA_LEGAJO DL-036).
   * Solo en `test` y `development`, identificados por su identidad ya registrada. Vacío por defecto.
   */
  readonly demoProfesionales: readonly ProfesionalDeDemostracion[];
  /**
   * WP-08 · los proveedores de la importación controlada (RF-028, RF-038). La URL base es configurable para que las
   * pruebas usen un proveedor falso y la CI nunca dependa de un tercero (docs/paquetes/WP-08.md D-H).
   */
  readonly proveedores: ProveedoresExternos;
  /**
   * DL-120 · dónde se guardan los bytes de los medios privados (`BE_MEDIOS_ALMACEN`). Solo `postgres`, la base existente:
   * sobrevive a un reinicio y no usa el disco del contenedor (07 §25). Un almacenamiento compatible con S3 necesita un
   * bucket privado y sus credenciales, que no están contratados: pedirlo falla al arrancar.
   */
  readonly mediosAlmacen: AlmacenDeMediosConfigurado;
  /**
   * DL-125 · si la API exige el acto `EVIDENCIA_VISUAL` (08 §12.4) para subir la foto de una comida (API-MED-01) y para que
   * el profesional la vea (API-MED-03) (`BE_EVIDENCIA_VISUAL_EXIGIDA`, `true` o `false`). Por defecto, `false`: el texto
   * es una propuesta, pendiente de aprobación de Dirección y de validación jurídica, y activar la exigencia es su decisión
   * (precierre del 2026-10-06, §6). Las operaciones del acto (API-EVI-01 a 04) responden igual con o sin ella.
   */
  readonly evidenciaVisualExigida: boolean;
  /**
   * WP-NOVEDADES-Y-AVISOS (DL-133) · el canal de los avisos push (RF-062). `expo` (`BE_AVISOS_PUSH`) los envía por Expo
   * Push (`EXPO_PUSH_URL`, por defecto https://exp.host; `EXPO_ACCESS_TOKEN`, opcional, si el proyecto de Expo exige la
   * seguridad reforzada de los avisos). Sin valor, `desactivado`: las novedades se guardan igual y no sale ningún aviso
   * (CI y desarrollo, que nunca dependen de un tercero). El token de acceso es un secreto: nunca se imprime.
   */
  readonly avisos: { readonly canal: CanalDeAvisos; readonly expoUrl: string; readonly expoToken: string | null; readonly presupuestoMs: number };
  /**
   * DL-133 · el secreto con que la tarea programada de la plataforma llama a la corrida de los recordatorios (07 §24: «cron
   * administrado de la plataforma llamando un endpoint interno idempotente»; `BE_SECRETO_DE_TAREAS`, 32 caracteres como
   * mínimo, lo genera Render). Sin valor, esa ruta responde 404.
   */
  readonly secretoDeTareas: string | null;
  /**
   * WP-ACCESO-GOOGLE (DL-138) · entrar con Google, verificado por la API (RF-003, UC-E05).
   * - `GOOGLE_CLIENT_IDS`: los client IDs de OAuth de BE que puede nombrar la audiencia del ID token (el del website y el
   *   de la APK), separados por coma. Son públicos, no secretos. Sin valor, la familia GOO responde 503 y el acceso local
   *   sigue igual (UC-E05 E01: «se informa la contingencia y se ofrece acceso local»).
   * - `GOOGLE_JWKS_URL`: de dónde se leen las claves públicas de Google. Por defecto, la de Google; https en producción.
   *   Configurable para que las pruebas firmen con claves propias y nunca dependan de la red (como WP-08 D-H).
   */
  readonly google: { readonly clientIds: readonly string[]; readonly jwksUrl: string; readonly presupuestoMs: number };
  /**
   * WP-ADMINISTRACION (DL-155) · la clave del segundo factor (`BE_CLAVE_DEL_SEGUNDO_FACTOR`, 32 bytes o más en base64, común
   * o url: `generateValue` de Render la da en base64 común, con «+» y «/»). De ella se derivan (HKDF) la clave que cifra los
   * secretos TOTP y la que firma las huellas de los códigos de recuperación. Es un secreto: nunca se imprime. Sin valor, la
   * administración responde «no configurada» (503) y el resto de BE sigue igual.
   */
  readonly claveDelSegundoFactor: Buffer | null;
}

/** Dónde publica Google las claves con que firma los ID tokens (OpenID Connect, `jwks_uri` de accounts.google.com). */
export const JWKS_DE_GOOGLE = 'https://www.googleapis.com/oauth2/v3/certs';
/** La forma de un client ID de OAuth de Google: `<número>-<letras y números>.apps.googleusercontent.com`. */
const CLIENT_ID_DE_GOOGLE = /^[0-9]+-[0-9a-z]+\.apps\.googleusercontent\.com$/;

export const CANALES_DE_AVISOS = ['expo', 'desactivado'] as const;
export type CanalDeAvisos = (typeof CANALES_DE_AVISOS)[number];

export const ALMACENES_DE_MEDIOS = ['postgres'] as const;
export type AlmacenDeMediosConfigurado = (typeof ALMACENES_DE_MEDIOS)[number];

export interface ProveedoresExternos {
  /** Origen https de Open Food Facts, sin ruta. Por defecto, el público. */
  readonly openFoodFactsUrl: string;
  /** Origen https de wger, sin ruta. Por defecto, el público. */
  readonly wgerUrl: string;
  /** Presupuesto de tiempo de cada consulta (D-E: 5 s, sin reintentos dentro de la request). */
  readonly presupuestoMs: number;
}

export interface ProfesionalDeDemostracion {
  /** Identidad ya registrada por la API pública: el identificador BE de la cuenta demo. */
  readonly identidadId: string;
  readonly alcance: Alcance;
  readonly tipo: TipoDePerfilProfesional;
  readonly nombreVisible: string;
  /**
   * WP-ADMINISTRACION: `VERIFICADO` (por omisión) deja el área verificada y habilitada; `PENDIENTE` la presenta y la deja
   * pendiente de revisión, para que la resuelva Administración. Ninguno pisa una decisión administrativa (D-7).
   */
  readonly estadoInicial: 'VERIFICADO' | 'PENDIENTE';
}

const COSTO_BCRYPT_MINIMO = 10;
const LARGO_MINIMO_JWT_SECRET = 32;

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

  const jwtSecret = env.JWT_SECRET ?? '';
  if (jwtSecret.length < LARGO_MINIMO_JWT_SECRET) errores.push(`JWT_SECRET es obligatorio (mínimo ${LARGO_MINIMO_JWT_SECRET} caracteres)`);

  const costoBcrypt = entero(env.BCRYPT_COST, COSTO_BCRYPT_MINIMO);
  if (costoBcrypt === null || costoBcrypt < COSTO_BCRYPT_MINIMO || costoBcrypt > 15) {
    errores.push(`BCRYPT_COST debe ser un entero entre ${COSTO_BCRYPT_MINIMO} y 15`);
  }

  const limites = {
    login: limite(env.RATE_LIMIT_LOGIN_MAX, env.RATE_LIMIT_LOGIN_WINDOW_MS, 5, 15 * 60 * 1000, 'RATE_LIMIT_LOGIN', errores),
    loginPorIp: limite(env.RATE_LIMIT_LOGIN_IP_MAX, env.RATE_LIMIT_LOGIN_IP_WINDOW_MS, 100, 15 * 60 * 1000, 'RATE_LIMIT_LOGIN_IP', errores),
    loginPorIdentificador: limite(
      env.RATE_LIMIT_LOGIN_ID_MAX,
      env.RATE_LIMIT_LOGIN_ID_WINDOW_MS,
      20,
      15 * 60 * 1000,
      'RATE_LIMIT_LOGIN_ID',
      errores,
    ),
    registro: limite(env.RATE_LIMIT_REGISTRO_MAX, env.RATE_LIMIT_REGISTRO_WINDOW_MS, 10, 60 * 60 * 1000, 'RATE_LIMIT_REGISTRO', errores),
    consultaProtegida: limite(
      env.RATE_LIMIT_CONSULTA_PROTEGIDA_MAX,
      env.RATE_LIMIT_CONSULTA_PROTEGIDA_WINDOW_MS,
      120,
      60 * 1000,
      'RATE_LIMIT_CONSULTA_PROTEGIDA',
      errores,
    ),
    invitacion: limite(env.RATE_LIMIT_INVITACION_MAX, env.RATE_LIMIT_INVITACION_WINDOW_MS, 10, 15 * 60 * 1000, 'RATE_LIMIT_INVITACION', errores),
    reanudacion: limite(env.RATE_LIMIT_REANUDACION_MAX, env.RATE_LIMIT_REANUDACION_WINDOW_MS, 300, 15 * 60 * 1000, 'RATE_LIMIT_REANUDACION', errores),
    loginAdministrativo: limite(env.RATE_LIMIT_LOGIN_ADMIN_MAX, env.RATE_LIMIT_LOGIN_ADMIN_WINDOW_MS, 5, 15 * 60 * 1000, 'RATE_LIMIT_LOGIN_ADMIN', errores),
    segundoFactor: limite(env.RATE_LIMIT_SEGUNDO_FACTOR_MAX, env.RATE_LIMIT_SEGUNDO_FACTOR_WINDOW_MS, 10, 15 * 60 * 1000, 'RATE_LIMIT_SEGUNDO_FACTOR', errores),
  };

  const saltosDeProxy = entero(env.TRUST_PROXY_HOPS, 1);
  if (saltosDeProxy === null || saltosDeProxy < 0 || saltosDeProxy > 5) errores.push('TRUST_PROXY_HOPS debe ser un entero entre 0 y 5');

  const diasDeCaducidad = entero(env.SOLICITUD_DE_VINCULO_CADUCIDAD_DIAS, 30);
  if (diasDeCaducidad === null || diasDeCaducidad < 1 || diasDeCaducidad > 365) {
    errores.push('SOLICITUD_DE_VINCULO_CADUCIDAD_DIAS debe ser un entero entre 1 y 365');
  }

  const demoProfesionales = leerDemoProfesionales(env.BE_DEMO_PROFESIONALES, appEnv, errores);

  // WP-08 D-H: el origen del proveedor es configurable (las pruebas usan un proveedor falso local); en producción
  // tiene que ser https, y un origen local solo se admite fuera de producción.
  const origenDeProveedor = (valor: string | undefined, porDefecto: string, nombre: string): string => {
    const origen = (valor ?? porDefecto).replace(/\/+$/, '');
    const esLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen);
    if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origen) && !(esLocal && appEnv !== 'production')) errores.push(`${nombre} debe ser un origen https sin ruta`);
    return origen;
  };
  const proveedores: ProveedoresExternos = {
    openFoodFactsUrl: origenDeProveedor(env.OPEN_FOOD_FACTS_BASE_URL, 'https://world.openfoodfacts.org', 'OPEN_FOOD_FACTS_BASE_URL'),
    wgerUrl: origenDeProveedor(env.WGER_BASE_URL, 'https://wger.de', 'WGER_BASE_URL'),
    presupuestoMs: PRESUPUESTO_DEL_PROVEEDOR_MS,
  };

  // DL-120: sin valor, la base existente. Otro valor no se interpreta: el mensaje nombra la variable, nunca el valor.
  const almacen = (env.BE_MEDIOS_ALMACEN ?? '').trim() || 'postgres';
  if (!(ALMACENES_DE_MEDIOS as readonly string[]).includes(almacen)) {
    errores.push('BE_MEDIOS_ALMACEN solo admite «postgres»: el almacenamiento compatible con S3 no está configurado (DL-120)');
  }

  // DL-125: solo `true` o `false`; sin valor, `false`. Otro valor no se interpreta.
  const exigida = (env.BE_EVIDENCIA_VISUAL_EXIGIDA ?? '').trim() || 'false';
  if (exigida !== 'true' && exigida !== 'false') errores.push('BE_EVIDENCIA_VISUAL_EXIGIDA solo admite «true» o «false» (DL-125)');

  // DL-133: el canal de los avisos y el secreto de la tarea programada. Ningún valor se imprime.
  const canal = (env.BE_AVISOS_PUSH ?? '').trim() || 'desactivado';
  if (!(CANALES_DE_AVISOS as readonly string[]).includes(canal)) errores.push('BE_AVISOS_PUSH solo admite «expo» o «desactivado» (DL-133)');
  const expoUrl = origenDeProveedor(env.EXPO_PUSH_URL, 'https://exp.host', 'EXPO_PUSH_URL');
  const expoToken = (env.EXPO_ACCESS_TOKEN ?? '').trim() || null;
  if (expoToken !== null && (expoToken.length > 200 || /\s/.test(expoToken))) errores.push('EXPO_ACCESS_TOKEN no tiene la forma de un token de acceso de Expo');
  const secretoDeTareas = (env.BE_SECRETO_DE_TAREAS ?? '').trim() || null;
  if (secretoDeTareas !== null && secretoDeTareas.length < 32) errores.push('BE_SECRETO_DE_TAREAS debe tener al menos 32 caracteres');

  // DL-138: los client IDs de Google y el origen de sus claves. Un client ID mal copiado (o un secreto pegado en su lugar)
  // no arranca; el mensaje nombra la variable, nunca el valor.
  const clientIds = (env.GOOGLE_CLIENT_IDS ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (clientIds.some((c) => !CLIENT_ID_DE_GOOGLE.test(c))) errores.push('GOOGLE_CLIENT_IDS solo admite client IDs de Google (…apps.googleusercontent.com), separados por coma');
  const jwksUrl = (env.GOOGLE_JWKS_URL ?? '').trim() || JWKS_DE_GOOGLE;
  const jwksLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/\S*$/.test(jwksUrl);
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?\/\S*$/i.test(jwksUrl) && !(jwksLocal && appEnv !== 'production')) errores.push('GOOGLE_JWKS_URL debe ser una URL https');

  // WP-ADMINISTRACION: la clave del segundo factor, en base64url, de 32 bytes como mínimo. El mensaje nombra la variable,
  // nunca el valor.
  const claveCruda = (env.BE_CLAVE_DEL_SEGUNDO_FACTOR ?? '').trim();
  let claveDelSegundoFactor: Buffer | null = null;
  if (claveCruda !== '') {
    // El decodificador base64 de Node acepta los dos alfabetos (común y url); la forma se comprueba antes, para que un texto
    // que no es base64 no se decodifique a medias.
    const decodificada = /^[A-Za-z0-9+/_-]+={0,2}$/.test(claveCruda) ? Buffer.from(claveCruda, 'base64') : Buffer.alloc(0);
    if (decodificada.length < 32) errores.push('BE_CLAVE_DEL_SEGUNDO_FACTOR debe ser base64 (común o url) de 32 bytes o más');
    else claveDelSegundoFactor = decodificada;
  }

  if (errores.length > 0) {
    throw new Error(`Configuración inválida: ${errores.join('; ')}`);
  }

  return {
    appEnv: appEnv as Ambiente,
    port,
    databaseUrl: databaseUrl as string,
    corsAllowedOrigins,
    jwtSecret,
    costoBcrypt: costoBcrypt as number,
    limites,
    saltosDeProxy: saltosDeProxy as number,
    caducidadDeSolicitudMs: (diasDeCaducidad ?? 30) * 24 * 60 * 60 * 1000,
    demoProfesionales,
    proveedores,
    mediosAlmacen: almacen as AlmacenDeMediosConfigurado,
    evidenciaVisualExigida: exigida === 'true',
    avisos: { canal: canal as CanalDeAvisos, expoUrl, expoToken, presupuestoMs: PRESUPUESTO_DEL_PROVEEDOR_MS },
    secretoDeTareas,
    google: { clientIds: [...new Set(clientIds)], jwksUrl, presupuestoMs: PRESUPUESTO_DEL_PROVEEDOR_MS },
    claveDelSegundoFactor,
  };
}

/**
 * `BE_DEMO_PROFESIONALES` = entradas separadas por «;», cada una `identidadId|ALCANCE|TIPO|Nombre visible` y, opcional, un
 * quinto campo `PENDIENTE` (WP-ADMINISTRACION): el área se presenta y queda pendiente de revisión por Administración.
 * Ejemplo: `2f8fa677-663e-43bb-b043-19a1057d8873|NUTRICION|SANITARIO|Lic. Demo Nutrición`. No es un secreto.
 * Por identidad y no por correo: la cuenta se registra primero y después se declara, así que nadie puede anticiparse
 * registrando el correo publicado. La siembra además exige que la cuenta sea sintética (correo @example.invalid).
 * Con `APP_ENV=production` se rechaza (el servicio interno no verifica cuentas reales, DL-036).
 */
function leerDemoProfesionales(valor: string | undefined, appEnv: string | undefined, errores: string[]): ProfesionalDeDemostracion[] {
  if (valor === undefined || valor.trim() === '') return [];
  if (appEnv !== 'test' && appEnv !== 'development') {
    errores.push('BE_DEMO_PROFESIONALES solo se admite con APP_ENV test o development');
    return [];
  }
  const lista: ProfesionalDeDemostracion[] = [];
  for (const entrada of valor.split(';').map((e) => e.trim()).filter((e) => e.length > 0)) {
    const [identidadId, alcance, tipo, nombreVisible, estado, ...sobra] = entrada.split('|').map((p) => p.trim());
    const identidadValida = typeof identidadId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identidadId);
    const tipoValido = tipo === TipoDePerfilProfesional.SANITARIO || tipo === TipoDePerfilProfesional.NO_SANITARIO;
    const estadoValido = estado === undefined || estado === 'PENDIENTE';
    if (!identidadValida || !esAlcance(alcance) || !tipoValido || !nombreVisible || !estadoValido || sobra.length > 0) {
      errores.push('BE_DEMO_PROFESIONALES tiene una entrada inválida (identidadId|ALCANCE|TIPO|Nombre[|PENDIENTE])');
      return [];
    }
    lista.push({ identidadId: identidadId.toLowerCase(), alcance, tipo, nombreVisible, estadoInicial: estado === 'PENDIENTE' ? 'PENDIENTE' : 'VERIFICADO' });
  }
  return lista;
}

function entero(valor: string | undefined, porDefecto: number): number | null {
  if (valor === undefined || valor === '') return porDefecto;
  const n = Number(valor);
  return Number.isInteger(n) ? n : null;
}

function limite(max: string | undefined, ventana: string | undefined, maxDef: number, ventanaDef: number, nombre: string, errores: string[]): Limite {
  const maximo = entero(max, maxDef);
  const ventanaMs = entero(ventana, ventanaDef);
  if (maximo === null || maximo < 1) errores.push(`${nombre}_MAX debe ser un entero positivo`);
  if (ventanaMs === null || ventanaMs < 1000) errores.push(`${nombre}_WINDOW_MS debe ser un entero ≥ 1000`);
  return { maximo: maximo ?? maxDef, ventanaMs: ventanaMs ?? ventanaDef };
}
