/**
 * Lo que la comparación de dos etapas escribe en pantalla (WP-ESCRITORIO-AMABLE, C-12): la cobertura de cada etapa,
 * dicha una vez, y las etapas que se pueden elegir en cada tarjeta.
 *
 * - **La cobertura se dice una vez por etapa.** Antes iba en cada celda, y dos métricas que salen de los mismos registros
 *   (las calorías y las proteínas) la repetían entera. Ahora la tarjeta de la etapa dice la que comparten más métricas, y
 *   nombra cuáles si no son todas. Una métrica con otra cobertura (los registros, que cuentan días con registros y no con
 *   valor; el peso, que cuenta tomas) la dice en su celda. Ninguna cobertura se pierde ni se funde con otra.
 * - **Las frases son las del dominio** (`partesDeLaCobertura`): acá no se reescriben ni se reordenan.
 * - **Las fechas que se usaron se dicen solo si no son las de la etapa** (una sesión del plan anterior registrada
 *   después): las de la etapa ya están en su tarjeta.
 *
 * Son funciones puras: no leen la pantalla ni la hora. Tienen su prueba en `scripts/etapas-en-pantalla.test.mjs`.
 */
import { numero, partesDeLaCobertura, type EtapaDePlanificacion, type ResumenDeEtapa } from '@be/domain';

/**
 * La cobertura de una métrica en una etapa, en partes: las del dominio y lo que no coincide con la etapa. `null` si la
 * etapa no tiene resumen (duró menos de un día o quedó fuera de lo leído): eso lo dice la celda.
 */
export function partesDeLaEtapa(r: ResumenDeEtapa, dia: (fechaCivil: string) => string): string[] | null {
  if (r.resumen === null) return null;
  const otrasFechas = r.rango !== null && !r.recortada && (r.rango.desde !== r.etapa.desde || r.rango.hasta !== (r.etapa.ultimoDia ?? r.etapa.desde));
  return [
    ...partesDeLaCobertura(r.resumen),
    ...(r.deOtraVersion ? [`${numero(r.deOtraVersion)} ${r.deOtraVersion === 1 ? 'día con registros asociados' : 'días con registros asociados'} a otra versión`] : []),
    ...(r.fueraDeLasFechas ? [`${numero(r.fueraDeLasFechas)} fuera de las fechas de la etapa`] : []),
    ...(otrasFechas && r.rango ? [`del ${dia(r.rango.desde)} al ${dia(r.rango.hasta)}`] : []),
    ...(r.recortada ? ['la lectura no cubre la etapa entera'] : []),
  ];
}

export interface CoberturaDeUnaMetrica {
  readonly clave: string;
  readonly nombre: string;
  /** Las partes de su cobertura en la etapa; `null` si no tiene resumen. */
  readonly partes: readonly string[] | null;
}

export interface CoberturaDeLaEtapa {
  /** La cobertura que comparten más métricas. */
  readonly partes: readonly string[];
  /** Las métricas que la comparten, en su orden. */
  readonly de: readonly string[];
  /** La comparten todas las métricas con resumen: no hace falta nombrarlas. */
  readonly deTodas: boolean;
  /** Las claves de las métricas con otra cobertura: la dicen en su celda. */
  readonly propias: ReadonlySet<string>;
}

/**
 * La cobertura que va en la tarjeta de una etapa: la que comparten más métricas y, si dos empatan, la de la métrica que
 * está primero. `null` si ninguna métrica tiene resumen en la etapa.
 */
export function coberturaDeLaEtapa(metricas: readonly CoberturaDeUnaMetrica[]): CoberturaDeLaEtapa | null {
  const conResumen = metricas.filter((m): m is CoberturaDeUnaMetrica & { partes: readonly string[] } => m.partes !== null);
  if (conResumen.length === 0) return null;
  const grupos = new Map<string, (typeof conResumen)[number][]>();
  for (const m of conResumen) {
    const texto = m.partes.join(' · ');
    grupos.set(texto, [...(grupos.get(texto) ?? []), m]);
  }
  // `Map` conserva el orden de llegada: con un empate gana el grupo de la métrica que está primero.
  const elegido = [...grupos.values()].reduce((mayor, g) => (g.length > mayor.length ? g : mayor));
  const claves = new Set(elegido.map((m) => m.clave));
  return {
    partes: (elegido[0] as (typeof conResumen)[number]).partes,
    de: elegido.map((m) => m.nombre),
    deTodas: elegido.length === conResumen.length,
    propias: new Set(conResumen.filter((m) => !claves.has(m.clave)).map((m) => m.clave)),
  };
}

/** «Calorías», «Calorías y Proteínas», «Calorías, Proteínas y Registros». */
export function enumerar(nombres: readonly string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? '';
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/**
 * Las etapas que una tarjeta puede ofrecer. A es siempre la más antigua de las dos (la diferencia se lee «la posterior
 * menos la anterior»): la tarjeta A ofrece las anteriores a B, y la B, las posteriores a A. Así lo elegido queda en la
 * tarjeta donde se eligió, y nunca se compara una etapa consigo misma. La elegida está siempre en la lista.
 */
export function etapasElegibles(etapas: readonly EtapaDePlanificacion[], elegida: EtapaDePlanificacion, otra: EtapaDePlanificacion, lado: 'A' | 'B'): EtapaDePlanificacion[] {
  const lista = etapas.filter((e) => e.planVersionId !== otra.planVersionId && (lado === 'A' ? e.activadaEl < otra.activadaEl : e.activadaEl > otra.activadaEl));
  if (lista.some((e) => e.planVersionId === elegida.planVersionId)) return lista;
  return [...lista, elegida].sort((x, y) => x.activadaEl.localeCompare(y.activadaEl));
}

/** El número de la versión de una etapa («v3» → «3»), como se escribe: «versión 3». */
export const versionDeLaEtapa = (e: EtapaDePlanificacion): string => e.etiqueta.replace(/^v/, '');

/**
 * Cómo terminó una etapa, en palabras: qué versión la reemplazó (la siguiente del área, si se la conoce), que se cerró
 * el seguimiento, o que sigue vigente.
 */
export function finDeLaEtapa(e: EtapaDePlanificacion, etapas: readonly EtapaDePlanificacion[], dia: (fechaCivil: string) => string): string {
  if (e.abierta) return 'Sigue vigente';
  const i = etapas.findIndex((x) => x.planVersionId === e.planVersionId);
  const siguiente = i >= 0 ? etapas[i + 1] : undefined;
  const motivo =
    e.motivoDeFin === 'FOLLOW_UP_CLOSED' ? 'se cerró el seguimiento' : siguiente ? `la reemplazó la versión ${versionDeLaEtapa(siguiente)}` : e.motivoDeFin === 'SUCCESSOR_ACTIVATED' ? 'la reemplazó la versión siguiente' : 'terminó';
  return `${e.ultimoDia ? dia(e.ultimoDia) : 'El mismo día'}, ${motivo}`;
}
