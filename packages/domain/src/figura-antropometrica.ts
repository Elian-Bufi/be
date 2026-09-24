/**
 * La figura de la toma antropométrica (docs/paquetes/WP-IDENTIDAD-VISUAL.md, tramo D; DL-073, opción A).
 *
 * B10-07 §18 la admite y le pone la regla: «asset visual ≠ definición del punto/medición». Qué se mide lo declara el
 * **protocolo** (su contenido, API-ANT-01); acá vive solo **dónde se dibuja** cada métrica conocida. Una métrica del
 * protocolo sin sitio en la figura se carga igual, en la lista; un sitio de la figura sin métrica en el protocolo no se
 * dibuja.
 *
 * Y la condición que heredó de DL-073: la figura **ubica, nunca califica** (RF-048; INV-06-06). Por construcción, un
 * punto no recibe el valor de la medición: solo sabe si hay dato. No hay forma de pintarlo por rango.
 */
import { z } from 'zod';

// ─── El contenido del protocolo ─────────────────────────────────────────────────────────────────

export const FamiliaDeMedicionSchema = z.enum(['MASA_Y_ESTATURA', 'PLIEGUES', 'PERIMETROS', 'DIAMETROS', 'OTRAS']);
export type FamiliaDeMedicion = z.infer<typeof FamiliaDeMedicionSchema>;

/** B10-07 §15: la UI agrupa por las familias de medición que define el protocolo. */
export const ETIQUETA_DE_FAMILIA: Readonly<Record<FamiliaDeMedicion, string>> = {
  MASA_Y_ESTATURA: 'Masa y estatura',
  PLIEGUES: 'Pliegues cutáneos',
  PERIMETROS: 'Perímetros',
  DIAMETROS: 'Diámetros',
  OTRAS: 'Otras mediciones del protocolo',
};

const MetricaDelProtocoloSchema = z.object({
  clave: z.string().min(1).max(60),
  nombre: z.string().min(1).max(120).optional(),
  familia: FamiliaDeMedicionSchema.optional(),
  unidades: z.array(z.string().min(1).max(24)).min(1),
});

/** Lo que la figura y la lista necesitan del contenido de un protocolo (REG-06-154: métricas y unidades admitidas). */
const ContenidoDeProtocoloSchema = z.object({ metricas: z.array(MetricaDelProtocoloSchema) });

export interface MetricaDelProtocolo {
  readonly clave: string;
  /** El nombre para una persona; si el protocolo no lo declara, la clave. */
  readonly nombre: string;
  readonly familia: FamiliaDeMedicion;
  /** La primera es la que se propone; la unidad de origen nunca se convierte (B10-07 §17). */
  readonly unidades: readonly string[];
}

/**
 * Las métricas que declara el contenido de un protocolo. El contenido llega como `unknown` (API-ANT-01): si no tiene la
 * forma esperada, no hay métricas declaradas —la pantalla sigue permitiendo la carga libre—, nunca una suposición.
 */
export function metricasDelProtocolo(contenido: unknown): MetricaDelProtocolo[] {
  const r = ContenidoDeProtocoloSchema.safeParse(contenido);
  if (!r.success) return [];
  const vistas = new Set<string>();
  const metricas: MetricaDelProtocolo[] = [];
  for (const m of r.data.metricas) {
    if (vistas.has(m.clave)) continue;
    vistas.add(m.clave);
    metricas.push({ clave: m.clave, nombre: m.nombre ?? m.clave, familia: m.familia ?? 'OTRAS', unidades: m.unidades });
  }
  return metricas;
}

/** Una medición escrita en la toma, antes de guardarse: el valor, tal como lo escribió la persona. */
export interface MedicionEscrita {
  readonly metrica: string;
  readonly valor: string;
  readonly unidad: string;
}

/**
 * Reparte las mediciones escritas entre los campos del protocolo y las de fuera del protocolo: al abrir un borrador y
 * al cambiar de protocolo. Una medición va a su campo si el protocolo la declara **en esa unidad** —el campo muestra la
 * unidad del protocolo, y otra quedaría escondida detrás de la que se ve—, si tiene valor y si el campo sigue libre: la
 * primera lo ocupa. Las demás quedan fuera del protocolo, tal como están. Nada se descarta y la unidad nunca se
 * convierte (B10-07 §17).
 */
