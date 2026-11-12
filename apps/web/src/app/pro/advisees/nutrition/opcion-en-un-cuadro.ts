/**
 * ED-31 (WP-EDITORES-PROFESIONAL; maqueta 06) · La opción en un cuadro, con el buscador adentro, sin React.
 *
 * - **Se trabaja sobre una copia:** el cuadro edita una copia de la opción, y «Guardar la opción» la pone en el borrador
 *   (que lleva el autoguardado). «Cancelar» y Escape no tocan nada; con algo cambiado, cerrar pregunta (§2.3).
 * - **El buscador busca mientras se escribe** (desde dos letras, con una pausa corta): los habituales que coinciden van
 *   primero y después el catálogo, sin repetir un alimento. Las flechas mueven el marcado; **Enter suma el marcado y el
 *   cuadro sigue abierto**, con el campo vacío y el foco adentro, para el próximo.
 * - **Cada resultado dice de dónde sale y qué le falta:** la fuente («USDA», «Demostración»…), «composición completa» o
 *   «Sin dato de fibra», y «Dato de demostración» si es del catálogo de prueba.
 * - Al guardar, la opción conserva su identidad aunque un guardado se la haya dado con el cuadro abierto: así el
 *   siguiente no la crea de nuevo.
 */

/** Lo mínimo de un alimento del catálogo que usa el buscador. */
export interface AlimentoDelBuscador {
  readonly catalogItemId: string;
  readonly name: string;
  readonly provenance: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL' | 'CONTROLLED_IMPORT';
  readonly composition: {
    readonly energyKcal?: number | string | null;
    readonly carbohydrateG?: number | string | null;
    readonly proteinG?: number | string | null;
    readonly fatG?: number | string | null;
    readonly fiberG?: number | string | null;
  };
}

export interface ResultadoDelBuscador<A extends AlimentoDelBuscador> {
  readonly alimento: A;
  /** Vino de los habituales del profesional. */
  readonly habitual: boolean;
}

/** Desde cuántas letras se busca en el catálogo mientras se escribe. */
export const LETRAS_PARA_BUSCAR = 2;
/** La pausa, en milisegundos, antes de buscar lo que se escribió. */
export const PAUSA_DEL_BUSCADOR = 250;

export const hayQueBuscar = (texto: string): boolean => texto.trim().length >= LETRAS_PARA_BUSCAR;

/**
 * Los habituales que coinciden, primero; después el catálogo, sin repetir un alimento. Un habitual que también trajo el
 * catálogo usa lo del catálogo, que dice de dónde sale.
 */
export function resultadosDelBuscador<A extends AlimentoDelBuscador>(habituales: readonly A[], catalogo: readonly A[]): ResultadoDelBuscador<A>[] {
  const vistos = new Set(habituales.map((h) => h.catalogItemId));
  const delCatalogo = new Map(catalogo.map((c) => [c.catalogItemId, c]));
  return [...habituales.map((h) => ({ alimento: delCatalogo.get(h.catalogItemId) ?? h, habitual: true })), ...catalogo.filter((c) => !vistos.has(c.catalogItemId)).map((alimento) => ({ alimento, habitual: false }))];
}

/** El marcado después de una tecla: las flechas dan la vuelta; Inicio y Fin van a las puntas. `-1`: no hay resultados. */
export function marcadoTrasTecla(marcado: number, total: number, tecla: string): number {
  if (total === 0) return -1;
  const actual = Math.min(Math.max(marcado, 0), total - 1);
  switch (tecla) {
    case 'ArrowDown':
      return (actual + 1) % total;
    case 'ArrowUp':
      return (actual - 1 + total) % total;
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return actual;
  }
}

const NOMBRE_DEL_NUTRIENTE = { energyKcal: 'energía', carbohydrateG: 'carbohidratos', proteinG: 'proteínas', fatG: 'grasas', fiberG: 'fibra' } as const;

