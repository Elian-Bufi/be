/**
 * ED-11 (WP-EDITORES-PROFESIONAL; DJ-8) · Lo que hace un preset de prescripción sobre los ejercicios elegidos, sin
 * React: la vista previa «antes → después» fila por fila, el resumen en palabras, lo que se pierde y si basta un clic.
 *
 * - **Un clic, si solo llena lo vacío:** ningún ejercicio del alcance tiene repeticiones, criterio, carga ni descanso.
 * - **Con vista previa, si pisa algo:** a qué se aplica, qué cambia fila por fila y lo que se pierde.
 * - **«Deshacer» es la operación inversa:** las prescripciones de antes, por posición, que el editor vuelve a escribir.
 */
import { aplicarPrescripcion, COPY_PRESETS as C, type CambioDelEjercicio, type EstructuraDePlanDeEntrenamientoEntrada, type PrescripcionLeida } from '@be/domain';

type PrescripcionE = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number]['prescriptions'][number];

export interface FilaDelAlcance {
  readonly posicion: number;
  readonly nombre: string;
  readonly cambio: CambioDelEjercicio;
}

export interface AlcanceDelPreset {
  readonly filas: readonly FilaDelAlcance[];
  /** Las prescripciones nuevas, en las mismas posiciones. */
  readonly nuevas: ReadonlyMap<number, PrescripcionE>;
  /** Las de antes, para «Deshacer». */
  readonly antes: ReadonlyMap<number, PrescripcionE>;
  readonly soloLlenaLoVacio: boolean;
  readonly resumen: string;
  readonly sePierde: readonly string[];
}

/** Un ejercicio sin nada escrito: una serie a lo sumo, sin repeticiones, sin criterio, sin carga ni descanso. */
export const estaVacio = (p: PrescripcionE): boolean =>
  p.sets.length <= 1 &&
  p.sets.every((s) => s.repetitions === null && s.rir === undefined && s.suggestedLoad === undefined && s.restSeconds === undefined) &&
  p.intensity === null &&
  !p.suggestedLoad &&
  (p.restSeconds === undefined || p.restSeconds === null);

export function alcanceDelPreset(prescripciones: readonly PrescripcionE[], posiciones: readonly number[], leida: PrescripcionLeida, nombreDe: (p: PrescripcionE) => string, sesion: string): AlcanceDelPreset {
  const filas: FilaDelAlcance[] = [];
  const nuevas = new Map<number, PrescripcionE>();
  const antes = new Map<number, PrescripcionE>();
  for (const n of posiciones) {
    const p = prescripciones[n];
    if (!p) continue;
    const { prescripcion, cambio } = aplicarPrescripcion(p, leida);
    filas.push({ posicion: n, nombre: nombreDe(p), cambio });
    nuevas.set(n, prescripcion);
    antes.set(n, structuredClone(p));
  }
  const conCargas = filas.some((f) => f.cambio.carga.revisar !== null);
  const seriesAntes = [...new Set(filas.map((f) => f.cambio.series.antes))];
  const cambiaLaCantidad = filas.some((f) => f.cambio.series.antes !== f.cambio.series.despues);
  const partes = [C.seActualizan(filas.length, sesion)];
  if (conCargas) partes.push(C.lasCargasSeConservan);
  if (cambiaLaCantidad) {
    if (seriesAntes.length === 1) partes.push(C.cadaUnoPasa(seriesAntes[0]!, leida.series));
    else for (const f of filas) if (f.cambio.series.antes !== f.cambio.series.despues) partes.push(C.pasaDe(f.nombre, f.cambio.series.antes, f.cambio.series.despues));
  }
  return {
    filas,
    nuevas,
    antes,
    soloLlenaLoVacio: posiciones.every((n) => {
      const p = prescripciones[n];
      return !p || estaVacio(p);
    }),
    resumen: partes.join(' '),
    sePierde: filas.flatMap((f) => f.cambio.sePierde.map((t) => `${f.nombre}: ${t}`)),
  };
}

/** Escribe las prescripciones de un mapa por posición sobre una lista (una copia). Sirve para aplicar y para deshacer. */
export function conLasDeLaPosicion(prescripciones: readonly PrescripcionE[], porPosicion: ReadonlyMap<number, PrescripcionE>): PrescripcionE[] {
  return prescripciones.map((p, n) => structuredClone(porPosicion.get(n) ?? p));
}
