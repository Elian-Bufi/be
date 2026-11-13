/**
 * RF-004 (04; DEUDA_LEGAJO DL-172; 05 UC-E06; 06 REG-06-21 y 22; 09 v0.12 §12) · Los métodos de acceso de una misma
 * identidad: la contraseña y Google.
 *
 * «Agregar o retirar un método no altera vínculos ni historial; no se permite dejar la cuenta sin un método utilizable; los
 * cambios sensibles quedan trazables.» Lo que se puede hacer desde la cuenta propia (familia MET, API-MET-01 a 03):
 * - **Ver** con qué se entra: la contraseña (con el correo de acceso) y Google (con el correo de esa cuenta de Google).
 * - **Vincular Google** a una cuenta con contraseña, sin salir: la API verifica el ID token de Google como al entrar, y la
 *   persona confirma su contraseña de BE (es la re-autenticación). Si la cuenta de Google tiene otro correo, se vincula
 *   solo con una confirmación explícita. Una cuenta de Google que es de otra identidad no se vincula nunca.
 * - **Desvincular Google**, solo si queda la contraseña y con una entrada reciente (los 10 minutos de DL-017). La
 *   contraseña no se retira: es el método que se recupera (RF-005) y el que queda cuando Google no está.
 * - **El segundo factor del profesional** se respeta: una sesión con perfil profesional cambia sus métodos solo con el
 *   segundo factor verificado en esa sesión (08 §25).
 * El método de acceso es de solo agregar (WP-02): retirarlo es un hecho nuevo, y volver a vincular la misma cuenta de
 * Google, otro. Nada de esto cambia la identidad, sus vínculos ni su historia.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { IdTokenDeGoogleSchema } from './contratos-acceso-google';

export const TIPOS_DE_METODO_DE_ACCESO = ['PASSWORD', 'GOOGLE'] as const;
export type TipoDeMetodoDeAccesoApi = (typeof TIPOS_DE_METODO_DE_ACCESO)[number];

/** Un método vale si no tiene cambios o si tiene una cantidad par: los impares son retiros y los pares, reasociaciones. */
export const metodoVigente = (cantidadDeCambios: number): boolean => cantidadDeCambios % 2 === 0;

/** Lo que se sabe de un método de la cuenta para decidir: su tipo, si vale y, en la contraseña, si tiene credencial. */
export interface MetodoDeLaCuenta {
  readonly id: string;
  readonly tipo: 'LOCAL' | 'GOOGLE';
  /** El `sub` de la cuenta de Google; en la contraseña, el correo de acceso. */
  readonly referencia: string;
  readonly vigente: boolean;
  /** Solo la contraseña: si tiene su credencial (una credencial suprimida no sirve para entrar). */
  readonly conCredencial: boolean;
}

/**
 * La cuenta de Google que se puede volver a vincular (D-5): la de la cuenta, si se desvinculó (una identidad tiene a lo
 * sumo una, por el índice único). Con su correo, la pantalla dice de antemano cuál acepta, en lugar de dejar elegir otra
 * que termina en un 409.
 */
export function googleParaVolverAVincular<M extends MetodoDeLaCuenta>(metodos: readonly M[]): M | null {
  const google = metodos.find((m) => m.tipo === 'GOOGLE');
  return google && !google.vigente ? google : null;
}

/** Los métodos con que hoy se puede entrar. */
export const metodosUtilizables = (metodos: readonly MetodoDeLaCuenta[]): MetodoDeLaCuenta[] =>
  metodos.filter((m) => m.vigente && (m.tipo === 'GOOGLE' || m.conCredencial));

/**
 * Si se puede retirar ese método (API-MET-03): la contraseña no se retira, y Google solo si queda otro método utilizable.
 * `NO_ESTA` es lo ajeno, lo inexistente o lo ya retirado: el mismo 404.
 */
