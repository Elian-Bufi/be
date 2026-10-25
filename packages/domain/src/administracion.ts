/**
 * WP-ADMINISTRACION (DL-155; docs/paquetes/WP-ADMINISTRACION.md): las reglas puras de la administración de profesionales
 * por área. Las usan la API (para decidir y para responder qué se puede hacer) y el website (para explicarlo). No agregan
 * ninguna transición: cada decisión es una de las del 06 §6.8.2 o de la habilitación (`verificacion-profesional.ts`), y la
 * base vuelve a exigirlas con sus disparadores.
 *
 * - **Verificación y habilitación son dos cosas** (REG-06-33): una decisión cambia una sola de las dos. Rehabilitar no
 *   concede una habilitación retirada; conceder no verifica.
 * - **Puede operar un área** quien la tiene `VERIFICADO` y con la habilitación `CONCEDIDA`: lo mismo que exigen el PDP
 *   (`evaluarAutorizacion`) y las comprobaciones de catálogos, plantillas y recetas.
 * - **Una observación no cambia el estado** (REG-06-37): `PENDIENTE → PENDIENTE`.
 */
import type { Alcance } from './alcance';
import {
  evaluarTransicionDeHabilitacion,
  evaluarTransicionDeVerificacion,
  type EstadoDeHabilitacion,
  type EstadoDeVerificacionProfesional,
  type TransicionDeHabilitacion,
  type TransicionDeVerificacion,
} from './verificacion-profesional';

// ─── Decisiones ─────────────────────────────────────────────────────────────────────────────────

/** Las decisiones que el administrador puede tomar sobre un área (API-ADM-13). */
export const DECISIONES_ADMINISTRATIVAS = ['OBSERVE', 'VERIFY', 'REJECT', 'SUSPEND', 'REINSTATE', 'GRANT_ENABLEMENT', 'WITHDRAW_ENABLEMENT'] as const;
export type DecisionAdministrativa = (typeof DECISIONES_ADMINISTRATIVAS)[number];

export type TransicionDeLaDecision =
  | { readonly sobre: 'VERIFICACION'; readonly transicion: TransicionDeVerificacion }
  | { readonly sobre: 'HABILITACION'; readonly transicion: TransicionDeHabilitacion };

/** Cada decisión es exactamente una transición del dominio (PRO-11, 12 y 13, más la habilitación de UC-ADM-04). */
export const TRANSICION_DE_LA_DECISION: Readonly<Record<DecisionAdministrativa, TransicionDeLaDecision>> = {
  OBSERVE: { sobre: 'VERIFICACION', transicion: 'RegistrarObservacion' },
  VERIFY: { sobre: 'VERIFICACION', transicion: 'VerificarAlcance' },
  REJECT: { sobre: 'VERIFICACION', transicion: 'RechazarAlcance' },
  SUSPEND: { sobre: 'VERIFICACION', transicion: 'SuspenderAlcance' },
  REINSTATE: { sobre: 'VERIFICACION', transicion: 'RehabilitarAlcance' },
  GRANT_ENABLEMENT: { sobre: 'HABILITACION', transicion: 'ConcederHabilitacion' },
  WITHDRAW_ENABLEMENT: { sobre: 'HABILITACION', transicion: 'RetirarHabilitacion' },
};

/**
 * Las decisiones que se le comunican al profesional con un texto propio, obligatorio: qué corregir (observación), por qué
 * no (rechazo) y qué pasa (suspensión, retiro). Las demás llevan un texto fijo y, si el administrador quiere, uno propio.
 */
export const DECISIONES_CON_MENSAJE_OBLIGATORIO: ReadonlySet<DecisionAdministrativa> = new Set(['OBSERVE', 'REJECT', 'SUSPEND', 'WITHDRAW_ENABLEMENT']);

/** El fundamento interno y el texto para el profesional, con tope (09v8 PRO-11: `rationale`). */
export const LARGO_MAXIMO_DEL_FUNDAMENTO = 1000;
export const LARGO_MAXIMO_DEL_MENSAJE = 600;