/** «composición completa», o «Sin dato de fibra» / «Sin dato de fibra y grasas». */
export function completitudEnPalabras(c: AlimentoDelBuscador['composition']): string {
  const faltan = (Object.keys(NOMBRE_DEL_NUTRIENTE) as (keyof typeof NOMBRE_DEL_NUTRIENTE)[]).filter((n) => c[n] === null || c[n] === undefined).map((n) => NOMBRE_DEL_NUTRIENTE[n]);
  if (faltan.length === 0) return 'composición completa';
  const lista = faltan.length === 1 ? faltan[0]! : `${faltan.slice(0, -1).join(', ')} y ${faltan[faltan.length - 1]!}`;
  return `Sin dato de ${lista}`;
}

export const esDeDemostracion = (a: Pick<AlimentoDelBuscador, 'provenance'>): boolean => a.provenance === 'BE_SYNTHETIC_SEED';

/** El ítem que nace al elegir un alimento: sin cantidad ni estado, que se completan en su fila (REG-06-122). */
export const itemNuevo = (catalogItemId: string) => ({ catalogItemId, quantity: null, preparationState: null, note: null });

/** Lo mínimo de una opción para compararla y ponerla en el borrador. */
export interface OpcionDelCuadro {
  readonly optionId?: string | undefined;
  readonly label: string;
  readonly items: readonly unknown[];
}

/** Si la copia cambió frente a lo que se abrió: decide si cerrar pregunta. */
export const cambioLaOpcion = (abierta: OpcionDelCuadro, copia: OpcionDelCuadro): boolean => JSON.stringify(abierta) !== JSON.stringify(copia);

/**
 * La opción que va al borrador al tocar «Guardar la opción»: la copia, con la identidad que tenga ahora la opción del
 * borrador si la copia no la traía (un autoguardado se la pudo dar con el cuadro abierto).
 */
export function opcionAlGuardar<O extends OpcionDelCuadro>(enElBorrador: OpcionDelCuadro | undefined, copia: O): O {
  if (copia.optionId || !enElBorrador?.optionId) return copia;
  return { ...copia, optionId: enElBorrador.optionId };
}

/** «Almuerzo · opción 1». */
export const tituloDelCuadro = (comida: string, k: number): string => `${comida} · opción ${k + 1}`;

/** «Día habitual · se elige una de 3 opciones». */
export function subtituloDelCuadro(dia: string, opciones: number): string {
  return opciones <= 1 ? `${dia} · es la única opción de esta comida` : `${dia} · se elige una de ${opciones} opciones`;
}

export const COPY_OPCION_EN_UN_CUADRO = {
  nombre: 'Nombre',
  buscar: 'Buscar un alimento',
  pistaDelBuscador: 'Enter suma el marcado',
  ayudaDelBuscador: 'Escribí dos letras o más: los habituales van primero. Las flechas eligen y Enter suma; el cuadro sigue abierto.',
  sinItems: 'Esta opción todavía no tiene alimentos: buscalos abajo.',
  buscando: 'Buscando…',
  ningunoCoincide: (q: string) => `Ningún alimento coincide con «${q}».`,
  noSePudoBuscar: (motivo: string) => `No pudimos buscar en el catálogo. ${motivo}`,
  agregado: (nombre: string, veces: number) => `Agregado: ${nombre}${veces > 1 ? ` (van ${veces})` : ''}.`,
  habitual: 'Habitual',
  datoDeDemostracion: 'Dato de demostración',
  cadaCien: (ml: boolean) => (ml ? 'cada 100 ml' : 'cada 100 g'),
  noEsta: '¿No está?',
  crearAMano: 'Crearlo a mano',
  importar: 'Importarlo de Open Food Facts',
  volver: 'Volver a la opción',
  alInstante: 'Esta opción, al instante',
  comoSeCalcula: 'Con las cantidades de la opción y la composición de cada alimento. Cambia apenas cambiás una cantidad.',
  rangoDe: (comida: string) => `Rango de ${comida}`,
  conEstaOpcion: 'Con esta opción como queda.',
  objetivoGeneral: 'Objetivo general',
  sinObjetivo: 'Esta versión todavía no tiene un objetivo general.',
  guardar: 'Guardar la opción',
  sinNombre: 'Falta el nombre de la opción.',
} as const;