export type DecisionDeRetiro = 'RETIRAR' | 'NO_ESTA' | 'LA_CONTRASENA_NO_SE_RETIRA' | 'ULTIMO_METODO';
export function decidirRetiro(metodos: readonly MetodoDeLaCuenta[], metodoId: string): DecisionDeRetiro {
  const metodo = metodos.find((m) => m.id === metodoId && m.vigente);
  if (!metodo) return 'NO_ESTA';
  if (metodo.tipo === 'LOCAL') return 'LA_CONTRASENA_NO_SE_RETIRA';
  return metodosUtilizables(metodos).some((m) => m.id !== metodo.id) ? 'RETIRAR' : 'ULTIMO_METODO';
}

/**
 * Qué pasa al vincular una cuenta de Google desde la cuenta propia (API-MET-02), con lo que hay en la base:
 * - `ASOCIAR`: un método nuevo; `REASOCIAR`: la misma cuenta de Google que se había desvinculado; `YA_ESTA`: ya está
 *   vinculada (un reintento), no cambia nada.
 * - `SIN_CONTRASENA`: la cuenta no tiene una contraseña con que confirmar (solo pasa si se suprimió).
 * - `DE_OTRA_IDENTIDAD`: esa cuenta de Google es de otra cuenta BE. `YA_TIENE_OTRA`: esta cuenta ya tiene otra cuenta de
 *   Google vinculada. `OTRA_ANTERIOR`: tuvo otra, que se desvinculó (DL-172 D-5).
 * - `CORREO_DISTINTO`: la cuenta de Google tiene otro correo y la persona todavía no lo confirmó.
 */
export type DecisionDeVinculo = 'ASOCIAR' | 'REASOCIAR' | 'YA_ESTA' | 'SIN_CONTRASENA' | 'DE_OTRA_IDENTIDAD' | 'YA_TIENE_OTRA' | 'OTRA_ANTERIOR' | 'CORREO_DISTINTO';
export function decidirVinculoDeGoogle(p: {
  readonly metodos: readonly MetodoDeLaCuenta[];
  readonly sub: string;
  readonly correoDeGoogle: string;
  /** Si ese `sub` es de un método de otra identidad (vigente o no). */
  readonly subDeOtraIdentidad: boolean;
  readonly confirmaCorreoDistinto: boolean;
}): DecisionDeVinculo {
  if (p.subDeOtraIdentidad) return 'DE_OTRA_IDENTIDAD';
  const google = p.metodos.find((m) => m.tipo === 'GOOGLE');
  if (google && google.referencia === p.sub && google.vigente) return 'YA_ESTA';
  if (google && google.vigente) return 'YA_TIENE_OTRA';
  if (google && google.referencia !== p.sub) return 'OTRA_ANTERIOR';
  const contrasena = p.metodos.find((m) => m.tipo === 'LOCAL' && m.vigente && m.conCredencial);
  if (!contrasena) return 'SIN_CONTRASENA';
  if (contrasena.referencia !== p.correoDeGoogle && !p.confirmaCorreoDistinto) return 'CORREO_DISTINTO';
  return google ? 'REASOCIAR' : 'ASOCIAR';
}

// ─── API-MET-01 a 03 · El contrato ───────────────────────────────────────────────────────────────

export const MetodoDeAccesoSchema = z.strictObject({
  methodId: IdOpaco,
  type: z.enum(TIPOS_DE_METODO_DE_ACCESO),
  /** La contraseña: el correo de acceso. Google: el correo de esa cuenta de Google cuando se vinculó. */
  email: z.string().nullable(),
  linkedAt: Instante,
  /** Si se puede desvincular desde la cuenta (API-MET-03). */
  removable: z.boolean(),
});
export type MetodoDeAccesoApi = z.infer<typeof MetodoDeAccesoSchema>;

export const MetodosDeAccesoResponseSchema = z.strictObject({
  data: z.strictObject({
    /** Los métodos con que hoy se entra (sin los retirados), la contraseña primero. */
    methods: z.array(MetodoDeAccesoSchema),
    /** Si la cuenta puede vincular una cuenta de Google desde acá (tiene contraseña y no tiene Google vinculado). */
    canLinkGoogle: z.boolean(),
    /**
     * Aditivo (revisión de DL-172): el correo de la cuenta de Google que se desvinculó, la única que se puede volver a
     * vincular (D-5); `null` si nunca tuvo una o si la tiene vinculada. La pantalla lo dice junto al botón de Google.
     */
    relinkableGoogleEmail: z.string().nullable(),
  }),
});
export type MetodosDeAccesoResponse = z.infer<typeof MetodosDeAccesoResponseSchema>;

