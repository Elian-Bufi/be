import type { EjecucionDeEntrenamiento, RegistroDeComida, VigenciaDePlan } from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { EjecucionesDeEntrenamientoService } from '../entrenamiento/ejecuciones.service';
import { INCLUIR_REGISTRO, registrosApi } from '../nutricion/lectura-registro';
import { ZONA_POR_DEFECTO, fechaLocalEn } from '../nutricion/zona';

type Tx = Prisma.TransactionClient;

/**
 * Las lecturas que comparten la línea de tiempo (API-DSH-04) y las proyecciones (API-PRJ-01). Todas están acotadas al
 * **profesional que consulta**: sus planes, sus procesos y sus evaluaciones con este asesorado, como API-DSH-03. Lo de
 * otro profesional no se lee ni se cuenta. Las llama el controlador solo para los alcances que el PDP permitió.
 *
 * Reutilizan los modelos de lectura de cada dominio (`registrosApi`, `ejecucionApi`) para que el entorno profesional y
 * las pestañas de dominio digan lo mismo del mismo registro.
 */

/** La zona del asesorado: el perfil no tiene una aprobada y rige la de la demo (DL-009). */
export const ZONA = ZONA_POR_DEFECTO;

const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);
export const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);

export type AlcanceDelAnalisis = 'NUTRICION' | 'ENTRENAMIENTO';

export interface VersionActivada {
  readonly id: string;
  readonly numero: number;
  readonly predecesoraId: string | null;
  readonly activadaEl: Date;
  readonly autorId: string;
  /** El día en que empezó a regir, en la zona del asesorado. */
  readonly desde: string;
  /** El día del corte (activación de la sucesora o cierre del seguimiento), que ya es de la siguiente; `null` si sigue. */
  readonly hasta: string | null;
}

/**
 * Las versiones ACTIVADAS del plan de este profesional con este asesorado, con su vigencia: rige desde su activación
 * hasta que se activa su sucesora o se cierra el seguimiento (06:4297), lo que ocurra primero. La fecha de creación no
 * es vigencia y una activación no es ejecución (encargo §10).
 */
export async function versionesActivadas(tx: Tx, alcance: AlcanceDelAnalisis, profesionalId: string, asesoradoId: string): Promise<VersionActivada[]> {
  const seleccion = { id: true, version: true, predecesoraId: true, momentoDeActivacion: true, autorId: true } as const;
  const filas =
    alcance === 'NUTRICION'
      ? await tx.versionDePlanNutricional.findMany({ where: { plan: { profesionalId, asesoradoId }, estado: 'ACTIVADA' }, select: seleccion, orderBy: [{ momentoDeActivacion: 'asc' }, { id: 'asc' }] })
      : await tx.versionDePlanDeEntrenamiento.findMany({ where: { plan: { profesionalId, asesoradoId }, estado: 'ACTIVADA' }, select: seleccion, orderBy: [{ momentoDeActivacion: 'asc' }, { id: 'asc' }] });
  const cierres = (await tx.procesoOperativo.findMany({ where: { profesionalId, asesoradoId, alcance, estado: 'CERRADO' }, select: { momentoDeCierre: true } }))
    .flatMap((p) => (p.momentoDeCierre ? [p.momentoDeCierre] : []))
    .sort((a, b) => a.getTime() - b.getTime());
  return filas
    .filter((v) => v.momentoDeActivacion !== null)
    .map((v) => {
      const activadaEl = v.momentoDeActivacion as Date;
      const sucesora = filas.find((s) => s.predecesoraId === v.id)?.momentoDeActivacion ?? null;
      const cierre = cierres.find((c) => c > activadaEl) ?? null;
      const corte = [sucesora, cierre].filter((m): m is Date => m !== null).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
      return { id: v.id, numero: v.version, predecesoraId: v.predecesoraId, activadaEl, autorId: v.autorId, desde: fechaLocalEn(activadaEl, ZONA), hasta: corte ? fechaLocalEn(corte, ZONA) : null };
    });
}

/** Las bandas de vigencia que tocan el período: contexto temporal, **no** «plan cumplido». */
export function vigenciasEnElPeriodo(versiones: readonly VersionActivada[], dominio: VigenciaDePlan['domain'], desde: string, hasta: string): VigenciaDePlan[] {
  return versiones
    .filter((v) => v.desde <= hasta && (v.hasta === null || v.hasta >= desde))
    .map((v) => ({ domain: dominio, planVersionId: v.id, label: `v${v.numero}`, activatedAt: v.activadaEl.toISOString(), from: v.desde, to: v.hasta }));
}

/**
 * Los registros de comida del período en su modelo v2 (DL-121), **con los anulados**: la línea de tiempo los muestra
 * marcados y las proyecciones los excluyen del agregado y los cuentan aparte.
 */
