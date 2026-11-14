/**
 * PG-12 de WP-PULIDO-GRANDES (DL-173, con PG-D7): quién miró lo que compartiste, en la tarjeta de cada profesional de
 * «Quién ve qué». Lógica pura, con su prueba (`quien-miro.test.ts`, TEST-PG-011).
 *
 * - **Sale de una lectura que ya existe** (`misResumenesCompartidos`, `GET /me/summary-sharing`): trae las últimas
 *   lecturas de lo compartido, hasta 50, con quién, de qué área y cuándo. Son las veces que un profesional abrió el plan de
 *   otra área que la persona le comparte con el nivel «resumen y plan». La APK la empieza a leer con esta parte: se
 *   congela con su candidata (DL-152).
 * - **Una línea por profesional, con la última lectura** (PG-D7): la más nueva por su hora, no por su lugar en la lista,
 *   con el plan que miró, el día y la hora en 24 h. Sin contadores ni gráficos de cuántas veces.
 * - **La línea no repite el nombre:** va dentro de la tarjeta de ese profesional, que ya lo tiene de título. Dice qué miró
 *   («tu plan de Nutrición»), porque lo que se registra es la lectura de un plan compartido, no la del área que él lleva.
 * - **«Todavía no miró» solo cuando se sabe:** hoy le compartís un plan para mirar y la lista no llegó al tope (con 50,
 *   una lectura más vieja pudo quedar afuera). Lo que se comparte solo como resumen no se registra como lectura: de eso
 *   no se dice nada, ni que lo miró ni que no.
 * - **Si la lectura falla, la línea no se dibuja:** la tarjeta sigue con sus permisos.
 * Las lecturas son solo de profesionales: Administración no aparece. No avisa cada vez que alguien mira, y quitar un
 * permiso sigue en su lugar (el vínculo o Privacidad).
 */
import { ETIQUETA_DE_ALCANCE, type MisResumenesCompartidosResponse } from '@be/domain';
import { diaDeLaSemana, diaYMes, fechaCivilDeUnInstante, hora } from './formato';

/** Cuántas lecturas devuelve la API, como mucho: con la lista llena, una ausencia no prueba nada. */
export const TOPE_DE_LECTURAS = 50;

/** Lo que usa de la respuesta: con quién compartís, en qué nivel, y las lecturas. */
export type LoCompartido = Pick<MisResumenesCompartidosResponse['data'], 'sharing' | 'professionals' | 'accesses'>;

export const TEXTOS_DE_QUIEN_MIRO = {
  miro: (plan: string, cuando: string) => `Miró ${plan} ${cuando}`,
  todaviaNoMiro: (plan: string) => `Todavía no miró ${plan}`,
  tuPlanDe: (area: string) => `tu plan de ${area}`,
  tusPlanesDe: (areas: string) => `tus planes de ${areas}`,
  hoy: (laHora: string) => `hoy a las ${laHora}`,
  ayer: (laHora: string) => `ayer a las ${laHora}`,
  elDia: (elDia: string, laHora: string) => `el ${elDia} a las ${laHora}`,
} as const;

const T = TEXTOS_DE_QUIEN_MIRO;
/** El orden de todo BE, para nombrar dos planes siempre igual. */
const ORDEN_DE_LAS_AREAS: readonly string[] = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
const mismo =(a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();
const nombreDelArea = (area: string): string => ETIQUETA_DE_ALCANCE[area as keyof typeof ETIQUETA_DE_ALCANCE] ?? area;
const enumerar = (nombres: readonly string[]): string => (nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`);

/** El día anterior a una fecha civil. */
function diaAnterior(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Cuándo fue una lectura, dicho desde `hoy` (la fecha civil de hoy en la misma zona): «hoy a las 18:20», «ayer a las
 * 09:05», «el martes 10 a las 18:20» en el mismo mes, «el martes 20 de octubre a las 18:20» en el mismo año y, si no,
 * con el año. La hora, de 24 h. `zona` es para las pruebas: en el teléfono vale la suya.
 */
export function cuandoLoMiro(iso: string, hoy: string, zona?: string): string {
  const dia = fechaCivilDeUnInstante(iso, zona);
  const laHora = hora(iso, zona);
  if (dia === hoy) return T.hoy(laHora);
  if (dia === diaAnterior(hoy)) return T.ayer(laHora);
  const semana = diaDeLaSemana(dia);
  if (dia.slice(0, 7) === hoy.slice(0, 7)) return T.elDia(`${semana} ${Number(dia.slice(8, 10))}`, laHora);
  if (dia.slice(0, 4) === hoy.slice(0, 4)) return T.elDia(`${semana} ${diaYMes(dia)}`, laHora);
  return T.elDia(`${semana} ${diaYMes(dia)} de ${dia.slice(0, 4)}`, laHora);
}

/**
 * La línea de cada profesional, por su identificador: la última lectura, o «Todavía no miró» cuando se sabe. Un
 * profesional sin nada que decir no está en el mapa, y su tarjeta no la dibuja.
 */
export function quienMiro(compartido: LoCompartido, hoy: string, zona?: string): ReadonlyMap<string, string> {
  const lineas = new Map<string, string>();
  const ultimas = new Map<string, LoCompartido['accesses'][number]>();
  for (const lectura of compartido.accesses) {
    const id = lectura.professional.identityId.toLowerCase();
    const anterior = ultimas.get(id);
    if (!anterior || Date.parse(lectura.readAt) > Date.parse(anterior.readAt)) ultimas.set(id, lectura);
  }
  for (const [id, lectura] of ultimas) lineas.set(id, T.miro(T.tuPlanDe(nombreDelArea(lectura.area)), cuandoLoMiro(lectura.readAt, hoy, zona)));
  // Sin lecturas: solo si hoy le compartís un plan para mirar y la lista está entera.
  if (compartido.sharing.status !== 'ACTIVE' || compartido.accesses.length >= TOPE_DE_LECTURAS) return lineas;
  for (const p of compartido.professionals) {
    const id = p.professional.identityId.toLowerCase();
    if (lineas.has(id) || compartido.accesses.some((l) => mismo(l.professional.identityId, id))) continue;
    const planes = p.shares
      .filter((s) => s.level === 'SUMMARY_AND_PLAN')
      .sort((a, b) => ORDEN_DE_LAS_AREAS.indexOf(a.area) - ORDEN_DE_LAS_AREAS.indexOf(b.area))
      .map((s) => nombreDelArea(s.area));
    if (planes.length === 0) continue;
    lineas.set(id, T.todaviaNoMiro(planes.length === 1 ? T.tuPlanDe(planes[0]) : T.tusPlanesDe(enumerar(planes))));
  }
  return lineas;
}

/** La línea de una tarjeta, por el identificador del profesional (en cualquier caja). */
export const lineaDe = (lineas: ReadonlyMap<string, string>, profesionalId: string): string | null => lineas.get(profesionalId.toLowerCase()) ?? null;
