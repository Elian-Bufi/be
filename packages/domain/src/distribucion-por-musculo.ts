/**
 * WP-EDITOR-ENTRENAMIENTO parte B (DEUDA_LEGAJO DL-196; E13 y E20) · la distribución de una fase por músculo, sin React,
 * para el editor del website y sus pruebas (`distribucion-por-musculo.test.ts`).
 *
 * - **Series por semana por zona** (EE-D34): cada serie efectiva cuenta 1 en las zonas principales del ejercicio y ½ en
 *   las secundarias, tantas veces por semana como días tiene la sesión (una sesión sin días cuenta una vez, y se dice).
 *   Las aproximaciones no cuentan.
 *   **Desvío decidido por Dirección** de REG-06-139 y B10-06 §59 («no se cuenta por zona»): lo autorizó al pedir esta
 *   sección (recorrido del 2026-11-23, E13 y E20). Queda en DEUDA_LEGAJO DL-196; el legajo no se edita.
 * - **Frecuencia:** cuántos días por semana se trabaja cada zona, como principal o como secundaria.
 * - **Equilibrios:** pares lado a lado, con sus series. Ubican, no califican: ni «desbalance» ni colores de juicio.
 * - **Estructuras** (E13): el reparto típico de cada preset de estructura, para dibujarlo en la silueta.
 * - **Zonas a cuidar:** lo que la persona declaró en su formulario (`trn_zonas`), llevado a las zonas cercanas. Ubica, no
 *   indica: el profesional decide.
 */
import type { DiaDeLaSemana } from './contratos-entrenamiento';
import type { PresetDeEstructura } from './presets-de-be';
import { esZonaMuscular, nombreDeZona, ordenDeZona, type IdDeZonaMuscular } from './zonas-musculares';

type Rol = 'PRIMARY' | 'SECONDARY';

/** Cuánto cuenta una serie en una zona según su rol en el ejercicio. */
export const PESO_DEL_ROL: Readonly<Record<Rol, number>> = { PRIMARY: 1, SECONDARY: 0.5 };

/** Un ejercicio de la fase, como lo mira la distribución. */
export interface EjercicioParaDistribuir {
  readonly zonas: readonly { readonly zoneId: string; readonly role: Rol }[];
  /** Las series efectivas (sin las aproximaciones). */
  readonly seriesEfectivas: number;
}

/** Una sesión de la fase: sus días de la semana y sus ejercicios. */
export interface SesionParaDistribuir {
  readonly dias: readonly DiaDeLaSemana[];
  readonly ejercicios: readonly EjercicioParaDistribuir[];
}

export interface ZonaDistribuida {
  readonly zoneId: IdDeZonaMuscular;
  readonly nombre: string;
  /** Series por semana: 1 por serie si es principal, ½ si es secundaria, por cada vez que va la sesión en la semana. */
  readonly series: number;
  /** Cuántos ejercicios de la fase la trabajan (uno que está en dos sesiones cuenta dos veces). */
  readonly ejercicios: number;
  /** Cuántos días por semana se trabaja (frecuencia). */
  readonly dias: number;
}

export interface DistribucionDeLaFase {
  /** Las zonas trabajadas, en el orden del catálogo (de la cabeza a los pies). */
  readonly zonas: readonly ZonaDistribuida[];
  /** Cuántas sesiones con ejercicios no tienen días: cuentan una vez por semana. */
  readonly sesionesSinDias: number;
  /** Cuántos ejercicios no tienen zonas cargadas: no suman a ninguna. */
  readonly ejerciciosSinZonas: number;
  /** El máximo de series por semana de una zona: la escala del mapa de calor. */
  readonly maximo: number;
}

/** Series efectivas de una prescripción: las que no son de aproximación. */
export const seriesEfectivasDe = (p: { readonly sets: readonly { readonly setKind?: string | null }[] }): number => p.sets.filter((s) => s.setKind !== 'WARM_UP').length;

