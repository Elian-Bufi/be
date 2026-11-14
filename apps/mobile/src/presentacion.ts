/**
 * PG-13 de WP-PULIDO-GRANDES (DL-173, con PG-D8): la primera vez, BE se presenta y promete. Lógica pura, con su prueba
 * (`presentacion.test.ts`, TEST-PG-012); la pantalla es `pantallas/presentacion.tsx` y el almacén del teléfono,
 * `presentacion-en-el-telefono.ts`.
 *
 * - **Después de «Antes de seguir»,** tres tarjetas cortas, sin cuestionario: no pide metas, peso ni datos de salud, y
 *   no reemplaza el consentimiento ni «Antes de seguir».
 * - **Una sola vez por teléfono y por cuenta:** lo visto se recuerda en el teléfono, con la cuenta en la clave. Si el
 *   teléfono no deja leer lo guardado, no se muestra: es mejor perderse la presentación que verla cada vez.
 * - **«Saltar» en todas;** se pasan con el dedo, con «Siguiente» y «Anterior», y con TalkBack («Tarjeta 1 de 3»).
 * - **Los avisos se piden solo en la tercera**, diciendo cuáles llegan, con «Ahora no» al mismo nivel. Con «Ahora no», o
 *   saltando, no se vuelven a pedir: se activan cuando la persona quiera, en Cuenta (PG-D8). Activarlos hace lo mismo que
 *   en Cuenta, también encender los recordatorios la primera vez.
 * - **La tercera no promete lo que BE no hace:** registrar una comida pide el plan activo, así que no dice que se pueden
 *   anotar comidas sin plan (decisión del continuador, a ratificar: PG-T60 en el paquete).
 */
import type { EstadoDeAvisos } from './avisos';
import type { AlmacenDeTexto } from './descanso-automatico';

export interface TarjetaDeLaPresentacion {
  readonly titulo: string;
  readonly texto: string;
}

export const TARJETAS_DE_LA_PRESENTACION: readonly [TarjetaDeLaPresentacion, TarjetaDeLaPresentacion, TarjetaDeLaPresentacion] = [
  {
    titulo: 'Acá nadie te califica',
    texto: 'BE te muestra lo que hiciste y lo que armó tu profesional, sin calificaciones ni comparaciones con otras personas. Lo que no registraste queda en blanco, sin reproches.',
  },
  {
    titulo: 'Vos decidís quién ve qué',
    texto: 'Cada profesional ve solo lo que le autorizaste. Lo cambiás cuando quieras en Perfil, en «Quién ve qué», donde también ves quién miró lo que compartiste.',
  },
  {
    titulo: 'Tu profesional arma el plan; mientras, podés contar tus hábitos',
    texto: 'Cuando active tu plan, lo vas a ver en Inicio, y desde ahí registrás tus comidas y tus sesiones. Mientras tanto, podés contar cómo es tu semana en Perfil, en «Mis hábitos».',
  },
];

export const TEXTOS_DE_LA_PRESENTACION = {
  /** La Bienvenida, antes de entrar: lo que BE es para la persona (deja de decir «Plataforma integrada…»). */
  bienvenida: 'Tu seguimiento, con tus profesionales',
  saltar: 'Saltar',
  saltarParaLeer: 'Saltar la presentación',
  siguiente: 'Siguiente',
  anterior: 'Anterior',
  /** Lo que se ve y lo que lee TalkBack: «Tarjeta 1 de 3». */
  tarjeta: (n: number, de: number) => `Tarjeta ${n} de ${de}`,
  // La tercera: los avisos, diciendo cuáles llegan.
  avisosTitulo: '¿Te avisamos?',
  avisosQueLlegan:
    'Te llega un aviso cuando hay algo nuevo para vos: un plan activado, una revisión, una solicitud de vínculo o un pedido de tu profesional. Dice solo que hay algo para ver, sin datos de salud ni nombres.',
  avisosRecordatorios:
    'Y los recordatorios para registrar, que apagás cuando quieras en Cuenta: las comidas a las 15:00 y a las 22:00, si ese día no registraste ninguna, y el entrenamiento a las 10:00 el día que toca y a las 22:00 si no lo registraste.',
  activarAvisos: 'Activar avisos',
  activando: 'Un momento…',
  ahoraNo: 'Ahora no',
  avisosDespues: 'Si cambiás de idea, los activás en Cuenta, en «Avisos en este teléfono».',
  noSePudoActivar: 'No pudimos activar los avisos. Probá de nuevo desde Cuenta, en «Avisos en este teléfono».',
  sinConexion: 'No hay conexión: no sabemos si los avisos quedaron activos. Revisalo después en Cuenta.',
  entrar: 'Entrar a BE',
} as const;

