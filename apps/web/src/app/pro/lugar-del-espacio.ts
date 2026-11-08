/**
 * El lugar del Espacio profesional, para volver (WP-TABLERO-ALTA-GAMA TB-07 y TB-12; DL-163 D-4; TA-46). Con el cajón
 * «De a una» apagado, cada ficha de «Tu semana» y cada verbo de «Te toca a vos» llevan a su destino exacto; al volver a
 * /pro, el Espacio queda como estaba: el filtro, el modo, el período del último registro y el foco en lo que se abrió
 * (o, si ya se resolvió y no está, en lo que seguía).
 * - **Solo identificadores, nunca nombres:** el tipo, el área y el `identityId` de lo que se abrió y de lo que seguía, el
 *   filtro (los tipos y el área), el modo y el período. Si algo no es eso, no se guarda nada.
 * - **Vive en la pestaña** (`sessionStorage`), dos horas, y se usa una vez, como el lugar del cajón (TA-38). /pro sigue
 *   sin parámetros: el destino lleva `origen=espacio`, que el marco del área usa para ofrecer «Volver al Espacio
 *   profesional, donde estabas».
 * - **Con el cajón prendido, manda el lugar del cajón:** si se salió por el cajón, al volver se abre el cajón, y este
 *   lugar se descarta.
 * Vive en el website hasta TB-20 (§8.2 del paquete), como `cajon.ts`.
 */
import { TIPOS_DE_PENDIENTE, type DominioDeCartera, type FiltroDePendientes, type TipoDePendiente } from '@be/domain';
import type { Periodo } from './advisees/periodo';
import type { ModoDeLaMesa } from './mesa';

/** De dónde se salió: una ficha de «Tu semana», un verbo de «Te toca a vos» o una salida del cajón. */
export type OrigenEnElEspacio = 'semana' | 'mesa' | 'cajon';

export interface LugarDelEspacio {
  readonly origen: OrigenEnElEspacio;
  /** La clave de lo que se abrió (`claveDelPendiente`): tipo, área e `identityId`. */
  readonly fila: string;
  /** Las claves de lo que seguía, en el orden de la vista, para seguir ahí si lo que se abrió ya no está. */
  readonly siguientes: readonly string[];
  readonly filtro: FiltroDePendientes;
  readonly modo: ModoDeLaMesa;
  readonly periodo: Periodo;
  readonly guardado: number;
}

const CLAVE_DEL_LUGAR = 'be-espacio-lugar';
/** Un lugar viejo no se retoma: dos horas, como el del cajón. */
export const VIGENCIA_DEL_LUGAR_DEL_ESPACIO_MS = 2 * 60 * 60 * 1000;
/** Cuántas de las que seguían se guardan: alcanza para seguir aunque se hayan resuelto varias. */
export const SIGUIENTES_QUE_SE_GUARDAN = 20;
const CLAVE_VALIDA = /^[A-Z_]+\|(nutrition|training|anthropometry)\|[0-9a-f-]{36}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const AREAS: readonly DominioDeCartera[] = ['nutrition', 'training', 'anthropometry'];

/** El parámetro que lleva el destino para que su marco ofrezca volver al Espacio. */
export const conOrigenEnElEspacio = (href: string): string => `${href}${href.includes('?') ? '&' : '?'}origen=espacio`;

export const COPY_LUGAR = {
  volver: 'Volver al Espacio profesional, donde estabas',
  yaNoEsta: 'Lo que abriste ya no está en la lista: quedaste en lo que seguía.',
  yaNoEstaNada: 'Lo que abriste ya no está en la lista.',
} as const;

/** Las claves que siguen a la fila, en el orden de la vista, hasta el tope. */
export function siguientesDe(claves: readonly string[], fila: string): string[] {
  const i = claves.indexOf(fila);
  return i < 0 ? [] : claves.slice(i + 1, i + 1 + SIGUIENTES_QUE_SE_GUARDAN);
}

/** El lugar, listo para guardar: si algo no es un identificador o un valor conocido, no se guarda nada. */
export function lugarDelEspacioParaGuardar(l: Omit<LugarDelEspacio, 'guardado'>, ahora: number): LugarDelEspacio | null {
  if (!['semana', 'mesa', 'cajon'].includes(l.origen) || (l.modo !== 'persona' && l.modo !== 'pendiente')) return null;
  if (!Array.isArray(l.siguientes) || ![l.fila, ...l.siguientes].every((c) => typeof c === 'string' && CLAVE_VALIDA.test(c))) return null;
  const f = l.filtro;
  if (!f || !Array.isArray(f.tipos) || !f.tipos.every((t: TipoDePendiente) => TIPOS_DE_PENDIENTE.includes(t)) || (f.area !== null && !AREAS.includes(f.area))) return null;
  const { periodStart, periodEnd } = l.periodo ?? {};
  if ((periodStart !== undefined && !FECHA.test(periodStart)) || (periodEnd !== undefined && !FECHA.test(periodEnd))) return null;
  return {
    origen: l.origen,
    fila: l.fila,
    siguientes: l.siguientes.slice(0, SIGUIENTES_QUE_SE_GUARDAN),
    filtro: { tipos: [...f.tipos], area: f.area },
    modo: l.modo,
    periodo: { ...(periodStart ? { periodStart } : {}), ...(periodEnd ? { periodEnd } : {}) },
    guardado: ahora,
  };
}

/** Lee el lugar guardado, si es válido y reciente. */
export function lugarDelEspacioLeido(texto: string | null, ahora: number): LugarDelEspacio | null {
  if (!texto) return null;
  try {
    const l = JSON.parse(texto) as Partial<LugarDelEspacio>;
    if (typeof l.guardado !== 'number' || ahora - l.guardado > VIGENCIA_DEL_LUGAR_DEL_ESPACIO_MS || ahora < l.guardado) return null;
    return lugarDelEspacioParaGuardar(l as LugarDelEspacio, l.guardado);
  } catch {
    return null;
  }
}

/**
 * A qué se vuelve: lo que se abrió, si todavía está; si no, lo primero de lo que seguía que todavía está; si no, nada
 * (el foco va al título de «Te toca a vos»).
 */
export function dondeVolver(lugar: Pick<LugarDelEspacio, 'fila' | 'siguientes'>, esta: (clave: string) => boolean): { readonly clave: string; readonly laMisma: boolean } | null {
  if (esta(lugar.fila)) return { clave: lugar.fila, laMisma: true };
  const otra = lugar.siguientes.find(esta);
  return otra ? { clave: otra, laMisma: false } : null;
}

export function guardarLugarDelEspacio(lugar: LugarDelEspacio | null): void {
  try {
    if (lugar) window.sessionStorage.setItem(CLAVE_DEL_LUGAR, JSON.stringify(lugar));
    else window.sessionStorage.removeItem(CLAVE_DEL_LUGAR);
  } catch {
    // Sin almacenamiento, al volver el Espacio empieza como siempre.
  }
}

export function leerLugarDelEspacio(ahora: number): LugarDelEspacio | null {
  try {
    return lugarDelEspacioLeido(window.sessionStorage.getItem(CLAVE_DEL_LUGAR), ahora);
  } catch {
    return null;
  }
}