/** El estado de un área: su verificación y su habilitación, cada una o ninguna (sin trayectoria todavía). */
export interface EstadoDelArea {
  readonly verificacion: EstadoDeVerificacionProfesional | null;
  readonly habilitacion: EstadoDeHabilitacion | null;
}

/** Puede operar el área en BE: verificada y con la habilitación concedida. */
export function puedeOperar(e: EstadoDelArea): boolean {
  return e.verificacion === 'VERIFICADO' && e.habilitacion === 'CONCEDIDA';
}

export type MotivoDeRechazoDeDecision = 'TRANSICION_NO_DECLARADA' | 'SIN_FUNDAMENTO' | 'SIN_MENSAJE' | 'SIN_TRAYECTORIA';

export type EvaluacionDeDecision =
  | { readonly permitida: true; readonly transicion: TransicionDeLaDecision; readonly despues: EstadoDelArea }
  | { readonly permitida: false; readonly motivo: MotivoDeRechazoDeDecision };

/**
 * Si la decisión vale para el estado actual del área, con el fundamento y el texto que trae. El orden de los rechazos es el
 * del 09 (09:213-233): primero la transición (422 INVALID_STATE_TRANSITION), después lo que falta escribir.
 * - Conceder la habilitación pide que el área tenga trayectoria: una habilitación sin nada presentado no tiene sentido.
 * - El estado de después sale de la lista blanca del dominio, no de una tabla propia.
 */
export function evaluarDecision(estado: EstadoDelArea, decision: DecisionAdministrativa, fundamento: string, mensaje: string | null | undefined): EvaluacionDeDecision {
  const t = TRANSICION_DE_LA_DECISION[decision];
  const conFundamento = fundamento.trim().length > 0;
  let despues: EstadoDelArea;
  if (t.sobre === 'VERIFICACION') {
    const e = evaluarTransicionDeVerificacion(estado.verificacion, t.transicion, 'x');
    if (!e.permitida) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
    despues = { verificacion: e.transicion.destino, habilitacion: estado.habilitacion };
  } else {
    if (estado.verificacion === null) return { permitida: false, motivo: 'SIN_TRAYECTORIA' };
    const e = evaluarTransicionDeHabilitacion(estado.habilitacion, t.transicion, 'x');
    if (!e.permitida) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
    despues = { verificacion: estado.verificacion, habilitacion: e.destino };
  }
  if (!conFundamento) return { permitida: false, motivo: 'SIN_FUNDAMENTO' };
  if (DECISIONES_CON_MENSAJE_OBLIGATORIO.has(decision) && (mensaje ?? '').trim().length === 0) return { permitida: false, motivo: 'SIN_MENSAJE' };
  return { permitida: true, transicion: t, despues };
}

/** Las decisiones que el área admite hoy, en el orden en que se presentan (la principal primero). */
export function decisionesDisponibles(estado: EstadoDelArea): DecisionAdministrativa[] {
  return DECISIONES_ADMINISTRATIVAS.filter((d) => {
    const r = evaluarDecision(estado, d, 'x', 'x');
    return r.permitida;
  });
}

/** Si una decisión cambia que el profesional pueda operar el área: lo que decide a quiénes se avisa (D-6). */
export type CambioDeOperacion = 'DEJA_DE_OPERAR' | 'VUELVE_A_OPERAR' | 'SIN_CAMBIO';
export function cambioDeOperacion(antes: EstadoDelArea, despues: EstadoDelArea): CambioDeOperacion {
  const a = puedeOperar(antes);
  const d = puedeOperar(despues);
  return a && !d ? 'DEJA_DE_OPERAR' : !a && d ? 'VUELVE_A_OPERAR' : 'SIN_CAMBIO';
}

// ─── La situación que se muestra ────────────────────────────────────────────────────────────────

/** Cómo se dice el estado de un área en la lista y en la ficha: una sola situación, que sale de los dos estados. */
export const SITUACIONES_DE_AREA = ['NOT_PRESENTED', 'PENDING_REVIEW', 'CAN_OPERATE', 'VERIFIED_NOT_ENABLED', 'SUSPENDED', 'REJECTED'] as const;
export type SituacionDeArea = (typeof SITUACIONES_DE_AREA)[number];

