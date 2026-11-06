/**
 * El cajón «De a una» (WP-TABLERO-ALTA-GAMA TB-12; DL-163 D-4), sin React: la cola, la pregunta de cada cuadro, sus
 * salidas y el lugar que se guarda para volver.
 * - **La cola** es la vista elegida en «Te toca a vos», en su orden: por persona (las personas por su pendiente más
 *   urgente) o por pendiente (DL-107), con los filtros puestos.
 * - **El cajón lee y no escribe, salvo aplicar:** saltear no escribe, y ninguna salida registra ni activa. Cada salida
 *   lleva a la pantalla que lo resuelve, como el verbo de la fila. La única escritura es aplicar una revisión ya
 *   registrada (TB-15; DL-163 D-6), con la misma operación que Revisiones, en su propia pieza (`aplicar-en-el-cajon.tsx`).
 * - **El lugar** guarda identificadores (el tipo, el área y el `identityId` de cada pendiente), nunca nombres, y vive en la
 *   pestaña (`sessionStorage`): al volver a /pro, el cajón sigue con el siguiente que todavía esté en la cola.
 * - **Detrás de una constante** hasta que su recaptura esté verde: `BE_CAJON_DE_A_UNA=si` al compilar (`next.config.mjs`). Apagado,
 *   «Empezar por el primero» no se muestra y el botón lleno es «Invitar a una persona».
 * Los textos viven acá hasta TB-20 (§8.2 del paquete) y pasan la prueba de términos de la cartera.
 */
import { COPY_CARTERA, type DashboardResponse, type PendienteDeCartera, type TipoDePendiente } from '@be/domain';

/** El interruptor del cajón (TB-12): apagado salvo que la compilación lo prenda. */
export const CAJON_DE_A_UNA: boolean = process.env.BE_CAJON_DE_A_UNA === 'si';

type Fila = Pick<PendienteDeCartera, 'kind' | 'domain' | 'advisee' | 'open'>;

const DEL_AREA: Readonly<Record<PendienteDeCartera['domain'], string>> = { nutrition: 'de Nutrición', training: 'de Entrenamiento', anthropometry: 'de Antropometría' };

export const COPY_CAJON = {
  titulo: 'De a una',
  empezar: 'Empezar por el primero',
  posicion: (n: number, de: number): string => `Pendiente ${n} de ${de}`,
  saltear: 'Saltear por ahora',
  abrirLaFicha: 'Abrir la ficha',
  anterior: 'Anterior',
  siguiente: 'Siguiente',
  cerrar: 'Cerrar',
  atajos: 'Con el foco acá: J, el siguiente · K, el anterior · S, saltear · Escape, cerrar.',
  fin: 'Llegaste al final de esta vista.',
  salteados: 'Los que salteaste, para volver cuando quieras:',
  volverAlPrimero: 'Volver al primero',
  leyendo: 'Leyendo lo de este pendiente…',
  sinLeer: 'No pudimos leer el resumen de este pendiente. Las salidas siguen funcionando.',
  // TB-15: aplicar desde el cajón una revisión ya registrada.
  preguntaDeAplicar: (dia: string): string => `La revisión del ${dia} está registrada y sin aplicar. ¿La aplicás?`,
  leyendoLaRevision: 'Leyendo la revisión…',
  sinLeerLaRevision: 'No pudimos leer la revisión, y sin leerla no se aplica desde acá.',
  verLaRevision: 'Ver la revisión en Revisiones',
  alAplicar: 'Al aplicar:',
  aplicada: (p: Pick<PendienteDeCartera, 'domain'>): string => `Se aplicó la revisión ${DEL_AREA[p.domain]}.`,
  seguirElBorrador: 'Seguir el borrador',
  aplicadas: 'Lo que aplicaste:',
  aplicadaEnElCierre: 'se aplicó la revisión',
  pregunta: (p: Pick<PendienteDeCartera, 'kind' | 'domain'>): string => {
    const area = DEL_AREA[p.domain];
    switch (p.kind) {
      case 'REVIEW_OVERDUE':
      case 'REVIEW_DUE_SOON':
      case 'REVIEW_UNDATED':
        return `¿Preparás la revisión ${area}?`;
      case 'PLAN_DRAFT_PENDING':
        return `¿Seguís el borrador ${area}?`;
      case 'NO_ACTIVE_PLAN':
        return `¿Empezás el plan ${area}?`;
      case 'ANTHRO_DRAFT_PENDING':
        return '¿Seguís la toma en preparación?';
      case 'FORM_REQUEST_OPEN':
        return '¿Mirás la solicitud?';
    }
  },
} as const;

const REVISIONES: readonly TipoDePendiente[] = ['REVIEW_OVERDUE', 'REVIEW_DUE_SOON', 'REVIEW_UNDATED'];