/** La distribución por músculo de las sesiones de una fase, por semana. */
export function distribucionPorMusculo(sesiones: readonly SesionParaDistribuir[]): DistribucionDeLaFase {
  const series = new Map<IdDeZonaMuscular, number>();
  const ejercicios = new Map<IdDeZonaMuscular, number>();
  const dias = new Map<IdDeZonaMuscular, Set<string>>();
  let sesionesSinDias = 0;
  let ejerciciosSinZonas = 0;
  sesiones.forEach((s, n) => {
    if (s.ejercicios.length === 0) return;
    const veces = s.dias.length > 0 ? s.dias.length : 1;
    if (s.dias.length === 0) sesionesSinDias += 1;
    // Una sesión sin días es «un día» propio de esa sesión: no se cruza con los de otra.
    const losDias = s.dias.length > 0 ? s.dias.map(String) : [`sesion-${n}`];
    for (const e of s.ejercicios) {
      const conocidas = e.zonas.filter((z): z is { zoneId: IdDeZonaMuscular; role: Rol } => esZonaMuscular(z.zoneId));
      if (conocidas.length === 0) {
        ejerciciosSinZonas += 1;
        continue;
      }
      // Una zona repetida en el mismo ejercicio cuenta con su rol más fuerte.
      const roles = new Map<IdDeZonaMuscular, Rol>();
      for (const z of conocidas) roles.set(z.zoneId, z.role === 'PRIMARY' || roles.get(z.zoneId) === 'PRIMARY' ? 'PRIMARY' : 'SECONDARY');
      for (const [zona, rol] of roles) {
        series.set(zona, (series.get(zona) ?? 0) + e.seriesEfectivas * PESO_DEL_ROL[rol] * veces);
        ejercicios.set(zona, (ejercicios.get(zona) ?? 0) + 1);
        const d = dias.get(zona) ?? new Set<string>();
        for (const x of losDias) d.add(x);
        dias.set(zona, d);
      }
    }
  });
  const zonas = [...series.keys()]
    .sort((a, b) => ordenDeZona(a) - ordenDeZona(b))
    .map((zoneId) => ({ zoneId, nombre: nombreDeZona(zoneId) ?? zoneId, series: series.get(zoneId)!, ejercicios: ejercicios.get(zoneId) ?? 0, dias: dias.get(zoneId)?.size ?? 0 }));
  return { zonas, sesionesSinDias, ejerciciosSinZonas, maximo: zonas.reduce((m, z) => Math.max(m, z.series), 0) };
}

/** Cuántos niveles tiene el mapa de calor (además de «sin series»). */
export const NIVELES_DEL_CALOR = 4;

/** El nivel de calor de una zona (1 a 4) según sus series y el máximo de la fase; 0 si no tiene. */
export function nivelDeCalor(series: number, maximo: number): number {
  if (series <= 0 || maximo <= 0) return 0;
  return Math.min(NIVELES_DEL_CALOR, Math.max(1, Math.ceil((series / maximo) * NIVELES_DEL_CALOR)));
}

/** «12 series por semana», «7,5 series por semana», «1 serie por semana». */
export function seriesEnPalabras(series: number): string {
  const texto = Number.isInteger(series) ? String(series) : String(series).replace('.', ',');
  return `${texto} ${series === 1 ? 'serie' : 'series'} por semana`;
}

/** «Pectoral: 12 series por semana (de 3 ejercicios) · 2 días». */
export function zonaEnPalabras(z: ZonaDistribuida): string {
  return `${z.nombre}: ${seriesEnPalabras(z.series)} (de ${z.ejercicios === 1 ? '1 ejercicio' : `${z.ejercicios} ejercicios`}) · ${z.dias === 1 ? '1 día' : `${z.dias} días`}`;
}

// ─── Los equilibrios ─────────────────────────────────────────────────────────────────────────

export interface LadoDelEquilibrio {
  readonly nombre: string;
  readonly zonas: readonly IdDeZonaMuscular[];
}

/**
 * Los pares que se miran lado a lado (EE-D35). El catálogo tiene un solo deltoides (REG-06-137: 17 zonas), así que el par
 * anterior/posterior del hombro se mira con lo que hay: el pectoral contra la espalda alta.
 */