export function situacionDelArea(e: EstadoDelArea): SituacionDeArea {
  switch (e.verificacion) {
    case null:
      return 'NOT_PRESENTED';
    case 'PENDIENTE':
      return 'PENDING_REVIEW';
    case 'RECHAZADO':
      return 'REJECTED';
    case 'SUSPENDIDO':
      return 'SUSPENDED';
    case 'VERIFICADO':
      return e.habilitacion === 'CONCEDIDA' ? 'CAN_OPERATE' : 'VERIFIED_NOT_ENABLED';
  }
}

// ─── La versión de un área (concurrencia optimista) ─────────────────────────────────────────────

/**
 * La versión de un área para `expectedVersion`: la de su verificación y la de su habilitación, 0 si no hay fila. Cualquier
 * cambio de una de las dos (también una observación, que avanza la versión) la cambia: dos administradores con
 * información vieja no se pisan.
 */
export function versionDelArea(versionDeVerificacion: number | null, versionDeHabilitacion: number | null): string {
  return `a${versionDeVerificacion ?? 0}-${versionDeHabilitacion ?? 0}`;
}

export const FORMA_DE_LA_VERSION_DEL_AREA = /^a(\d{1,9})-(\d{1,9})$/;

// ─── El segundo factor: vigencias y formas de los códigos ───────────────────────────────────────

/** La sesión administrativa vence a las 8 h; las comunes, a las 12 h (08 §26.2: «ADMIN con vida útil menor»). */
export const DURACION_DE_SESION_ADMINISTRATIVA_MS = 8 * 60 * 60 * 1000;
/** Después de la contraseña, el segundo factor (o su configuración) se completa en 10 minutos. */
export const PLAZO_DEL_SEGUNDO_FACTOR_MS = 10 * 60 * 1000;
/** Sin actividad administrativa durante 15 minutos, el segundo factor de la sesión vence y hay que escribir otro código. */
export const INACTIVIDAD_DEL_SEGUNDO_FACTOR_MS = 15 * 60 * 1000;
/** La configuración del autenticador (el secreto mostrado y sin confirmar) vence a los 10 minutos. */
export const VIGENCIA_DE_LA_CONFIGURACION_MS = 10 * 60 * 1000;
/** El código de incorporación que emite el comando vence a las 24 h. */
export const VIGENCIA_DEL_CODIGO_DE_INCORPORACION_MS = 24 * 60 * 60 * 1000;
/** Cinco códigos fallidos en una sesión la revocan. */
export const INTENTOS_DE_SEGUNDO_FACTOR_POR_SESION = 5;
/**
 * Códigos del autenticador que no valen, seguidos, en cualquier sesión de la identidad: con tantos, el autenticador queda
 * bloqueado hasta que entra un código de recuperación (que lo desbloquea) o el operador restablece el segundo factor. El
 * cupo por sesión solo no alcanza: cada entrada abre una sesión nueva (revisión de seguridad del 2026-10-25).
 */
export const FALLOS_SEGUIDOS_PARA_BLOQUEAR_EL_AUTENTICADOR = 10;
/** Diez códigos de recuperación por lote. */
export const CANTIDAD_DE_CODIGOS_DE_RECUPERACION = 10;

export type MetodoDelSegundoFactor = 'TOTP' | 'RECOVERY_CODE' | 'ENROLLMENT';

export type EstadoDelSegundoFactor =
  | { readonly estado: 'VERIFICADO'; readonly metodo: MetodoDelSegundoFactor; readonly venceSinActividadEn: Date }
  | { readonly estado: 'REQUERIDO'; readonly plazo: Date | null }
  | { readonly estado: 'CONFIGURACION_REQUERIDA'; readonly plazo: Date }
  | { readonly estado: 'PLAZO_VENCIDO' };