/**
 * TB-15: la revisión registrada y sin aplicar del área del cuadro, si el pendiente es una revisión: entonces el cuadro
 * pregunta si la aplicás. Sale de lo que se lee al abrir (API-DSH-03), no del tipo de la fila: la cartera no conoce ese
 * estado y la muestra como vencida o próxima (§8.4 de la propuesta). Antropometría no tiene revisiones.
 */
export function revisionPorAplicar(p: Pick<PendienteDeCartera, 'kind' | 'domain'>, dominios: DashboardResponse['data']['domains']): { readonly reviewId: string; readonly recordedAt: string } | null {
  if (!REVISIONES.includes(p.kind) || p.domain === 'anthropometry') return null;
  const d = dominios[p.domain];
  const ultima = d.available ? (d.summary?.lastReview ?? null) : null;
  return ultima && ultima.application === null ? { reviewId: ultima.reviewId, recordedAt: ultima.recordedAt } : null;
}

/**
 * La salida principal de un cuadro (`ruta`, la que resuelve el pendiente, como la de la fila): en una revisión, «Preparar la revisión», que abre la revisión nueva ya preparada
 * (TB-09); en lo demás, el verbo de la fila, a la misma pantalla. Nada clínico viene elegido.
 */
export function salidaPrincipal(p: Fila, ruta: string): { readonly texto: string; readonly href: string } {
  if (REVISIONES.includes(p.kind) && p.open.view === 'revisiones') return { texto: 'Preparar la revisión', href: `${ruta}&preparar=1` };
  return { texto: COPY_CARTERA.accion[p.kind], href: ruta };
}

/** «Abrir la ficha»: el Resumen de la persona. */
export const fichaDe = (p: Pick<PendienteDeCartera, 'advisee'>): string => `/pro/advisees?id=${encodeURIComponent(p.advisee.identityId)}`;

// ─── El lugar, para volver ───────────────────────────────────────────────────────────────────

/** Lo que se guarda al salir del cajón por una de sus salidas: solo identificadores. */
export interface LugarEnLaCola {
  readonly cola: readonly string[];
  readonly indice: number;
  readonly salteados: readonly string[];
  readonly guardado: number;
}

const CLAVE_DEL_LUGAR = 'be-cajon-lugar';
/** Un lugar viejo no se retoma: dos horas. */
export const VIGENCIA_DEL_LUGAR_MS = 2 * 60 * 60 * 1000;
const CLAVE_VALIDA = /^[A-Z_]+\|(nutrition|training|anthropometry)\|[0-9a-f-]{36}$/;

/** El lugar, listo para guardar: si algo no es un identificador, no se guarda nada. */
export function lugarParaGuardar(cola: readonly string[], indice: number, salteados: readonly string[], ahora: number): LugarEnLaCola | null {
  if (![...cola, ...salteados].every((c) => CLAVE_VALIDA.test(c)) || indice < 0 || indice >= cola.length) return null;
  return { cola: [...cola], indice, salteados: [...salteados], guardado: ahora };
}

/** Lee el lugar guardado, si es válido y reciente. */
export function lugarLeido(texto: string | null, ahora: number): LugarEnLaCola | null {
  if (!texto) return null;
  try {
    const l = JSON.parse(texto) as Partial<LugarEnLaCola>;
    if (!Array.isArray(l.cola) || !Array.isArray(l.salteados) || typeof l.indice !== 'number' || typeof l.guardado !== 'number') return null;
    if (ahora - l.guardado > VIGENCIA_DEL_LUGAR_MS || ahora < l.guardado) return null;
    return lugarParaGuardar(l.cola, l.indice, l.salteados, l.guardado);
  } catch {
    return null;
  }
}

/**
 * Dónde sigue la cola nueva: el primer pendiente después del que se abrió que todavía esté (los resueltos ya no están).
 * `null`: no queda ninguno después, y el cajón muestra el cierre.
 */
export function dondeSigue(lugar: LugarEnLaCola, colaNueva: readonly string[]): number | null {
  for (const clave of lugar.cola.slice(lugar.indice + 1)) {
    const i = colaNueva.indexOf(clave);
    if (i >= 0) return i;
  }
  return null;
}

export function guardarLugar(lugar: LugarEnLaCola | null): void {
  try {
    if (lugar) window.sessionStorage.setItem(CLAVE_DEL_LUGAR, JSON.stringify(lugar));
    else window.sessionStorage.removeItem(CLAVE_DEL_LUGAR);
  } catch {
    // Sin almacenamiento, al volver se empieza de nuevo.
  }
}

export function leerLugar(ahora: number): LugarEnLaCola | null {
  try {
    return lugarLeido(window.sessionStorage.getItem(CLAVE_DEL_LUGAR), ahora);
  } catch {
    return null;
  }
}
