/**
 * PLT (DL-182) · Qué edita el editor de Entrenamiento, sin React: lo guardado (el plan de una persona o la preparación
 * de una plantilla), su conversión a lo que edita el editor, lo que se compara ante un 409 (ED-61) y por qué
 * «Guardar plantilla» está apagado. Las piezas que se dibujan están en `edicion-de-plantilla.tsx`; esto lo prueba
 * `apps/web/test/plantillas-de-entrenamiento.test.mjs` con datos.
 */
import { COPY_PREPARACION_DE_PLANTILLA as P, type ImagenDeEjercicio, type PlanConObjetivos, type PlantillaDeEntrenamiento, type PreparacionDePlantilla } from '@be/domain';
import type { CuerpoDelGuardado } from '../es-lo-que-mande';
import type { Bloques } from './ejercicio-del-editor';

/** Qué edita el editor cuando edita una plantilla, y qué hace la página cuando se guarda o se descarta. */
export interface EdicionDePlantilla {
  readonly preparacionId: string;
  /** Guardada como plantilla (la primera vez) o como una versión nueva. */
  readonly onGuardada: (plantilla: PlantillaDeEntrenamiento, primera: boolean) => void;
  /** Lo preparado se descartó (o ya no estaba): el texto que se dice al volver. */
  readonly onDescartada: (texto: string) => void;
  /** «Mis plantillas»: adonde vuelve la cabecera. */
  readonly volver: string;
}

/** Lo guardado de la preparación de una plantilla, como lo lee el editor: su token y la preparación (API-TPL-09). */
export interface GuardadoDeLaPlantilla {
  readonly tipo: 'plantilla';
  readonly version: string;
  readonly preparacion: PreparacionDePlantilla;
}

/** Lo guardado que se edita: la versión en preparación del plan de una persona o la preparación de una plantilla. */
export type LoGuardado = PlanConObjetivos | GuardadoDeLaPlantilla;

export const esDelPlan = (v: LoGuardado): v is PlanConObjetivos => !('tipo' in v && v.tipo === 'plantilla');
export const comoPlan = (v: LoGuardado | null): PlanConObjetivos | null => (v && esDelPlan(v) ? v : null);
export const guardadoDeLaPlantilla = (p: PreparacionDePlantilla): GuardadoDeLaPlantilla => ({ tipo: 'plantilla', version: p.version, preparacion: p });

/** Los metadatos que viajan con la estructura: el nombre y la descripción (solo en una nueva) y el interruptor de las cargas. */
export interface MetadatosDeLaPlantilla {
  readonly nombre: string;
  readonly descripcion: string;
  readonly conCargas: boolean;
}
export const metadatosDe = (p: PreparacionDePlantilla): MetadatosDeLaPlantilla => ({ nombre: p.name, descripcion: p.description ?? '', conCargas: p.copySuggestedLoads });

/** La estructura de la preparación, en la forma que edita el editor (ya es la de entrada: con sus identificadores). */
export const bloquesDeLaPreparacion = (p: PreparacionDePlantilla): Bloques => structuredClone(p.structure.blocks) as Bloques;

/** Por versión de ejercicio: el nombre vigente, la imagen y el ejercicio del catálogo, como los da API-TPL-09. */
export function delCatalogoDeLaPreparacion(p: PreparacionDePlantilla): {
  readonly nombres: Record<string, string>;
  readonly imagenes: Record<string, ImagenDeEjercicio | null>;
  readonly ejercicios: Record<string, string>;
} {
  const e = Object.entries(p.exercises);
  return {
    nombres: Object.fromEntries(e.map(([id, x]) => [id, x.exerciseName])),
    imagenes: Object.fromEntries(e.map(([id, x]) => [id, x.image])),
    ejercicios: Object.fromEntries(e.map(([id, x]) => [id, x.exerciseId])),
  };
}

/** ED-61 en la plantilla: lo que se mandó (o quedó guardado), en la forma que se compara, con sus metadatos. */
export function cuerpoDeLaPreparacion(bloques: unknown, nueva: boolean, m: MetadatosDeLaPlantilla): CuerpoDelGuardado {
  return { estructura: bloques, proximaRevision: null, objetivo: null, metadatos: { ...(nueva ? { nombre: m.nombre.trim(), descripcion: m.descripcion.trim() } : {}), conCargas: m.conCargas } };
}

/** Lo que impide guardar, en palabras: los problemas propios de la plantilla, o el texto del editor para lo demás. */
export const textoDelProblemaDeLaPlantilla = (codigo: string): string | null => P.problema[codigo] ?? null;


/** Por qué el principal está apagado, o `null`: el mismo orden que «Antes de activar», sin la fecha de revisión. */
export function motivoParaNoGuardar(e: { readonly conflicto: boolean; readonly revisando: boolean; readonly sinGuardar: boolean; readonly impiden: number; readonly sinRevisar: boolean }): string | null {
  if (e.conflicto) return P.falta([P.cargarLaGuardada]);
  if (e.revisando) return P.revisando;
  const partes = [...(e.sinGuardar ? [P.guardarLosCambios] : []), ...(e.impiden > 0 ? [P.corregir(e.impiden)] : []), ...(!e.sinGuardar && e.sinRevisar ? [P.revisarDeNuevo] : [])];
  return partes.length > 0 ? P.falta(partes) : null;
}

