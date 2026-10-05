/**
 * «Mi evolución» → Progreso (DL-118, Dirección 2026-10-05): en qué zona va cada sitio de la figura, cuándo el torso se
 * divide en dos paneles y qué figura del compositor usa cada zona. Es lógica pura, sin React: la usa
 * `pantallas/progreso.tsx`, y la prueba `scripts/selector-de-tomas.test.mjs` sin teléfono.
 *
 * - **Torso y Piernas** siguen las láminas de tren superior e inferior del compositor (modo Serie). Cada sitio tiene un
 *   solo lugar, por su clave de BE: abdomen y cadera, que las láminas repiten en los dos trenes, no se duplican. El
 *   torso reúne cuello, hombros, brazos y tronco; las piernas, la cadera y los miembros inferiores.
 * - **El torso va en dos paneles** si tiene más de cinco sitios con datos en el período de esa familia. La división sigue
 *   las dos columnas de las láminas de referencia y es fija por clave: no cambia al pasar de una toma a otra. Los paneles
 *   reparten una sola evaluación: no crean tomas ni registros.
 * - Son agrupaciones de la pantalla: no son las 17 zonas musculares de entrenamiento.
 */
import { TARJETAS_DE_PERIMETROS, TARJETAS_DE_PLIEGUES, type ClaveDeLaLamina } from '@be/domain';

export type FamiliaDeProgreso = 'PERIMETROS' | 'PLIEGUES';
export type ZonaDelCuerpo = 'TORSO' | 'PIERNAS';
/** Los dos paneles del torso: el tronco y los brazos (con los hombros o el pecho, según la familia). */
export type PanelDelTorso = 'TRONCO' | 'BRAZOS';

const T = 'TORSO' as const;
const P = 'PIERNAS' as const;

/** La zona de cada sitio, por familia y por clave de BE. Un sitio, un lugar. */
export const ZONA_DEL_SITIO: Readonly<Record<FamiliaDeProgreso, Readonly<Record<string, ZonaDelCuerpo>>>> = {
  PERIMETROS: {
    'perimetro-cuello': T,
    'perimetro-hombros': T,
    'perimetro-pecho': T,
    'perimetro-brazo-relajado': T,
    'perimetro-brazo-flexionado': T,
    'perimetro-antebrazo': T,
    'perimetro-muneca': T,
    'perimetro-cintura': T,
    'perimetro-abdomen': T,
    'perimetro-cadera': P,
    'perimetro-muslo': P,
    'perimetro-pantorrilla': P,
    'perimetro-tobillo': P,
  },
  PLIEGUES: {
    'pliegue-pectoral': T,
    'pliegue-axilar-media': T,
    'pliegue-triceps': T,
    'pliegue-biceps': T,
    'pliegue-subescapular': T,
    'pliegue-antebrazo': T,
    'pliegue-supraespinal': T,
    'pliegue-cresta-iliaca': T,
    'pliegue-abdominal': T,
    'pliegue-muslo-frontal': P,
    'pliegue-pantorrilla': P,
  },
};

/** El panel de cada sitio del torso, cuando el torso se divide. Fijo por clave: no depende de la toma. */
export const PANEL_DEL_TORSO: Readonly<Record<FamiliaDeProgreso, Readonly<Record<string, PanelDelTorso>>>> = {
  PERIMETROS: {
    'perimetro-cuello': 'TRONCO',
    'perimetro-pecho': 'TRONCO',
    'perimetro-cintura': 'TRONCO',
    'perimetro-abdomen': 'TRONCO',
    'perimetro-hombros': 'BRAZOS',
    'perimetro-brazo-relajado': 'BRAZOS',
    'perimetro-brazo-flexionado': 'BRAZOS',
    'perimetro-antebrazo': 'BRAZOS',
    'perimetro-muneca': 'BRAZOS',
  },
  PLIEGUES: {
    'pliegue-subescapular': 'TRONCO',
    'pliegue-cresta-iliaca': 'TRONCO',
    'pliegue-supraespinal': 'TRONCO',
    'pliegue-abdominal': 'TRONCO',
    'pliegue-pectoral': 'BRAZOS',
    'pliegue-axilar-media': 'BRAZOS',
    'pliegue-triceps': 'BRAZOS',
    'pliegue-biceps': 'BRAZOS',
    'pliegue-antebrazo': 'BRAZOS',
  },
};