export const PARES_DE_EQUILIBRIO: readonly { readonly clave: string; readonly izquierda: LadoDelEquilibrio; readonly derecha: LadoDelEquilibrio }[] = [
  { clave: 'EMPUJE_TRACCION', izquierda: { nombre: 'Empuje', zonas: ['pectoral', 'triceps'] }, derecha: { nombre: 'Tracción', zonas: ['dorsal', 'romboides', 'biceps'] } },
  { clave: 'CUADRICEPS_ISQUIOS', izquierda: { nombre: 'Cuádriceps', zonas: ['cuadriceps'] }, derecha: { nombre: 'Isquiotibiales', zonas: ['isquios'] } },
  { clave: 'PECHO_ESPALDA_ALTA', izquierda: { nombre: 'Pectoral', zonas: ['pectoral'] }, derecha: { nombre: 'Espalda alta', zonas: ['romboides', 'trapecio'] } },
  { clave: 'ABDOMEN_LUMBAR', izquierda: { nombre: 'Abdomen', zonas: ['recto-abdominal', 'oblicuos'] }, derecha: { nombre: 'Erectores', zonas: ['erectores'] } },
];

export interface Equilibrio {
  readonly clave: string;
  readonly izquierda: { readonly nombre: string; readonly series: number };
  readonly derecha: { readonly nombre: string; readonly series: number };
}

/** Los pares con sus series por semana: la suma de las series de sus zonas. Un par sin series de ningún lado no va. */
export function equilibrios(d: DistribucionDeLaFase): Equilibrio[] {
  const de = (zonas: readonly IdDeZonaMuscular[]) => d.zonas.filter((z) => zonas.includes(z.zoneId)).reduce((s, z) => s + z.series, 0);
  return PARES_DE_EQUILIBRIO.map((p) => ({ clave: p.clave, izquierda: { nombre: p.izquierda.nombre, series: de(p.izquierda.zonas) }, derecha: { nombre: p.derecha.nombre, series: de(p.derecha.zonas) } })).filter(
    (e) => e.izquierda.series > 0 || e.derecha.series > 0,
  );
}

// ─── Las estructuras (E13) ───────────────────────────────────────────────────────────────────

/**
 * El reparto semanal típico de un preset de estructura: cada sesión con sus zonas como principales y una serie de
 * referencia, para que el mapa muestre la frecuencia de cada zona (en cuántos días aparece).
 */
export function repartoDeLaEstructura(preset: PresetDeEstructura): DistribucionDeLaFase {
  return distribucionPorMusculo(
    preset.sesiones.map((s) => ({ dias: s.dias, ejercicios: s.zonas.map((zoneId) => ({ zonas: [{ zoneId, role: 'PRIMARY' as const }], seriesEfectivas: 1 })) })),
  );
}

// ─── Las zonas a cuidar ──────────────────────────────────────────────────────────────────────

/**
 * Lo que se declara en `trn_zonas` (articulaciones y regiones) llevado a las zonas musculares que la rodean o la cargan
 * (EE-D39). «Otra» no se ubica: el texto queda en el contexto de la persona.
 */
export const ZONAS_CERCANAS_A_LO_DECLARADO: Readonly<Record<string, readonly IdDeZonaMuscular[]>> = {
  cuello: ['trapecio'],
  hombros: ['deltoides'],
  codos: ['biceps', 'triceps', 'antebrazo'],
  munecas_o_manos: ['antebrazo'],
  espalda_alta: ['trapecio', 'romboides'],
  lumbar: ['erectores'],
  cadera: ['gluteos', 'aductores'],
  rodillas: ['cuadriceps'],
  tobillos_o_pies: ['gemelos', 'tibial'],
};

/** Una respuesta del formulario, con lo mínimo (API-CTX-01). */
export interface RespuestaParaCuidar {
  readonly fieldCode: string;
  readonly answer: { readonly type: string; readonly yes?: boolean; readonly options?: readonly string[] };
  readonly text: string;
}

