import { CodigoDeError, PLANTILLAS_DE_BE, type EjercicioResuelto, type EstadoDePlantillaDeBe, type PlantillaDeBe } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { ErrorDeApi, errores } from '../http/errores';

type Cliente = Pick<Prisma.TransactionClient, 'itemExternoDeCatalogo' | 'decisionSobrePlantillaDeBe'>;

/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-01 a ET3-06) · las piezas de las Plantillas de BE que comparten el
 * profesional (API-TPB-01 y 02) y Administración (API-TPB-03 y 04):
 * - **el catálogo de este entorno:** cada número de wger de la plantilla, al ejercicio que lo representa (su ítem externo,
 *   DL-141 D-1: el del catálogo base o el que importó un profesional antes) y a su versión vigente disponible;
 * - **el estado:** la última decisión de Administración por clave; sin ninguna, se ofrece (ET3-D01).
 */
export async function catalogoDeLasPlantillasDeBe(cliente: Cliente, plantillas: readonly PlantillaDeBe[] = PLANTILLAS_DE_BE): Promise<Map<string, EjercicioResuelto>> {
  const wger = [...new Set(plantillas.flatMap((p) => p.fases.flatMap((f) => f.sesiones.flatMap((s) => s.ejercicios.map((e) => e.wger)))))];
  if (wger.length === 0) return new Map();
  const filas = await cliente.itemExternoDeCatalogo.findMany({
    where: { proveedor: 'WGER', idExterno: { in: wger }, ejercicioId: { not: null } },
    select: { idExterno: true, ejercicio: { select: { id: true, versiones: { orderBy: { momentoDeRegistro: 'desc' }, take: 1, select: { id: true, nombre: true, disponibilidad: true } } } } },
  });
  const m = new Map<string, EjercicioResuelto>();
  for (const f of filas) {
    const v = f.ejercicio?.versiones[0];
    if (f.ejercicio && v && v.disponibilidad === 'DISPONIBLE') m.set(f.idExterno, { exerciseId: f.ejercicio.id, exerciseVersionId: v.id, nombre: v.nombre });
  }
  return m;
}

export interface DecisionLeida {
  readonly estado: EstadoDePlantillaDeBe;
  readonly motivo: string | null;
  readonly momento: Date;
  readonly administradorId: string;
}

/** Las decisiones de Administración por clave, de la más nueva a la más vieja. */
export async function decisionesSobreLasPlantillasDeBe(cliente: Cliente): Promise<Map<string, DecisionLeida[]>> {
  const filas = await cliente.decisionSobrePlantillaDeBe.findMany({ orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }] });
  const m = new Map<string, DecisionLeida[]>();
  for (const f of filas) {
    const lista = m.get(f.clave) ?? [];
    lista.push({ estado: f.estado === 'RETIRADA' ? 'WITHDRAWN' : 'PUBLISHED', motivo: f.motivo, momento: f.momentoDeRegistro, administradorId: f.administradorId });
    m.set(f.clave, lista);
  }
  return m;
}

/** El estado vigente de una clave: la última decisión, o publicada si no hay ninguna. */
export const estadoVigente = (decisiones: ReadonlyMap<string, readonly DecisionLeida[]>, clave: string): EstadoDePlantillaDeBe => decisiones.get(clave)?.[0]?.estado ?? 'PUBLISHED';

/**
 * La plantilla que se pide aplicar (API-TPB-02): la de esa clave y versión. Una clave que no existe es el 404 de lo
 * inexistente; otra versión que la vigente, 409 (la pantalla vuelve a leer); una retirada, 422 TEMPLATE_ARCHIVED.
 */
export async function plantillaDeBeParaAplicar(cliente: Cliente, clave: string, version: number): Promise<PlantillaDeBe> {
  const deLaClave = PLANTILLAS_DE_BE.filter((p) => p.clave === clave);
  if (deLaClave.length === 0) throw errores.recursoNoEncontrado();
  const vigente = deLaClave.reduce((a, b) => (b.version > a.version ? b : a));
  if (vigente.version !== version) {
    throw new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'Esa plantilla de BE cambió desde que la viste. Volvé a mirarla.', { currentVersion: vigente.version }, 'BE_TEMPLATE_VERSION_CHANGED');
  }
  if (estadoVigente(await decisionesSobreLasPlantillasDeBe(cliente), clave) === 'WITHDRAWN') {
    throw new ErrorDeApi(422, CodigoDeError.TEMPLATE_ARCHIVED, 'Administración retiró esa plantilla de BE: ya no se aplica.');
  }
  return vigente;
}

/** Las versiones vigentes de cada clave (las que se ofrecen y administran). */
export const plantillasDeBeVigentes = (): PlantillaDeBe[] => {
  const m = new Map<string, PlantillaDeBe>();
  for (const p of PLANTILLAS_DE_BE) if (!m.has(p.clave) || m.get(p.clave)!.version < p.version) m.set(p.clave, p);
  return [...m.values()];
};