export const VincularMetodoDeAccesoRequestSchema = z.strictObject({
  type: z.literal('GOOGLE'),
  idToken: IdTokenDeGoogleSchema,
  /** La contraseña de BE de esta cuenta: la re-autenticación. Se verifica con las reglas y los cupos del login. */
  credential: z.string().min(1).max(1024),
  /** La persona confirmó que vincula una cuenta de Google con otro correo (después de un 409 GOOGLE_EMAIL_MISMATCH). */
  confirmDifferentEmail: z.boolean().optional(),
});
export type VincularMetodoDeAccesoRequest = z.infer<typeof VincularMetodoDeAccesoRequestSchema>;

/** `error.details` de GOOGLE_EMAIL_MISMATCH: el correo de la cuenta de Google, para que la pantalla pida confirmarlo. */
export const DetalleDeCorreoDistintoSchema = z.strictObject({ email: z.string().min(1) });

// ─── Los textos (website) ─────────────────────────────────────────────────────────────────────────

export const COPY_METODOS_DE_ACCESO = {
  titulo: 'Cómo entrás',
  queEs: 'Tu cuenta es una sola, entres con tu contraseña o con Google: tus datos, tus vínculos y tu historia no cambian.',
  tipos: { PASSWORD: 'Correo y contraseña', GOOGLE: 'Google' } as Readonly<Record<TipoDeMetodoDeAccesoApi, string>>,
  vinculadoEl: (fecha: string): string => `Desde el ${fecha}`,
  cargando: 'Buscando cómo entrás…',
  sinLeer: 'No pudimos traer cómo entrás.',
  /** Vincular Google. */
  vincularTitulo: 'Vincular tu cuenta de Google',
  vincularTexto: 'Elegí la cuenta de Google y confirmá tu contraseña de BE. Después vas a poder entrar con cualquiera de las dos.',
  contrasena: 'Contraseña de BE',
  contrasenaRequerida: 'Ingresá tu contraseña de BE.',
  contrasenaIncorrecta: 'La contraseña no es correcta.',
  vincular: 'Vincular',
  vinculando: 'Vinculando…',
  vinculada: 'Listo: ya podés entrar con Google.',
  correoDistintoTitulo: 'Esa cuenta de Google tiene otro correo',
  correoDistintoTexto: (correoDeGoogle: string, correoDeAcceso: string): string =>
    `La cuenta de Google es de ${correoDeGoogle} y tu cuenta BE es de ${correoDeAcceso}. Si es tuya, podés vincularla igual: vas a entrar a la misma cuenta BE con las dos. ${correoDeGoogle} queda asociado a tu cuenta BE aunque después desvincules Google: no se va a poder usar para crear otra cuenta.`,
  vincularIgual: 'Sí, es mía: vincularla',
  elegirOtra: 'Elegir otra cuenta de Google',
  deOtraCuenta: 'Esa cuenta de Google ya está vinculada con otra cuenta BE.',
  yaTieneOtra: 'Tu cuenta ya tiene una cuenta de Google vinculada.',
  otraAnterior: 'Tu cuenta tuvo otra cuenta de Google. Por ahora podés volver a vincular esa; para usar otra, escribinos al canal de ayuda.',
  /** Junto al botón de Google, cuando la cuenta tuvo una cuenta de Google y la desvinculó (D-5). */
  volverAVincular: (correoDeGoogle: string): string => `Podés volver a vincular ${correoDeGoogle}. Para usar otra cuenta de Google, escribinos al canal de ayuda.`,
  sinGoogle: 'Ahora no podemos usar Google. Probá más tarde.',
  tokenInvalido: 'No pudimos verificar tu cuenta de Google. Probá de nuevo.',
  correoNoVerificado: 'Google todavía no verificó el correo de esa cuenta.',
  /** Desvincular Google. */
  desvincular: 'Desvincular Google',
  desvinculando: 'Desvinculando…',
  desvincularConfirmar: 'Vas a dejar de entrar con Google. Seguís entrando con tu correo y tu contraseña, y tu cuenta no cambia.',
  desvincularSi: 'Sí, desvincular',
  /**
   * Cerrar las sesiones no alcanza si no fue la persona quien la vinculó: vincular pide la contraseña, así que quien lo
   * hizo la sabe y podría volver a vincularla. Cambiar la contraseña corta ese ciclo y, además, cierra todas las sesiones
   * (API-ACC-P1-02). Revisión de DL-172, D-8.
   */
  desvinculada: 'Listo: Google ya no entra a tu cuenta. Si no fuiste vos quien la vinculó, cambiá tu contraseña: así nadie más puede volver a vincularla, y se cierran todas las sesiones.',
  cambiarContrasena: 'Cambiar mi contraseña',
  ultimoMetodo: 'No podés quedarte sin una forma de entrar: para desvincular Google, tu cuenta necesita una contraseña.',
  soloConGoogle: 'Entrás solo con Google: no se puede desvincular, porque te quedarías sin una forma de entrar.',
  reautenticar: 'Por seguridad, volvé a entrar para cambiar cómo entrás.',
  segundoFactor: 'Para cambiar cómo entrás, confirmá primero el código de tu autenticador.',
} as const;