export interface ZonasACuidar {
  /** Lo que declaró, en sus palabras («Hombros y Rodillas»). */
  readonly declarado: string;
  readonly zonas: readonly IdDeZonaMuscular[];
}

/**
 * Las zonas a cuidar según el formulario más nuevo que responde `trn_zonas` con «sí» en `dolor_o_lesiones`. Los
 * formularios vienen del más nuevo al más viejo (API-CTX-01). `null` si no declaró nada que se ubique.
 */
export function zonasACuidar(formularios: readonly { readonly sections: readonly { readonly answers: readonly RespuestaParaCuidar[] }[] }[]): ZonasACuidar | null {
  for (const f of formularios) {
    const respuestas = f.sections.flatMap((s) => s.answers);
    const donde = respuestas.find((r) => r.fieldCode === 'trn_zonas');
    if (!donde) continue;
    const dolor = respuestas.find((r) => r.fieldCode === 'dolor_o_lesiones');
    if (dolor && dolor.answer.type === 'BOOLEAN' && dolor.answer.yes === false) return null;
    const opciones = donde.answer.type === 'MULTI_CHOICE' ? (donde.answer.options ?? []) : [];
    const zonas = [...new Set(opciones.flatMap((o) => ZONAS_CERCANAS_A_LO_DECLARADO[o] ?? []))].sort((a, b) => ordenDeZona(a) - ordenDeZona(b));
    return zonas.length > 0 ? { declarado: donde.text, zonas } : null;
  }
  return null;
}

/** Las zonas de un ejercicio que están entre las zonas a cuidar (como principal o secundaria). */
export function zonasDelEjercicioACuidar(zonas: readonly { readonly zoneId: string }[], aCuidar: ZonasACuidar | null): IdDeZonaMuscular[] {
  if (!aCuidar) return [];
  return [...new Set(zonas.map((z) => z.zoneId))].filter((z): z is IdDeZonaMuscular => (aCuidar.zonas as readonly string[]).includes(z));
}

export const COPY_DISTRIBUCION = {
  titulo: 'Distribución',
  queMuestra: 'Series por semana de cada músculo en esta fase: 1 por serie si es principal en el ejercicio y ½ si es secundario. Las aproximaciones no cuentan.',
  ejemplo: 'Ejemplo: press de banca 4 series (pectoral principal, tríceps secundario) dos veces por semana → pectoral 8 y tríceps 4 series por semana.',
  frecuencia: 'Frecuencia',
  frecuenciaQueEs: 'Cuántos días por semana se trabaja cada músculo, como principal o como secundario.',
  equilibrios: 'Equilibrios',
  equilibriosQueEs: 'Pares lado a lado, con sus series por semana. Ubican, no califican: la decisión es tuya.',
  estructuras: 'Estructuras',
  estructurasQueEs: 'Repartos típicos para arrancar una fase. Se aplican desde «Presets» y no traen ejercicios.',
  aCuidar: 'Zonas a cuidar',
  aCuidarQueEs: (declarado: string) => `Declaró dolor o una lesión en: ${declarado}. Se marcan los músculos cercanos; ubica, no indica.`,
  avisoDelEjercicio: (zonas: string) => `Trabaja ${zonas}, cerca de lo que declaró en su formulario.`,
  sinSeries: 'Esta fase todavía no tiene ejercicios con zonas: no hay nada que distribuir.',
  sesionesSinDias: (n: number) => (n === 1 ? '1 sesión sin días cuenta una vez por semana.' : `${n} sesiones sin días cuentan una vez por semana.`),
  ejerciciosSinZonas: (n: number) => (n === 1 ? '1 ejercicio no tiene zonas cargadas y no suma.' : `${n} ejercicios no tienen zonas cargadas y no suman.`),
  dias: (n: number) => (n === 1 ? '1 día' : `${n} días`),
  menos: 'menos series',
  mas: 'más series',
  porDia: (n: number) => (n === 1 ? '1 día por semana' : `${n} días por semana`),
} as const;
