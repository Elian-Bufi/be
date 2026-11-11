/**
 * «Tu semana» (WP-TABLERO-ALTA-GAMA TB-07; DL-163 D-3): las revisiones que acordó el profesional, de hoy a siete días,
 * con las vencidas aparte. Es su calendario, no lo que hace la persona:
 * - Sale de los pendientes de la cartera que ya se leyeron (API-CAR-01): las revisiones vencidas (`REVIEW_OVERDUE`) y
 *   las de los próximos siete días (`REVIEW_DUE_SOON`, de hoy a hoy + 7), cada una en el día de su fecha acordada
 *   (`since`). Ninguna lectura nueva.
 * - Sin tomas, sin horas y sin «hecho»: una revisión registrada sale de la cartera, no se tacha. Una revisión sin fecha
 *   (`REVIEW_UNDATED`) no tiene día: sigue en «Pendientes».
 * - Hasta tres fichas por día y después «y N más»; las vencidas, en su propia columna, con el mismo tope. El orden dentro
 *   de cada día es el de la cartera, que es el de la urgencia (DL-107).
 * - El día es civil, en la zona con que la API clasificó las revisiones: no pasa por la del navegador.
 */
import { diaSiguiente, type PendienteDeCartera } from '@be/domain';

/** Hasta cuántas fichas se ven por día antes de «y N más». */
export const FICHAS_POR_DIA = 3;
/** De hoy a hoy + 7: la misma ventana con que la API llama «próxima» a una revisión (VENTANA_DE_REVISION_DIAS). */
export const DIAS_DE_LA_SEMANA = 8;

export type FichaDeLaSemana = Pick<PendienteDeCartera, 'advisee' | 'domain' | 'kind' | 'since' | 'open' | 'relationshipId'>;

export interface ColumnaDeLaSemana {
  /** `vencidas`, o la fecha civil del día (`AAAA-MM-DD`). */
  readonly clave: string;
  readonly fichas: readonly FichaDeLaSemana[];
  /** Las que no entran en el tope: se dicen «y N más». */
  readonly mas: number;
}

export interface SemanaDeRevisiones {
  readonly vencidas: ColumnaDeLaSemana;
  /** Ocho días, de hoy a hoy + 7, también los que no tienen revisiones: un día vacío es un día, no un hueco. */
  readonly dias: readonly ColumnaDeLaSemana[];
  /** Cuántas revisiones hay en total (vencidas y de la semana). */
  readonly total: number;
}

const columna = (clave: string, todas: readonly FichaDeLaSemana[], tope: number): ColumnaDeLaSemana => ({ clave, fichas: todas.slice(0, tope), mas: Math.max(0, todas.length - tope) });

/**
 * Las revisiones de la semana a partir de los pendientes de la cartera. `tope` es cuántas fichas se muestran por
 * columna (`Infinity` en «Ver como lista»).
 */
export function semanaDeRevisiones(items: readonly FichaDeLaSemana[], hoy: string, tope: number = FICHAS_POR_DIA): SemanaDeRevisiones {
  const dias: string[] = [hoy];
  while (dias.length < DIAS_DE_LA_SEMANA) dias.push(diaSiguiente(dias[dias.length - 1] as string));
  const vencidas = items.filter((p) => p.kind === 'REVIEW_OVERDUE');
  const proximas = items.filter((p) => p.kind === 'REVIEW_DUE_SOON' && p.since !== null && dias.includes(p.since));
  return {
    vencidas: columna('vencidas', vencidas, tope),
    dias: dias.map((d) => columna(d, proximas.filter((p) => p.since === d), tope)),
    total: vencidas.length + proximas.length,
  };
}

/** La clave de una ficha: una revisión por persona, área y vínculo. */
export const claveDeLaFicha = (f: FichaDeLaSemana): string => `${f.kind}|${f.domain}|${f.advisee.identityId}|${f.relationshipId}`;