export const CUANTAS_TARJETAS = TARJETAS_DE_LA_PRESENTACION.length;
/** La tarjeta que pide los avisos: la tercera, y ninguna otra. */
export const TARJETA_DE_LOS_AVISOS = 2;
/** Cuánto hay que mover el dedo de costado para pasar de tarjeta. */
export const UMBRAL_DEL_GESTO = 48;

// ─── Lo visto, en el teléfono ─────────────────────────────────────────────────────────────────

/** La clave de lo visto: por cuenta, en este teléfono. Sin datos de la persona, solo su identificador. */
export const claveDeLaPresentacion = (identidadId: string): string => `be:presentacion-vista:${identidadId.toLowerCase()}`;

/** Si esta cuenta ya vio la presentación en este teléfono. Si no se puede leer, cuenta como vista: no se insiste. */
export async function yaVioLaPresentacion(almacen: AlmacenDeTexto, identidadId: string): Promise<boolean> {
  try {
    return (await almacen.getItem(claveDeLaPresentacion(identidadId))) !== null;
  } catch {
    return true;
  }
}

/** Guarda que esta cuenta la vio. `false` si el teléfono no la dejó guardar (vale igual mientras la app esté abierta). */
export async function guardarLaPresentacionVista(almacen: AlmacenDeTexto, identidadId: string, ahora: Date = new Date()): Promise<boolean> {
  try {
    await almacen.setItem(claveDeLaPresentacion(identidadId), ahora.toISOString());
    return true;
  } catch {
    return false;
  }
}

/** Lo que se sabe de la presentación de una cuenta: todavía leyendo, para mostrar, o ya vista. */
export type EstadoDeLaPresentacion = 'leyendo' | 'pendiente' | 'vista';

export interface RegistroDeLaPresentacion {
  estado(identidadId: string): EstadoDeLaPresentacion;
  /** Lee lo guardado una vez por cuenta; lo que tarde más que `esperaMs` cuenta como visto. */
  leer(identidadId: string): Promise<EstadoDeLaPresentacion>;
  /** La marca como vista en este teléfono (y en la app abierta, aunque no se pueda guardar). */
  marcarVista(identidadId: string): Promise<boolean>;
  suscribir(alCambiar: () => void): () => void;
}

/**
 * El registro de lo visto, con su almacén: recuerda en memoria lo que ya leyó (Android puede recrear la pantalla sin
 * cerrar la app) y avisa a quien lo mira cuando cambia.
 */
export function crearRegistroDeLaPresentacion(almacen: AlmacenDeTexto, esperar: (ms: number) => Promise<void>, esperaMs = 1500): RegistroDeLaPresentacion {
  const estados = new Map<string, EstadoDeLaPresentacion>();
  const leyendo = new Map<string, Promise<EstadoDeLaPresentacion>>();
  const oyentes = new Set<() => void>();
  const fijar = (id: string, estado: EstadoDeLaPresentacion) => {
    if (estados.get(id) === estado) return;
    estados.set(id, estado);
    for (const o of oyentes) o();
  };
  return {
    estado: (identidadId) => estados.get(identidadId.toLowerCase()) ?? 'leyendo',
    leer(identidadId) {
      const id = identidadId.toLowerCase();
      const sabido = estados.get(id);
      if (sabido) return Promise.resolve(sabido);
      const enCurso = leyendo.get(id);
      if (enCurso) return enCurso;
      const lectura = Promise.race([yaVioLaPresentacion(almacen, id), esperar(esperaMs).then(() => true)]).then((vista) => {
        leyendo.delete(id);
        // Si mientras tanto se marcó como vista, eso manda.
        const estado: EstadoDeLaPresentacion = estados.get(id) === 'vista' || vista ? 'vista' : 'pendiente';
        fijar(id, estado);
        return estado;
      });
      leyendo.set(id, lectura);
      return lectura;
    },
    async marcarVista(identidadId) {
      const id = identidadId.toLowerCase();
      fijar(id, 'vista');
      return guardarLaPresentacionVista(almacen, id);
    },
    suscribir(alCambiar) {
      oyentes.add(alCambiar);
      return () => {
        oyentes.delete(alCambiar);
      };
    },
  };
}

// ─── Las tarjetas ─────────────────────────────────────────────────────────────────────────────

/** Los avisos en la tercera: sin pedir todavía, pidiéndolos, o con la respuesta del teléfono y de la API. */
export type AvisosDeLaPresentacion = { readonly tipo: 'sin-pedir' } | { readonly tipo: 'pidiendo' } | { readonly tipo: 'respondidos'; readonly estado: EstadoDeAvisos };

export interface PasoDeLaPresentacion {
  /** La tarjeta a la vista, de 0 a 2. */
  readonly indice: number;
  readonly avisos: AvisosDeLaPresentacion;
  /** Saltó, dijo «Ahora no» o entró: se guarda lo visto y sigue a la app. */
  readonly terminada: boolean;
}

