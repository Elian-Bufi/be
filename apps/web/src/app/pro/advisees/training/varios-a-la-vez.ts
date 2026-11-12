/**
 * ED-21 (WP-EDITORES-PROFESIONAL) · Elegir varios ejercicios a la vez, sin React. Se marcan en el buscador (del catálogo,
 * de los habituales o creados a mano) y entran a la sesión con un solo «Agregar», en el orden en que se marcaron. Nada
 * entra antes de «Agregar» (TEST-EDP-022). La prescripción opcional para todos es la línea de ED-22: con ella, cada uno
 * nace con esos valores; sin ella, con una serie sin repeticiones ni criterio, como hoy.
 */
import { aplicarPrescripcion, type EjercicioDeCatalogo, type EstructuraDePlanDeEntrenamientoEntrada, type PrescripcionLeida } from '@be/domain';

type PrescripcionEntrada = NonNullable<EstructuraDePlanDeEntrenamientoEntrada['blocks'][number]['sessions']>[number]['prescriptions'][number];

/** Marca o desmarca: lo marcado va al final; desmarcar no cambia el orden de los demás. */
export function alternarMarcado(marcados: readonly EjercicioDeCatalogo[], e: EjercicioDeCatalogo): readonly EjercicioDeCatalogo[] {
  return marcados.some((m) => m.versionId === e.versionId) ? marcados.filter((m) => m.versionId !== e.versionId) : [...marcados, e];
}

/** Lo que entra a la sesión con «Agregar», en el orden marcado. */
export function prescripcionesDeLosMarcados(marcados: readonly EjercicioDeCatalogo[], leida: PrescripcionLeida | null): PrescripcionEntrada[] {
  return marcados.map((e) => {
    const base: PrescripcionEntrada = { exerciseVersionId: e.versionId, sets: [{ repetitions: null }], intensity: null };
    return leida ? aplicarPrescripcion(base, leida).prescripcion : base;
  });
}

/** «Fuerza · Semana 1 · Piernas A» → «Piernas A»: el nombre de la sesión, para el botón. */
export const sesionDeDonde = (deDonde: string | null): string | null => deDonde?.split(' · ').at(-1) ?? null;

export const COPY_VARIOS_A_LA_VEZ = {
  marcar: (nombre: string) => `Marcar ${nombre}`,
  agregar: (n: number, sesion: string | null) => (n === 0 ? 'Agregar' : `Agregar ${n} a ${sesion ?? 'la sesión'}`),
  sinMarcados: 'Marcá uno o más ejercicios: entran juntos, en el orden en que los marcaste.',
  marcados: (n: number) => (n === 1 ? '1 marcado' : `${n} marcados`),
  prescripcionParaTodos: 'Prescripción para todos (opcional)',
  prescripcionAyuda: 'Por ejemplo «4×8-12 RIR 2 · 90 s». Vacía, cada uno entra con una serie para completar.',
  creadoYMarcado: (nombre: string) => `${nombre}: creado y marcado.`,
} as const;
