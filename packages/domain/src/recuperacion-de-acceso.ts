/**
 * UF-03 de WP-USO-FINAL (DL-169; UF-D9; 04 RF-005, UC-E09; 08 §24.4 a §24.6, §26.3 y §38; 09 v0.12 §10): recuperar el
 * acceso local sin crear otra identidad y sin revelar si una cuenta existe.
 * - **Pedir** (API-ACC-P1-01): la respuesta es la misma exista o no la cuenta (202, con un `recoveryId` siempre nuevo y
 *   el mismo vencimiento). Lo único que cambia es lo que llega por correo: el código a una cuenta con contraseña, el aviso
 *   de que entra con Google a una que no tiene contraseña, y nada a un correo sin cuenta o a una cuenta que no opera.
 * - **Completar** (API-ACC-P1-02): con un código vigente de la cuenta del pedido, la persona define una contraseña nueva.
 *   La identidad es la misma, todas sus sesiones terminan y queda auditado. Un código que no vale responde siempre el
 *   mismo 422, y cinco que no valen anulan el pedido.
 * - **Sin proveedor de correo** rige la recuperación asistida de UF-D9: Administración verifica a la persona por el canal
 *   de ayuda, revoca sus sesiones y le da un código de un solo uso (API-ADM-18), que la persona usa igual que el del
 *   correo. Con proveedor, la asistida sigue disponible para quien ya no tiene ese correo.
 * Los códigos se dictan o se copian a mano: diez caracteres del alfabeto de los códigos (Crockford base32, 50 bits),
 * escritos en dos grupos de cinco. La base guarda solo su huella (HMAC con una clave del servidor).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';

// ─── Vigencias, intentos y la forma del código ──────────────────────────────────────────────────

/** El código que llega por correo vale 30 minutos («vigencia corta», 08 §24.4). */
export const VIGENCIA_DEL_CODIGO_POR_CORREO_MS = 30 * 60 * 1000;
/** El código de la recuperación asistida vale 24 horas, como el de incorporación de Administración. */
export const VIGENCIA_DEL_CODIGO_ASISTIDO_MS = 24 * 60 * 60 * 1000;
/** Cinco códigos que no valen sobre un mismo pedido lo anulan: hay que pedir otro. */
export const INTENTOS_POR_PEDIDO_DE_RECUPERACION = 5;
/** Diez caracteres de 5 bits cada uno: 50 bits. */
export const LARGO_DEL_CODIGO_DE_RECUPERACION_DE_ACCESO = 10;

/**
 * Un código de recuperación del acceso, normalizado: mayúsculas, sin espacios ni guiones, y las letras que se confunden
 * leídas como el número que parecen (I y L como 1, O como 0). `null` si no tiene diez caracteres del alfabeto.
 */
export function normalizarCodigoDeRecuperacionDeAcceso(texto: string): string | null {
  const n = texto
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0');
  return /^[0-9A-HJKMNP-TV-Z]{10}$/.test(n) ? n : null;
}

/** Cómo se muestra: dos grupos de cinco, con guion («ABCDE-FGHJK»). */
export function codigoDeRecuperacionEnGrupos(normalizado: string): string {
  return normalizado.length === LARGO_DEL_CODIGO_DE_RECUPERACION_DE_ACCESO ? `${normalizado.slice(0, 5)}-${normalizado.slice(5)}` : normalizado;
}

export type EstadoDelCodigoDeRecuperacion = 'VIGENTE' | 'VENCIDO' | 'USADO' | 'ANULADO';

/**
 * El estado de un código, con lo que guarda la base. Usado o anulado manda sobre el vencimiento: un código que ya se usó
 * no vuelve a valer aunque todavía no haya vencido.
 */
export function estadoDelCodigoDeRecuperacion(c: { readonly venceEn: Date; readonly usadoEn: Date | null; readonly anuladoEn: Date | null; readonly ahora: Date }): EstadoDelCodigoDeRecuperacion {
  if (c.usadoEn) return 'USADO';
  if (c.anuladoEn) return 'ANULADO';
  if (c.ahora.getTime() >= c.venceEn.getTime()) return 'VENCIDO';
  return 'VIGENTE';
}

// ─── Qué hace un pedido, según la cuenta (nunca cambia la respuesta) ────────────────────────────