export const PRESENTACION_AL_EMPEZAR: PasoDeLaPresentacion = { indice: 0, avisos: { tipo: 'sin-pedir' }, terminada: false };

export type AccionDeLaPresentacion =
  | { readonly tipo: 'siguiente' }
  | { readonly tipo: 'anterior' }
  /** El dedo de costado: a la izquierda, la siguiente; a la derecha, la anterior. */
  | { readonly tipo: 'gesto'; readonly dx: number; readonly dy: number }
  | { readonly tipo: 'saltar' }
  | { readonly tipo: 'ahora-no' }
  | { readonly tipo: 'pedir-avisos' }
  | { readonly tipo: 'avisos-respondidos'; readonly estado: EstadoDeAvisos }
  | { readonly tipo: 'entrar' };

/** Si se pueden pedir los avisos: solo en la tercera, una sola vez. */
export const sePuedenPedirLosAvisos = (p: PasoDeLaPresentacion): boolean => !p.terminada && p.indice === TARJETA_DE_LOS_AVISOS && p.avisos.tipo === 'sin-pedir';

/** Si un gesto pasa de tarjeta: de costado, más que el umbral y más de costado que de arriba abajo. */
export function tarjetaConElGesto(indice: number, dx: number, dy: number): number {
  if (Math.abs(dx) < UMBRAL_DEL_GESTO || Math.abs(dx) <= Math.abs(dy)) return indice;
  return Math.min(CUANTAS_TARJETAS - 1, Math.max(0, indice + (dx < 0 ? 1 : -1)));
}

export function presentacionTras(p: PasoDeLaPresentacion, a: AccionDeLaPresentacion): PasoDeLaPresentacion {
  if (p.terminada) return p;
  switch (a.tipo) {
    case 'siguiente':
      return { ...p, indice: Math.min(CUANTAS_TARJETAS - 1, p.indice + 1) };
    case 'anterior':
      return { ...p, indice: Math.max(0, p.indice - 1) };
    case 'gesto':
      // Mientras se piden los avisos, la tarjeta no se mueve: la respuesta es de la tercera.
      return p.avisos.tipo === 'pidiendo' ? p : { ...p, indice: tarjetaConElGesto(p.indice, a.dx, a.dy) };
    case 'saltar':
    case 'ahora-no':
    case 'entrar':
      return p.avisos.tipo === 'pidiendo' ? p : { ...p, terminada: true };
    case 'pedir-avisos':
      return sePuedenPedirLosAvisos(p) ? { ...p, avisos: { tipo: 'pidiendo' } } : p;
    case 'avisos-respondidos':
      return p.avisos.tipo === 'pidiendo' ? { ...p, avisos: { tipo: 'respondidos', estado: a.estado } } : p;
  }
}

/** Lo que dice la tercera después de pedir los avisos: lo que pasó, con las palabras de Cuenta. */
export function respuestaDeLosAvisos(estado: EstadoDeAvisos, textos: { readonly activos: string; readonly sinPermiso: string; readonly noDisponibles: string }): string {
  switch (estado.tipo) {
    case 'activos':
      return textos.activos;
    case 'sin-permiso':
      return textos.sinPermiso;
    case 'no-disponibles':
      return textos.noDisponibles;
    case 'apagados':
      return TEXTOS_DE_LA_PRESENTACION.noSePudoActivar;
    case 'error':
      return estado.sinConexion ? TEXTOS_DE_LA_PRESENTACION.sinConexion : TEXTOS_DE_LA_PRESENTACION.noSePudoActivar;
  }
}

// ─── Activar, como en Cuenta ──────────────────────────────────────────────────────────────────

export interface PasosParaActivar {
  /** El permiso, el token y el registro en la API (`activar` de `avisos.ts`). */
  activar(): Promise<EstadoDeAvisos>;
  /** Si las preferencias de avisos nunca se tocaron (la primera vez); `null` si no se pudieron leer. */
  primeraVez(): Promise<boolean | null>;
  /** Enciende los dos recordatorios. */
  encenderLosRecordatorios(): Promise<void>;
}

/**
 * «Activar avisos» desde la tercera tarjeta: lo mismo que en Cuenta. Activos por primera vez, los recordatorios se
 * encienden, porque se activan para eso; si eso falla, los avisos quedan activos igual y los recordatorios se encienden
 * desde Cuenta.
 */
export async function activarDesdeLaPresentacion(pasos: PasosParaActivar): Promise<EstadoDeAvisos> {
  const estado = await pasos.activar();
  if (estado.tipo !== 'activos') return estado;
  const primeraVez = await pasos.primeraVez().catch(() => null);
  if (primeraVez) await pasos.encenderLosRecordatorios().catch(() => undefined);
  return estado;
}