export async function registrosDeComidaDelPeriodo(tx: Tx, profesionalId: string, asesoradoId: string, desde: string, hasta: string): Promise<RegistroDeComida[]> {
  const filas = await tx.ingestaNutricional.findMany({
    where: { asesoradoId, versionDePlan: { plan: { profesionalId } }, fechaLocal: { gte: comoFecha(desde), lte: comoFecha(hasta) } },
    include: INCLUIR_REGISTRO,
    orderBy: [{ fechaLocal: 'asc' }, { momentoDeOcurrencia: 'asc' }, { id: 'asc' }],
  });
  return registrosApi(tx, filas);
}

/** Las sesiones **registradas** del período (el borrador no es evidencia, 09v10:980), con la forma de API-TRN-19. */
export async function ejecucionesDelPeriodo(tx: Tx, servicio: EjecucionesDeEntrenamientoService, profesionalId: string, asesoradoId: string, desde: string, hasta: string): Promise<EjecucionDeEntrenamiento[]> {
  const filas = await tx.ejecucionDeEntrenamiento.findMany({
    where: { asesoradoId, versionDePlan: { plan: { profesionalId } }, fechaLocal: { gte: comoFecha(desde), lte: comoFecha(hasta) } },
    select: { id: true },
    orderBy: [{ fechaLocal: 'asc' }, { momentoDeOcurrencia: 'asc' }, { id: 'asc' }],
  });
  // En serie: una transacción interactiva usa una sola conexión.
  const ejecuciones: EjecucionDeEntrenamiento[] = [];
  for (const f of filas) ejecuciones.push(await servicio.ejecucionApi(tx, f.id));
  return ejecuciones;
}

/**
 * Si en el período hay registros de este dominio que el profesional no ve: los de los planes de otro profesional con el
 * mismo asesorado. Existen y no se muestran, y la proyección lo dice en vez de parecer completa (como API-ANT-06,
 * 09v11:786-796). Solo un sí o un no: ni cuántos, ni de quién.
 */
export async function hayRegistrosDeOtros(tx: Tx, alcance: AlcanceDelAnalisis, profesionalId: string, asesoradoId: string, desde: string, hasta: string): Promise<boolean> {
  const donde = { asesoradoId, fechaLocal: { gte: comoFecha(desde), lte: comoFecha(hasta) }, versionDePlan: { plan: { profesionalId: { not: profesionalId } } } };
  const otros = alcance === 'NUTRICION' ? await tx.ingestaNutricional.findFirst({ where: donde, select: { id: true } }) : await tx.ejecucionDeEntrenamiento.findFirst({ where: donde, select: { id: true } });
  return otros !== null;
}

export interface VersionDeObjetivo {
  readonly id: string;
  readonly predecesoraId: string | null;
  readonly vigenteDesde: Date;
  readonly vigenteHasta: Date | null;
  readonly autorId: string;
  readonly registradaEl: Date;
  /** Nutrición: el requerimiento energético estimado; entrenamiento: el enunciado. */
  readonly requerimientoKcal: number | null;
  readonly enunciado: string | null;
}

/** Las versiones del objetivo de este profesional con este asesorado (la cadena completa; se filtra al usarla). */
export async function versionesDeObjetivo(tx: Tx, alcance: AlcanceDelAnalisis, profesionalId: string, asesoradoId: string): Promise<VersionDeObjetivo[]> {
  if (alcance === 'NUTRICION') {
    const filas = await tx.versionDeObjetivoNutricional.findMany({ where: { objetivo: { profesionalId, asesoradoId } }, orderBy: [{ vigenteDesde: 'asc' }, { id: 'asc' }] });
    return filas.map((v) => {
      const req = v.requerimientoEnergetico as { value?: unknown } | null;
      return {
        id: v.id,
        predecesoraId: v.predecesoraId,
        vigenteDesde: v.vigenteDesde,
        vigenteHasta: v.vigenteHasta,
        autorId: v.autorId,
        registradaEl: v.momentoDeRegistro,
        requerimientoKcal: typeof req?.value === 'number' && req.value > 0 ? req.value : null,
        enunciado: null,
      };
    });
  }
  const filas = await tx.versionDeObjetivoDeEntrenamiento.findMany({ where: { objetivoDeLaSerie: { profesionalId, asesoradoId } }, orderBy: [{ vigenteDesde: 'asc' }, { id: 'asc' }] });
  return filas.map((v) => {
    const s = (v.objetivo as { statement?: unknown } | null)?.statement;
    return {
      id: v.id,
      predecesoraId: v.predecesoraId,
      vigenteDesde: v.vigenteDesde,
      vigenteHasta: v.vigenteHasta,
      autorId: v.autorId,
      registradaEl: v.momentoDeRegistro,
      requerimientoKcal: null,
      enunciado: typeof s === 'string' && s.trim() ? s.trim() : null,
    };
  });
}