/** La cuenta del correo pedido, como la ve el servidor. `null`: no hay cuenta con ese correo. */
export interface CuentaParaRecuperar {
  /** OPERATIVA: ni suspendida ni cerrada. */
  readonly operativa: boolean;
  /** Tiene el método LOCAL con su credencial (una cuenta cerrada la tiene suprimida). */
  readonly conContrasena: boolean;
  /** Tiene la cuenta de Google asociada. */
  readonly conGoogle: boolean;
}

export interface PlanDelPedidoDeRecuperacion {
  /** Si se guarda el pedido (el que después acepta los códigos de la cuenta). */
  readonly guardar: boolean;
  /** Qué se manda por correo, si hay proveedor: el código, el aviso de que entra con Google, o nada. */
  readonly correo: 'CODIGO' | 'ENTRA_CON_GOOGLE' | null;
  /** El motivo que queda en la auditoría (nunca en la respuesta). */
  readonly motivo: 'CUENTA_INEXISTENTE' | 'CUENTA_NO_OPERATIVA' | 'SIN_CONTRASENA' | 'CODIGO_POR_CORREO' | 'PEDIDO_SIN_CORREO';
}

/**
 * Lo que hace el servidor con un pedido. Solo una cuenta operativa con contraseña guarda el pedido; el correo sale si hay
 * proveedor. A una cuenta sin contraseña (creada con Google) le llega, si hay proveedor, el aviso de que entra con Google
 * (02:302: no tiene contraseña que recuperar). Sin cuenta, o con una que no opera, no pasa nada. La respuesta no depende
 * de esto: la arma `respuestaDelPedidoDeRecuperacion`, que no recibe la cuenta.
 */
export function planDelPedidoDeRecuperacion(cuenta: CuentaParaRecuperar | null, correoActivo: boolean): PlanDelPedidoDeRecuperacion {
  if (!cuenta) return { guardar: false, correo: null, motivo: 'CUENTA_INEXISTENTE' };
  if (!cuenta.operativa) return { guardar: false, correo: null, motivo: 'CUENTA_NO_OPERATIVA' };
  if (!cuenta.conContrasena) return { guardar: false, correo: correoActivo && cuenta.conGoogle ? 'ENTRA_CON_GOOGLE' : null, motivo: 'SIN_CONTRASENA' };
  return correoActivo ? { guardar: true, correo: 'CODIGO', motivo: 'CODIGO_POR_CORREO' } : { guardar: true, correo: null, motivo: 'PEDIDO_SIN_CORREO' };
}

// ─── API-ACC-P1-01 · Pedir la recuperación ──────────────────────────────────────────────────────

export const PedirRecuperacionRequestSchema = z.strictObject({
  /** El correo de la cuenta (el identificador local; 09 v0.12 §10). */
  identifier: z.string().max(400),
});
export type PedirRecuperacionRequest = z.infer<typeof PedirRecuperacionRequestSchema>;

/** EMAIL: el código llega por correo. ASSISTED: no hay proveedor de correo, y el código lo da Administración (UF-D9). */
export const ENTREGAS_DEL_CODIGO = ['EMAIL', 'ASSISTED'] as const;
export type EntregaDelCodigo = (typeof ENTREGAS_DEL_CODIGO)[number];

export const RecuperacionPedidaResponseSchema = z.strictObject({
  data: z.strictObject({
    /** El pedido, para completarlo. Siempre uno nuevo, exista o no la cuenta. */
    recoveryId: IdOpaco,
    /** Hasta cuándo vale un código que llegue por correo: 30 minutos. Igual para todos los pedidos. */
    expiresAt: Instante,
    /** Cómo llega el código: depende de que BE tenga proveedor de correo, nunca de la cuenta. */
    delivery: z.enum(ENTREGAS_DEL_CODIGO),
  }),
});
export type RecuperacionPedidaResponse = z.infer<typeof RecuperacionPedidaResponseSchema>;

/**
 * La respuesta de API-ACC-P1-01. No recibe la cuenta: lo único que puede decir es el pedido (siempre nuevo), el momento
 * y si BE manda correos, que es igual para todos.
 */
