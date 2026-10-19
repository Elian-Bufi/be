/**
 * DL-141 D-6 · el origen de un ítem del catálogo en la fila del buscador del website, donde el profesional lo elige: los
 * cuatro buscadores (agregar un alimento o un ejercicio al plan, los ingredientes de una receta y el alimento de una
 * estimación en los registros). Encargo de consolidación de Dirección del 2026-10-19, bloque 4: «origen breve en la fila y
 * detalle accesible, sin saturar la lista».
 * - **Breve, a la vista:** «USDA», «wger · CC BY-SA 4.0», «Open Food Facts · ODbL 1.0», «Demostración», «Cargado por
 *   vos». Si la correspondencia con la fuente es aproximada, también a la vista: no se puede esconder en una pista lo que
 *   hace falta para elegir (GUIA-UX-UI I.2).
 * - **El detalle, en la pista:** de dónde sale, con qué licencia y, si es aproximada, en qué.
 * - **La sección de «Fuentes del catálogo»** (`/legal/fuentes`) que lo explica, para el enlace; ninguna en lo cargado a
 *   mano, que no tiene una fuente que citar.
 * Una función pura: la fecha la formatea quien la llama, como en el resto del website.
 */
import type { FuenteExterna, FuenteExternaDeAlimento, OrigenEnElBuscador } from './contratos-procedencia-externa';

/** Lo que necesita la fila: la procedencia del ítem, su fuente externa y lo que suma el buscador (D-6). */
export interface ItemConOrigen {
  readonly provenance: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL' | 'CONTROLLED_IMPORT';
  readonly externalSource: FuenteExternaDeAlimento | FuenteExterna | null;
  readonly origin: OrigenEnElBuscador;
}

/** Las secciones de «Fuentes del catálogo» (los `id` de sus títulos). */
export type SeccionDeFuentes = 'fuentes-alimentos' | 'fuentes-ejercicios' | 'fuentes-importados' | 'fuentes-demostracion';

export interface OrigenParaMostrar {
  /** Lo que va en la fila. */
  readonly breve: string;
  /** El detalle, para la pista: una o dos frases. */
  readonly detalle: string;
  /** La sección de «Fuentes del catálogo» que lo explica; `null` en lo cargado a mano. */
  readonly seccion: SeccionDeFuentes | null;
}

export const COPY_ORIGEN_EN_EL_CATALOGO = {
  /** Cómo se anuncia el enlace a «Fuentes del catálogo» (se abre en otra pestaña: el editor queda como estaba). */
  enlace: 'Fuentes del catálogo, en otra pestaña',
  usda: 'USDA',
  aproximada: 'equivalencia aproximada',
  demostracion: 'Demostración',
  cargadoPorVos: 'Cargado por vos',
  cargadoPorOtro: 'Cargado por otro profesional',
  importado: 'Importado',
  detalleDemostracion: 'Es de demostración: sus datos son del ambiente de prueba y no salen de una fuente.',
  detalleCargadoPorVos: 'Lo cargaste a mano: tiene los datos que escribiste.',
  detalleCargadoPorOtro: 'Lo cargó a mano el profesional de un plan tuyo: tiene los datos que escribió.',
  detalleImportado: 'Lo trajo un profesional de un proveedor externo, después de revisarlo.',
} as const;

/** Las licencias, con el nombre corto que entra en una fila. */
const LICENCIA_CORTA: Readonly<Record<string, string>> = {
  'CC-BY-SA-3.0': 'CC BY-SA 3.0',
  'CC-BY-SA-4.0': 'CC BY-SA 4.0',
  'CC-BY-4.0': 'CC BY 4.0',
  'CC0-1.0': 'CC0 1.0',
  'ODbL-1.0': 'ODbL 1.0',
};
const licenciaCorta = (l: { readonly id: string; readonly label: string }): string => LICENCIA_CORTA[l.id] ?? l.label;

const conPunto = (texto: string): string => (/[.!?…]$/.test(texto) ? texto : `${texto}.`);

/**
 * El origen de un ítem para su fila. `formatearDia` convierte el instante en que llegó al catálogo («19 oct 2026»).
 * Lo aproximado se dice a la vista y en el detalle, con la condición tal como quedó en la procedencia.
 */
export function origenEnElCatalogo(item: ItemConOrigen, formatearDia: (instante: string) => string): OrigenParaMostrar {
  const C = COPY_ORIGEN_EN_EL_CATALOGO;
  const aproximada = item.origin.approximateCorrespondence;
  const fuente = item.externalSource;
  if (fuente) {
    const licencia = licenciaCorta(fuente.license);
    const conAutoria = fuente.license.attribution ? ` (autoría: ${fuente.license.attribution})` : '';
    const cuando = formatearDia(fuente.receivedAt);
    const enQue = aproximada ? ` La equivalencia es aproximada. ${conPunto(aproximada)}` : '';
    if (fuente.provider === 'USDA_FDC_SR_LEGACY') {
      // Solo un alimento tiene a USDA de proveedor: su fuente es la de un alimento, con la referencia del registro.
      const usda = (fuente as FuenteExternaDeAlimento).usdaReference;
      const registro = usda ? `registro FDC ${fuente.externalId} (NDB ${usda.ndbNumber}), «${usda.originalDescription}»` : `registro FDC ${fuente.externalId}`;
      return {
        breve: aproximada ? `${C.usda} · ${C.aproximada}` : C.usda,
        detalle: `Composición de USDA FoodData Central (SR Legacy), de dominio público: ${registro}.${enQue}`,
        seccion: 'fuentes-alimentos',
      };
    }
    if (fuente.provider === 'WGER') {
      return {
        breve: `wger · ${licencia}`,
        detalle: `De wger, el ejercicio ${fuente.externalId}, con la licencia ${fuente.license.label}${conAutoria}. Llegó al catálogo BE el ${cuando}.${enQue}`,
        seccion: 'fuentes-ejercicios',
      };
    }
    return {
      breve: `Open Food Facts · ${licencia}`,
      detalle: `Importado de Open Food Facts el ${cuando}, el producto ${fuente.externalId}, con la licencia ${fuente.license.label}. No es un dato verificado por BE.${enQue}`,
      seccion: 'fuentes-importados',
    };
  }
  if (item.provenance === 'BE_SYNTHETIC_SEED') return { breve: C.demostracion, detalle: C.detalleDemostracion, seccion: 'fuentes-demostracion' };
  if (item.provenance === 'PROFESSIONAL_MANUAL') {
    return item.origin.loadedBy === 'ANOTHER_PROFESSIONAL'
      ? { breve: C.cargadoPorOtro, detalle: C.detalleCargadoPorOtro, seccion: null }
      : { breve: C.cargadoPorVos, detalle: C.detalleCargadoPorVos, seccion: null };
  }
  // Un importado sin su fuente externa (anterior a WP-08): se dice que es importado, sin inventarle un proveedor.
  return { breve: C.importado, detalle: C.detalleImportado, seccion: 'fuentes-importados' };
}
