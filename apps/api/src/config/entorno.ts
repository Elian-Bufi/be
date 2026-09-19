/**
 * Validación de configuración al arranque (07 §27, TEST-RUN-004).
 * Si la configuración es inválida el proceso no arranca: el readiness gate del deploy
 * falla y la plataforma conserva la versión anterior (07 §36).
 * Nunca se imprimen valores: solo nombres de variables (08 §32).
 */
import { esAlcance, TipoDePerfilProfesional, type Alcance } from '@be/domain';

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
   */
  readonly limites: {
    readonly login: Limite;
    readonly loginPorIp: Limite;
    readonly loginPorIdentificador: Limite;
    readonly registro: Limite;
  };
  /** Saltos de proxy confiables para `req.ip` (Express `trust proxy`). Render: 1. */
  readonly saltosDeProxy: number;
  /** WP-03 · plazo de caducidad de una solicitud de vínculo (DEUDA_LEGAJO DL-037). 30 días por defecto. */
  readonly caducidadDeSolicitudMs: number;
  /**
   * WP-03 · profesionales de demostración que el servicio interno verifica y habilita al arrancar (DEUDA_LEGAJO DL-036).
   * Solo en `test` y `development`, y solo con correos `example.invalid`. Vacío por defecto.
   */
  readonly demoProfesionales: readonly ProfesionalDeDemostracion[];
}

export interface ProfesionalDeDemostracion {
  readonly correo: string;
  readonly alcance: Alcance;
  readonly tipo: TipoDePerfilProfesional;
  readonly nombreVisible: string;
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
  };

  const saltosDeProxy = entero(env.TRUST_PROXY_HOPS, 1);
  if (saltosDeProxy === null || saltosDeProxy < 0 || saltosDeProxy > 5) errores.push('TRUST_PROXY_HOPS debe ser un entero entre 0 y 5');

  const diasDeCaducidad = entero(env.SOLICITUD_DE_VINCULO_CADUCIDAD_DIAS, 30);
  if (diasDeCaducidad === null || diasDeCaducidad < 1 || diasDeCaducidad > 365) {
    errores.push('SOLICITUD_DE_VINCULO_CADUCIDAD_DIAS debe ser un entero entre 1 y 365');
  }

  const demoProfesionales = leerDemoProfesionales(env.BE_DEMO_PROFESIONALES, appEnv, errores);

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
  };
}

/**
 * `BE_DEMO_PROFESIONALES` = entradas separadas por «;», cada una `correo|ALCANCE|TIPO|Nombre visible`.
 * Ejemplo: `demo.pn@example.invalid|NUTRICION|SANITARIO|Lic. Demo Nutrición`. No es un secreto: solo lista cuentas
 * sintéticas. Con `APP_ENV=production` se rechaza (el servicio interno no verifica cuentas reales, DL-036).
 */
function leerDemoProfesionales(valor: string | undefined, appEnv: string | undefined, errores: string[]): ProfesionalDeDemostracion[] {
  if (valor === undefined || valor.trim() === '') return [];
  if (appEnv !== 'test' && appEnv !== 'development') {
    errores.push('BE_DEMO_PROFESIONALES solo se admite con APP_ENV test o development');
    return [];
  }
  const lista: ProfesionalDeDemostracion[] = [];
  for (const entrada of valor.split(';').map((e) => e.trim()).filter((e) => e.length > 0)) {
    const [correo, alcance, tipo, nombreVisible] = entrada.split('|').map((p) => p.trim());
    const correoValido = typeof correo === 'string' && /^[^\s@|;]+@example\.invalid$/.test(correo.toLowerCase());
    const tipoValido = tipo === TipoDePerfilProfesional.SANITARIO || tipo === TipoDePerfilProfesional.NO_SANITARIO;
    if (!correoValido || !esAlcance(alcance) || !tipoValido || !nombreVisible) {
      errores.push('BE_DEMO_PROFESIONALES tiene una entrada inválida (correo@example.invalid|ALCANCE|TIPO|Nombre)');
      return [];
    }
    lista.push({ correo: correo.toLowerCase(), alcance, tipo, nombreVisible });
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