export const NOMBRE_DE_LA_ZONA: Readonly<Record<ZonaDelCuerpo, string>> = { TORSO: 'Torso', PIERNAS: 'Piernas' };

export const NOMBRE_DEL_PANEL: Readonly<Record<FamiliaDeProgreso, Readonly<Record<PanelDelTorso, string>>>> = {
  PERIMETROS: { TRONCO: 'Cuello y tronco', BRAZOS: 'Hombros y brazos' },
  PLIEGUES: { TRONCO: 'Espalda y abdomen', BRAZOS: 'Pecho y brazo' },
};

/** La figura del compositor de cada zona. */
export const ENCUADRE_DE_LA_ZONA: Readonly<Record<ZonaDelCuerpo, 'TREN_SUPERIOR' | 'TREN_INFERIOR'>> = { TORSO: 'TREN_SUPERIOR', PIERNAS: 'TREN_INFERIOR' };

/** Hasta cuántos sitios con datos el torso va en un solo panel. */
export const MAXIMO_DE_SITIOS_EN_UN_PANEL = 5;

/** El orden de los sitios: el de las tarjetas del compositor para el cuerpo entero. */
const ORDEN: Readonly<Record<FamiliaDeProgreso, readonly ClaveDeLaLamina[]>> = {
  PERIMETROS: TARJETAS_DE_PERIMETROS.ENTERO.flat(),
  PLIEGUES: TARJETAS_DE_PLIEGUES.ENTERO.flat(),
};

export interface PanelDeProgreso {
  /** Identificador estable para recordar la elección: `TORSO`, `TORSO-TRONCO`, `TORSO-BRAZOS` o `PIERNAS`. */
  readonly clave: string;
  readonly zona: ZonaDelCuerpo;
  readonly panel: PanelDelTorso | null;
  readonly nombre: string;
  /** Los sitios con datos del panel, en el orden del compositor. */
  readonly sitios: readonly ClaveDeLaLamina[];
  /** Todos los sitios con datos de la zona: fijan el tamaño y el lugar de la figura, iguales en los dos paneles. */
  readonly sitiosDeLaZona: readonly ClaveDeLaLamina[];
}

/**
 * Los paneles con datos de una familia, a partir de los sitios que tienen alguna medición en el período (no en la toma
 * elegida: así los paneles no cambian al pasar de una toma a otra). Torso primero; sin sitios, no hay panel.
 */
export function panelesDeProgreso(familia: FamiliaDeProgreso, conDatos: (clave: string) => boolean): readonly PanelDeProgreso[] {
  const deLaZona = (zona: ZonaDelCuerpo) => ORDEN[familia].filter((c) => ZONA_DEL_SITIO[familia][c] === zona && conDatos(c));
  const torso = deLaZona('TORSO');
  const piernas = deLaZona('PIERNAS');
  const paneles: PanelDeProgreso[] = [];
  if (torso.length > MAXIMO_DE_SITIOS_EN_UN_PANEL) {
    for (const panel of ['TRONCO', 'BRAZOS'] as const) {
      const sitios = torso.filter((c) => PANEL_DEL_TORSO[familia][c] === panel);
      if (sitios.length > 0) paneles.push({ clave: `TORSO-${panel}`, zona: 'TORSO', panel, nombre: NOMBRE_DEL_PANEL[familia][panel], sitios, sitiosDeLaZona: torso });
    }
  } else if (torso.length > 0) {
    paneles.push({ clave: 'TORSO', zona: 'TORSO', panel: null, nombre: NOMBRE_DE_LA_ZONA.TORSO, sitios: torso, sitiosDeLaZona: torso });
  }
  if (piernas.length > 0) paneles.push({ clave: 'PIERNAS', zona: 'PIERNAS', panel: null, nombre: NOMBRE_DE_LA_ZONA.PIERNAS, sitios: piernas, sitiosDeLaZona: piernas });
  return paneles;
}

/**
 * El panel que se ve: el pedido si sigue entre los que hay; si no, el de la medida elegida; si no, el primero. Así,
 * pasar de una toma a otra conserva el panel, y «Ver su progreso» abre el panel del sitio.
 */
export function panelQueSeVe(paneles: readonly PanelDeProgreso[], pedido: string | null, medida: string | null): PanelDeProgreso | null {
  return paneles.find((p) => p.clave === pedido) ?? (medida ? paneles.find((p) => p.sitios.includes(medida as ClaveDeLaLamina)) : undefined) ?? paneles[0] ?? null;
}