export function respuestaDelPedidoDeRecuperacion(p: { readonly recoveryId: string; readonly momento: Date; readonly correoActivo: boolean }): RecuperacionPedidaResponse {
  return {
    data: {
      recoveryId: p.recoveryId,
      expiresAt: new Date(p.momento.getTime() + VIGENCIA_DEL_CODIGO_POR_CORREO_MS).toISOString(),
      delivery: p.correoActivo ? 'EMAIL' : 'ASSISTED',
    },
  };
}

// ─── API-ACC-P1-02 · Completar la recuperación ──────────────────────────────────────────────────

export const CompletarRecuperacionRequestSchema = z.strictObject({
  /** El código que llegó por correo o que dio Administración (09 v0.12 §10: `proof`). */
  proof: z.string().max(100),
  /** La contraseña nueva, con la misma política que el alta (DL-013). */
  newCredential: z.string(),
});
export type CompletarRecuperacionRequest = z.infer<typeof CompletarRecuperacionRequestSchema>;

// ─── API-ADM-18 · La recuperación asistida (UF-D9) ──────────────────────────────────────────────

export const EmitirRecuperacionAsistidaRequestSchema = z.strictObject({
  /** El correo de acceso de la cuenta, como lo escribió la persona por el canal de ayuda. */
  email: z.string().max(400),
  /** Cómo se verificó que quien pide es la persona (lo ve solo Administración). */
  rationale: z.string().max(2000),
});
export type EmitirRecuperacionAsistidaRequest = z.infer<typeof EmitirRecuperacionAsistidaRequestSchema>;

export const RecuperacionAsistidaResponseSchema = z.strictObject({
  data: z.strictObject({
    identityId: IdOpaco,
    /** El código, en dos grupos de cinco. Se muestra una sola vez: la base guarda su huella. */
    code: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/),
    expiresAt: Instante,
    /** Cuántas sesiones de la cuenta se cerraron al emitirlo. */
    sessionsRevoked: z.number().int().min(0),
  }),
});
export type RecuperacionAsistidaResponse = z.infer<typeof RecuperacionAsistidaResponseSchema>;

/** Los issues del 422 de API-ADM-18, en el campo del correo o del fundamento. */
export const ISSUE_DE_RECUPERACION_ASISTIDA = {
  FUNDAMENTO: 'RATIONALE_REQUIRED',
  CORREO: 'INVALID_LOCAL_IDENTIFIER',
  CUENTA_ADMINISTRATIVA: 'ACCOUNT_IS_ADMINISTRATIVE',
  CUENTA_NO_OPERATIVA: 'ACCOUNT_NOT_OPERATIONAL',
  SIN_CONTRASENA: 'ACCOUNT_WITHOUT_PASSWORD',
} as const;

// ─── Los textos (website, APK, correo y /admin) ─────────────────────────────────────────────────

const MINUTOS_DEL_CODIGO = VIGENCIA_DEL_CODIGO_POR_CORREO_MS / 60000;

