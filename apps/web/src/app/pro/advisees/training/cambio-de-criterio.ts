/**
 * C7 de Dirección (WP-ENTRENAMIENTO-PLANIFICACION, tramo 2) · cambiar el criterio de intensidad de un ejercicio (RIR, % RM o
 * ninguno) avisa qué pasa con los valores y se puede deshacer. Sin React.
 *
 * Cambiar de criterio no trae un objetivo (el número lo escribe el profesional, 09v10:339-340), y sin el criterio RIR el
 * RIR de cada serie no tiene sentido (REG-06-128): el editor los quita. Antes lo hacía en silencio: el objetivo «RIR 2» y
 * el RIR propio de cada serie desaparecían. Ahora se dice qué se quitó, en una línea con «Deshacer». Si no había nada que
 * perder, no se dice nada (no se suma una confirmación).
 */
import { cantidadDeSeries, ETIQUETA_DE_CRITERIO, numero } from '@be/domain';

type Criterio = 'PERCENT_RM' | 'RIR';

/** Lo mínimo de una prescripción para saber qué se pierde. */
interface ConCriterio {
  readonly intensity: { readonly criterion: string; readonly target: { readonly value: number; readonly reference?: { readonly description: string } | null } } | null;
  readonly sets: readonly { readonly rir?: number | null }[];
}

const valido = (n: unknown): n is number => typeof n === 'number' && !Number.isNaN(n);

/** «el objetivo RIR 2», «el objetivo 75 % RM». */
function objetivo(criterio: string, valor: number): string {
  return criterio === 'RIR' ? `el objetivo RIR ${numero(valor)}` : `el objetivo ${numero(valor)} % RM`;
}

/**
 * Lo que se quita al pasar de su criterio a `nuevo` (`''`: ninguno), en una frase, o `null` si no se pierde nada. `nuevo`
 * igual al de ahora no cambia nada.
 */
export function loQueSeQuitaAlCambiarElCriterio(p: ConCriterio, nuevo: Criterio | ''): string | null {
  const antes = p.intensity?.criterion ?? '';
  if (antes === nuevo) return null;
  const partes: string[] = [];
  if (p.intensity && valido(p.intensity.target.value)) partes.push(objetivo(antes, p.intensity.target.value));
  if (antes === 'PERCENT_RM' && p.intensity?.target.reference?.description?.trim()) partes.push('la referencia del % RM');
  const conRir = nuevo === 'RIR' ? 0 : p.sets.filter((s) => 'rir' in s && s.rir !== undefined).length;
  if (conRir > 0) partes.push(`el RIR propio de ${cantidadDeSeries(conRir)}`);
  if (partes.length === 0) return null;
  const que = partes.length === 1 ? partes[0]! : `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)!}`;
  const destino = nuevo ? `Al pasar a ${ETIQUETA_DE_CRITERIO[nuevo]}` : 'Al dejarlo sin criterio';
  const falta = nuevo ? ` Falta escribir el objetivo de ${ETIQUETA_DE_CRITERIO[nuevo]}.` : '';
  return `${destino} se ${partes.length === 1 ? 'quitó' : 'quitaron'} ${que}.${falta}`;
}

/** Cómo queda la prescripción con el criterio nuevo: sin objetivo escrito y, sin RIR, sin el RIR de cada serie. */
export function conElCriterio<P extends ConCriterio>(p: P, nuevo: Criterio | ''): Pick<P, 'intensity'> & Partial<Pick<P, 'sets'>> {
  const intensity = (nuevo ? { criterion: nuevo, target: { value: Number.NaN, reference: null } } : null) as P['intensity'];
  if (nuevo === 'RIR') return { intensity };
  return { intensity, sets: p.sets.map(({ rir: _sinRir, ...x }) => x) as unknown as P['sets'] };
}

/** Lo que hace falta para deshacer un cambio de criterio: el de antes, con su objetivo, y el RIR de cada serie. */
export interface CambioDeCriterio<I> {
  readonly texto: string;
  /** El criterio elegido: «Deshacer» se ofrece mientras siga ese (un guardado en el medio no lo retira). */
  readonly nuevo: Criterio | '';
  readonly intensidadDeAntes: I;
  /** El RIR de cada serie, por posición: `undefined`, sin la clave (toma de lo general); `null`, «Sin indicar». */
  readonly rirDeAntes: readonly (number | null | undefined)[];
}

/** El cambio, si se pierde algo; `null` si no (no hay nada que deshacer ni que decir). */
export function cambioDeCriterio<P extends ConCriterio>(p: P, nuevo: Criterio | ''): CambioDeCriterio<P['intensity']> | null {
  const texto = loQueSeQuitaAlCambiarElCriterio(p, nuevo);
  return texto ? { texto, nuevo, intensidadDeAntes: p.intensity, rirDeAntes: p.sets.map((s) => ('rir' in s ? s.rir : undefined)) } : null;
}

/** Si «Deshacer» sigue a la vista: mientras el criterio sea el que se eligió. */
export const sigueElCambio = (p: ConCriterio, c: CambioDeCriterio<unknown> | null): boolean => !!c && (p.intensity?.criterion ?? '') === c.nuevo;

/**
 * «Deshacer»: el criterio de antes, con su objetivo; con RIR, el RIR de cada serie vuelve a su lugar (las series que se
 * sumaron después quedan como están); con otro criterio, ninguna serie lleva RIR (sería un segundo criterio, REG-06-128).
 */
export function deshacerElCambioDeCriterio<P extends ConCriterio>(p: P, c: CambioDeCriterio<P['intensity']>): Pick<P, 'intensity' | 'sets'> {
  const conRir = c.intensidadDeAntes?.criterion === 'RIR';
  const sets = p.sets.map((s, n) => {
    const { rir: _actual, ...resto } = s;
    if (!conRir) return resto;
    const r = c.rirDeAntes[n];
    return r === undefined ? resto : { ...resto, rir: r };
  }) as unknown as P['sets'];
  return { intensity: c.intensidadDeAntes, sets };
}

export const COPY_CAMBIO_DE_CRITERIO = {
  deshacer: 'Deshacer',
  deshecho: 'Volvió el criterio de antes, con sus valores.',
} as const;