export function repartirEnElProtocolo<T extends MedicionEscrita>(
  mediciones: readonly T[],
  metricas: readonly MetricaDelProtocolo[],
): { enSuCampo: Map<string, T>; fuera: T[] } {
  const declaradas = new Map(metricas.map((m) => [m.clave, m]));
  const enSuCampo = new Map<string, T>();
  const fuera: T[] = [];
  for (const m of mediciones) {
    const clave = m.metrica.trim();
    const declarada = declaradas.get(clave);
    if (declarada?.unidades.includes(m.unidad.trim()) && m.valor.trim() !== '' && !enSuCampo.has(clave)) enSuCampo.set(clave, m);
    else fuera.push(m);
  }
  return { enSuCampo, fuera };
}

/** Las métricas agrupadas por familia, en el orden de B10-07 §15, con cada grupo en el orden del protocolo. */
export function metricasPorFamilia(metricas: readonly MetricaDelProtocolo[]): { familia: FamiliaDeMedicion; metricas: MetricaDelProtocolo[] }[] {
  return FamiliaDeMedicionSchema.options
    .map((familia) => ({ familia, metricas: metricas.filter((m) => m.familia === familia) }))
    .filter((g) => g.metricas.length > 0);
}

// ─── Dónde se dibuja cada métrica conocida ──────────────────────────────────────────────────────

export type VistaDeLaFigura = 'FRENTE' | 'ESPALDA';

/**
 * Un sitio de toma sobre la figura, en el sistema de coordenadas de la silueta (200 × 440). Los pliegues son un punto;
 * los perímetros, un anillo del ancho del segmento. Se dibuja el lado derecho de la persona: a la izquierda de quien mira
 * de frente, a la derecha de quien mira de espalda.
 */
export interface SitioDeLaFigura {
  readonly vista: VistaDeLaFigura;
  readonly x: number;
  readonly y: number;
  readonly forma: 'PUNTO' | 'ANILLO';
  /** Medio ancho del anillo de un perímetro. */
  readonly radio?: number;
}

export const SITIOS_DE_LA_FIGURA: Readonly<Record<string, SitioDeLaFigura>> = {
  'pliegue-triceps': { vista: 'ESPALDA', x: 152, y: 142, forma: 'PUNTO' },
  'pliegue-subescapular': { vista: 'ESPALDA', x: 116, y: 124, forma: 'PUNTO' },
  'pliegue-biceps': { vista: 'FRENTE', x: 49, y: 144, forma: 'PUNTO' },
  'pliegue-cresta-iliaca': { vista: 'FRENTE', x: 67, y: 208, forma: 'PUNTO' },
  'pliegue-supraespinal': { vista: 'FRENTE', x: 79, y: 218, forma: 'PUNTO' },
  'pliegue-abdominal': { vista: 'FRENTE', x: 89, y: 194, forma: 'PUNTO' },
  'pliegue-muslo-frontal': { vista: 'FRENTE', x: 82, y: 296, forma: 'PUNTO' },
  'pliegue-pantorrilla': { vista: 'FRENTE', x: 92, y: 364, forma: 'PUNTO' },
  'perimetro-brazo-relajado': { vista: 'FRENTE', x: 49, y: 152, forma: 'ANILLO', radio: 12 },
  'perimetro-brazo-flexionado': { vista: 'FRENTE', x: 51, y: 130, forma: 'ANILLO', radio: 12 },
  'perimetro-cintura': { vista: 'FRENTE', x: 100, y: 190, forma: 'ANILLO', radio: 27 },
  'perimetro-cadera': { vista: 'FRENTE', x: 100, y: 236, forma: 'ANILLO', radio: 36 },
  'perimetro-muslo': { vista: 'FRENTE', x: 82, y: 282, forma: 'ANILLO', radio: 16 },
  'perimetro-pantorrilla': { vista: 'FRENTE', x: 83, y: 352, forma: 'ANILLO', radio: 11 },
};

/** Lo único que la figura sabe de un punto: dónde va, cómo se llama y si ya tiene dato. Nunca cuánto vale. */
export interface PuntoDeLaFigura extends SitioDeLaFigura {
  readonly clave: string;
  readonly nombre: string;
  readonly cargado: boolean;
}

/**
 * Los puntos de la figura para las métricas del protocolo que tienen sitio. Recibe **qué claves tienen dato**, no los
 * valores: la figura no puede calificar lo que no conoce (DL-073).
 */
export function puntosDeLaFigura(metricas: readonly MetricaDelProtocolo[], conDato: ReadonlySet<string>): PuntoDeLaFigura[] {
  const puntos: PuntoDeLaFigura[] = [];
  for (const m of metricas) {
    const sitio = SITIOS_DE_LA_FIGURA[m.clave];
    if (!sitio) continue;
    puntos.push({ ...sitio, clave: m.clave, nombre: m.nombre, cargado: conDato.has(m.clave) });
  }
  return puntos;
}