export const COPY_RECUPERACION = {
  enlace: '¿Olvidaste tu contraseña?',
  titulo: 'Recuperar el acceso',
  queEs: 'Escribí el correo de tu cuenta. Te damos un código para definir una contraseña nueva: tu cuenta, tu historia y tus vínculos siguen iguales.',
  correo: 'Correo electrónico',
  correoFalta: 'Ingresá el correo de tu cuenta.',
  correoInvalido: 'Revisá el correo: falta algo, como la arroba.',
  pedir: 'Pedir el código',
  pidiendo: 'Pidiendo…',
  /** El mismo texto exista o no la cuenta: no dice si hay una. */
  pedidoPorCorreo: `Si hay una cuenta con contraseña con ese correo, te mandamos un código. Vence a los ${MINUTOS_DEL_CODIGO} minutos: revisá también el correo no deseado.`,
  pedidoAsistido:
    'Todavía no mandamos códigos por correo. Escribile a Administración por el canal de ayuda, desde el correo de tu cuenta: te va a dar un código. Cuando lo tengas, escribilo acá.',
  conGoogle: '¿Tu cuenta entra con Google? No tiene contraseña: volvé y tocá «Continuar con Google».',
  codigo: 'Código',
  codigoAyuda: 'Diez letras y números. Da igual si lo escribís con guion o en minúsculas.',
  codigoFalta: 'Escribí el código que te dimos.',
  contrasenaNueva: 'Contraseña nueva',
  contrasenaAyuda: 'Al menos 12 caracteres.',
  repetir: 'Repetí la contraseña nueva',
  noCoinciden: 'Las dos contraseñas no coinciden.',
  cambiar: 'Cambiar la contraseña',
  cambiando: 'Cambiando la contraseña…',
  /** RECOVERY_CODE_INVALID: el mismo mensaje sea cual sea la causa. */
  codigoInvalido: `Ese código no vale: puede estar mal escrito, haber vencido (vale ${MINUTOS_DEL_CODIGO} minutos) o ya haberse usado. Revisalo o pedí otro.`,
  pedirOtro: 'Pedir otro código',
  listo: 'Listo: cambiaste tu contraseña. Cerramos tus sesiones abiertas en otros dispositivos.',
  entrando: 'Entrando con tu contraseña nueva…',
  irAEntrar: 'Iniciar sesión',
  volver: 'Volver a Iniciar sesión',
  /** Lo que llega por correo (texto plano, sin enlaces: el código se escribe en la pantalla donde se pidió). */
  mensaje: {
    asunto: 'Tu código para recuperar el acceso a BE',
    texto: (codigo: string): string =>
      [
        'Hola.',
        '',
        'Pediste recuperar el acceso a tu cuenta de BE. Tu código es:',
        '',
        codigo,
        '',
        `Vence a los ${MINUTOS_DEL_CODIGO} minutos y sirve una sola vez. Escribilo en la pantalla donde lo pediste, junto con tu contraseña nueva.`,
        '',
        'Si no lo pediste, ignorá este correo: tu contraseña no cambia.',
        '',
        'BE · Better Everyday',
      ].join('\n'),
    asuntoGoogle: 'Tu cuenta de BE entra con Google',
    textoGoogle: [
      'Hola.',
      '',
      'Pediste recuperar el acceso a tu cuenta de BE. Tu cuenta entra con Google y no tiene contraseña: en Iniciar sesión, tocá «Continuar con Google» y elegí esta cuenta.',
      '',
      'Si no lo pediste, ignorá este correo.',
      '',
      'BE · Better Everyday',
    ].join('\n'),
  },
  /** /admin: la recuperación asistida (API-ADM-18). */
  asistida: {
    titulo: 'Recuperar el acceso de una persona',
    queEs:
      'Cuando una persona no puede recuperar su contraseña por correo, la verificás por el canal de ayuda y le das un código. Al emitirlo se cierran todas sus sesiones. El código vale 24 horas y una sola vez; emitir otro anula el anterior.',
    correo: 'Correo de acceso de la cuenta',
    fundamento: 'Cómo verificaste que es la persona',
    fundamentoAyuda: 'Por ejemplo: «Escribió desde el correo de la cuenta el 12/11 y confirmó la fecha de alta». Lo ve solo Administración.',
    emitir: 'Emitir el código',
    emitiendo: 'Emitiendo…',
    emitido: (sesiones: number): string =>
      `Código emitido. Dáselo a la persona por el canal de ayuda: no se vuelve a mostrar. ${sesiones === 1 ? 'Se cerró 1 sesión' : `Se cerraron ${sesiones} sesiones`} de la cuenta.`,
    vence: (fecha: string): string => `Vence: ${fecha}.`,
    comoSigue: 'La persona entra a «¿Olvidaste tu contraseña?», escribe su correo y después este código con su contraseña nueva.',
    problemas: {
      RATIONALE_REQUIRED: 'Escribí cómo verificaste a la persona (de 1 a 1000 caracteres).',
      INVALID_LOCAL_IDENTIFIER: 'Revisá el correo.',
      ACCOUNT_IS_ADMINISTRATIVE: 'Es una cuenta administrativa: su acceso lo restablece el operador con el comando interno.',
      ACCOUNT_NOT_OPERATIONAL: 'La cuenta está suspendida o cerrada.',
      ACCOUNT_WITHOUT_PASSWORD: 'La cuenta entra con Google y no tiene contraseña: la persona entra con «Continuar con Google».',
    } as Readonly<Record<(typeof ISSUE_DE_RECUPERACION_ASISTIDA)[keyof typeof ISSUE_DE_RECUPERACION_ASISTIDA], string>>,
    sinCuenta: 'No hay una cuenta con ese correo.',
  },
} as const;
