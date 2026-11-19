/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · las piezas puras de los alimentos cargados a mano, sin Nest ni la base: la fila que
 * leen el profesional y Administración, lo que decidió Administración sobre la versión vigente (NUA-D07) y cuándo una
 * corrección cambia algo (NUA-D01). Las prueba `revision-del-alimento.spec.ts`.
 */
import type { ElementoDeCatalogo, GrupoDeAlimentoEnLaBase, RevisionDelAlimento } from '@be/domain';

/** Un alimento cargado a mano, en su versión vigente, con lo que hace falta para el profesional y para Administración. */
export interface FilaDeAlimentoCargado {
  elementoId: string;
  versionId: string;
  nombre: string;
  composicion: ElementoDeCatalogo['composition'];
  disponible: boolean;
  cantidadDeVersiones: number;
  grupoDeAlimento: GrupoDeAlimentoEnLaBase | null;
  compartido: boolean;
  creado: Date;
  actualizado: Date;
  resultado: 'CERTIFICADO' | 'EQUIVALENTE' | 'QUITADA' | null;
  versionRevisadaId: string | null;
  fuente: string | null;
  equivalenteId: string | null;
  equivalenteNombre: string | null;
  decidido: Date | null;
}

/**
 * Lo que decidió Administración, para la versión vigente (NUA-D07): una certificación vale para la versión que revisó; un
 * equivalente, para el alimento. Lo quitado, o una certificación de una versión anterior, es «sin revisar».
 */
export function revisionDelAlimento(f: FilaDeAlimentoCargado): RevisionDelAlimento {
  if (f.resultado === 'CERTIFICADO' && f.versionRevisadaId === f.versionId && f.fuente && f.decidido) {
    return { state: 'CERTIFIED', certification: { source: f.fuente, certifiedAt: f.decidido.toISOString() }, equivalent: null };
  }
  if (f.resultado === 'EQUIVALENTE' && f.equivalenteId) {
    return { state: 'EQUIVALENT', certification: null, equivalent: { catalogItemId: f.equivalenteId, name: f.equivalenteNombre ?? '' } };
  }
  return { state: 'PENDING', certification: null, equivalent: null };
}

/** Las claves de la composición que comparan dos versiones: si son iguales (y el nombre también), no hay versión nueva. */
export function mismaComposicion(a: ElementoDeCatalogo['composition'], b: ElementoDeCatalogo['composition']): boolean {
  const claves = ['referenceAmount', 'energyKcal', 'proteinG', 'carbohydrateG', 'fatG', 'fiberG'] as const;
  return claves.every((k) => (a[k] ?? null) === (b[k] ?? null));
}