// ─── El aviso por correo de cada cambio (D-11) ───────────────────────────────────────────────────

/** Lo que cambió en cómo se entra: se vinculó (o se volvió a vincular) una cuenta de Google, o se desvinculó. */
export type CambioDeMetodoAvisado = 'VINCULADA' | 'DESVINCULADA';

/** El momento del cambio como lo lee la persona: «13/11/2026 a las 14:05 (hora de Argentina)». */
export function momentoDelAviso(instante: Date): string {
  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instante);
  const de = (tipo: Intl.DateTimeFormatPartTypes): string => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${de('day')}/${de('month')}/${de('year')} a las ${de('hour')}:${de('minute')} (hora de Argentina)`;
}

/**
 * D-11 (revisión de DL-172): cada vez que cambia cómo se entra, BE le escribe al correo de acceso, como hacen las mejores
 * apps con «Se agregó un método de inicio de sesión». Una sesión robada junto con la contraseña no agrega una puerta de
 * entrada en silencio. Si no fue la persona, el consejo es cambiar la contraseña: cierra todas las sesiones, y quien la
 * sabía ya no puede volver a vincular nada.
 */
export const COPY_AVISO_DE_METODO_DE_ACCESO = {
  asunto: {
    VINCULADA: 'Se vinculó una cuenta de Google a tu cuenta de BE',
    DESVINCULADA: 'Se desvinculó una cuenta de Google de tu cuenta de BE',
  } as Readonly<Record<CambioDeMetodoAvisado, string>>,
  texto: (cambio: CambioDeMetodoAvisado, correoDeGoogle: string, cuando: string): string =>
    [
      'Hola.',
      '',
      cambio === 'VINCULADA'
        ? `El ${cuando} se vinculó la cuenta de Google ${correoDeGoogle} a tu cuenta de BE: desde ahora también se puede entrar con ella.`
        : `El ${cuando} se desvinculó la cuenta de Google ${correoDeGoogle} de tu cuenta de BE: ya no se puede entrar con ella. Seguís entrando con tu correo y tu contraseña.`,
      '',
      'Si fuiste vos, no tenés que hacer nada.',
      '',
      cambio === 'VINCULADA'
        ? 'Si no fuiste vos, cambiá tu contraseña ya: en Iniciar sesión, tocá «¿Olvidaste tu contraseña?». Al cambiarla se cierran todas las sesiones abiertas. Después entrá y, en tu cuenta, en «Cómo entrás», desvinculá la cuenta de Google que no reconozcas.'
        : 'Si no fuiste vos, cambiá tu contraseña ya: en Iniciar sesión, tocá «¿Olvidaste tu contraseña?». Al cambiarla se cierran todas las sesiones abiertas.',
      '',
      'BE · Better Everyday',
    ].join('\n'),
} as const;