/**
 * El estado del segundo factor de una sesión administrativa, decidido con lo que guarda la base (nunca con el token ni con
 * el navegador):
 * - verificado y con actividad en los últimos 15 minutos → VERIFICADO;
 * - nunca verificado: dentro de los 10 minutos de la contraseña, REQUERIDO o CONFIGURACION_REQUERIDA (sin autenticador
 *   activo); después, PLAZO_VENCIDO (hay que volver a entrar);
 * - verificado alguna vez, pero sin actividad durante 15 minutos → REQUERIDO, sin plazo (hasta que vence la sesión).
 */
export function estadoDelSegundoFactor(p: {
  readonly inicioDeLaSesion: Date;
  readonly verificadoEn: Date | null;
  readonly metodo: MetodoDelSegundoFactor | null;
  readonly ultimaActividad: Date | null;
  readonly tieneAutenticadorActivo: boolean;
  readonly ahora: Date;
}): EstadoDelSegundoFactor {
  if (p.verificadoEn) {
    const referencia = p.ultimaActividad && p.ultimaActividad > p.verificadoEn ? p.ultimaActividad : p.verificadoEn;
    const vence = new Date(referencia.getTime() + INACTIVIDAD_DEL_SEGUNDO_FACTOR_MS);
    if (p.ahora < vence) return { estado: 'VERIFICADO', metodo: p.metodo ?? 'TOTP', venceSinActividadEn: vence };
    return p.tieneAutenticadorActivo ? { estado: 'REQUERIDO', plazo: null } : { estado: 'PLAZO_VENCIDO' };
  }
  const plazo = new Date(p.inicioDeLaSesion.getTime() + PLAZO_DEL_SEGUNDO_FACTOR_MS);
  if (p.ahora >= plazo) return { estado: 'PLAZO_VENCIDO' };
  return p.tieneAutenticadorActivo ? { estado: 'REQUERIDO', plazo } : { estado: 'CONFIGURACION_REQUERIDA', plazo };
}

/**
 * El alfabeto de los códigos que se dictan o se copian a mano (Crockford base32): sin I, L, O ni U, para que no se
 * confundan con 1, 0 ni entre sí. Al leer, se toleran minúsculas, espacios, guiones y esas letras dudosas.
 */
export const ALFABETO_DE_CODIGOS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function normalizarEnBase32(texto: string): string {
  return texto
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0');
}

/** Un código de recuperación: 12 caracteres (60 bits), escritos en tres grupos de cuatro. `null` si no tiene esa forma. */
export function normalizarCodigoDeRecuperacion(texto: string): string | null {
  const n = normalizarEnBase32(texto);
  return /^[0-9A-HJKMNP-TV-Z]{12}$/.test(n) ? n : null;
}

/** Un código de incorporación: 20 caracteres (100 bits), en cuatro grupos de cinco. `null` si no tiene esa forma. */
export function normalizarCodigoDeIncorporacion(texto: string): string | null {
  const n = normalizarEnBase32(texto);
  return /^[0-9A-HJKMNP-TV-Z]{20}$/.test(n) ? n : null;
}

/** Un código del autenticador: seis dígitos; se toleran espacios. `null` si no tiene esa forma. */
export function normalizarCodigoDelAutenticador(texto: string): string | null {
  const n = texto.replace(/\s/g, '');
  return /^\d{6}$/.test(n) ? n : null;
}

/** Cómo se muestra un código de 12 o 20 caracteres: en grupos (4 o 5), con guiones. */
export function codigoEnGrupos(normalizado: string): string {
  const tam = normalizado.length === 20 ? 5 : 4;
  return normalizado.match(new RegExp(`.{1,${tam}}`, 'g'))?.join('-') ?? normalizado;
}

/** Las áreas de un profesional, siempre en el orden del catálogo (la ficha y la lista no cambian el orden). */
export function enOrdenDeAreas<T extends { readonly alcance: Alcance }>(areas: readonly T[], orden: readonly Alcance[]): T[] {
  return [...areas].sort((a, b) => orden.indexOf(a.alcance) - orden.indexOf(b.alcance));
}
