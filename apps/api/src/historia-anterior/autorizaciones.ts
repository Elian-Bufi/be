/**
 * La autorización de la historia anterior en la base (DL-175; migración 20261115120000): sus versiones por componente de
 * vínculo, el cerrojo que ordena cada cambio con cada lectura, lo que ve la persona (API-HIA-01) y el retiro al cerrar la
 * cuenta. Sin reglas de negocio propias: las decide `historia-anterior.ts` de @be/domain.
 */
import {
  ALCANCES,
  LO_QUE_ENTRA,
  TEXTO_DE_LA_HISTORIA_ANTERIOR,
  huboOtroAntes,
  ultimaVersion,
  type Alcance,
  type HistoriaAnteriorDeUnArea,
  type MiHistoriaAnteriorResponse,
  type Procedencia,
} from '@be/domain';
import type { AutorizacionDeHistoriaAnterior, Prisma } from '@prisma/client';
import { momentoDeLaBase } from '../prisma/concurrencia';

type Tx = Prisma.TransactionClient;

/** El tipo de recurso con que API-HIA-04 registra cada lectura en `decision_de_acceso`: lo que la persona ve. */
export const RECURSO_DE_LA_HISTORIA_ANTERIOR = 'HistoriaAnterior';
export const RECURSO_DE_LA_AUTORIZACION = 'AutorizacionDeHistoriaAnterior';
/** Cuántas lecturas devuelve API-HIA-01, como mucho: las más recientes. */
export const LECTURAS_DE_LA_HISTORIA_ANTERIOR = 50;

/** La hora de la base para una escritura, tomada después de los cerrojos. */
export const momentoDeLaHistoriaAnterior = momentoDeLaBase;

/**
 * El cerrojo de transacción por persona (prisma/concurrencia.ts): compartido para leer la historia (API-HIA-04) y
 * exclusivo para escribir la autorización (darla, retirarla, cerrar la cuenta). Se toma **al final**, después del A3 y del
 * PDP, como el de los hábitos y el de lo de otras áreas: un retiro queda antes o después de cada lectura, nunca en el medio.
 */
export async function tomarLaHistoriaAnterior(tx: Tx, personaId: string, modo: 'escribir' | 'leer'): Promise<void> {
  const clave = `historia-anterior|${personaId}`;
  if (modo === 'escribir') await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${clave}, 0))`;
  else await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(hashtextextended(${clave}, 0))`;
}

export const token = (n: number): string => `v${n}`;

/** Cuándo empezó un componente de vínculo: su aceptación (o su registro, si no la tiene). */
export const inicioDe = (c: { readonly momentoDeOcurrencia: Date | null; readonly momentoDeRegistro: Date }): Date => c.momentoDeOcurrencia ?? c.momentoDeRegistro;

export interface ComponenteDeLaPersona {
  readonly id: string;
  readonly profesionalId: string;
  readonly alcance: Alcance;
  readonly estado: 'ACEPTADO' | 'PAUSADO' | 'FINALIZADO';
  readonly inicio: Date;
}

/** Todos los componentes de vínculo de la persona, terminados incluidos (para saber si hubo otro antes). */
export async function componentesDeLaPersona(tx: Tx, personaId: string): Promise<ComponenteDeLaPersona[]> {
  const filas = await tx.alcanceDeVinculo.findMany({
    where: { vinculo: { asesoradoId: personaId } },
    select: { id: true, alcance: true, estado: true, momentoDeOcurrencia: true, momentoDeRegistro: true, vinculo: { select: { profesionalId: true } } },
    orderBy: [{ momentoDeRegistro: 'asc' }, { id: 'asc' }],
  });
  return filas.map((f) => ({ id: f.id, profesionalId: f.vinculo.profesionalId, alcance: f.alcance, estado: f.estado, inicio: inicioDe(f) }));
}

/** Las versiones de la autorización de un componente, de la primera a la última. */
export function versionesDelComponente(tx: Tx, alcanceDeVinculoId: string): Promise<AutorizacionDeHistoriaAnterior[]> {
  return tx.autorizacionDeHistoriaAnterior.findMany({ where: { alcanceDeVinculoId }, orderBy: { version: 'asc' } });
}

/** Una versión nueva, que sucede a la última del componente (la base lo exige). VIGENTE lleva el texto vigente y su hash. */
export function agregarVersion(
  tx: Tx,
  p: { readonly componente: Pick<ComponenteDeLaPersona, 'id' | 'profesionalId' | 'alcance'>; readonly personaId: string; readonly anterior: AutorizacionDeHistoriaAnterior | null; readonly estado: 'VIGENTE' | 'RETIRADA'; readonly procedencia: Procedencia; readonly momento: Date },
): Promise<AutorizacionDeHistoriaAnterior> {
  const vigente = p.estado === 'VIGENTE';
  return tx.autorizacionDeHistoriaAnterior.create({
    data: {
      asesoradoId: p.personaId,
      profesionalId: p.componente.profesionalId,
      alcance: p.componente.alcance,
      alcanceDeVinculoId: p.componente.id,
      version: (p.anterior?.version ?? 0) + 1,
      predecesoraId: p.anterior?.id ?? null,
      estado: p.estado,
      textoId: vigente ? TEXTO_DE_LA_HISTORIA_ANTERIOR.id : null,
      hashDelTexto: vigente ? TEXTO_DE_LA_HISTORIA_ANTERIOR.hash : null,
      actorId: p.personaId,
      procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      momentoDeOcurrencia: p.momento,
    },
  });
}

/**
 * Cerrar la cuenta retira cada autorización vigente de la persona: en la transacción del cierre, una versión RETIRADA por
 * componente cuya última está VIGENTE. El actor es la persona, que cerró su cuenta. Devuelve cuántas retiró.
 */
export async function retirarHistoriaAnteriorPorCierre(tx: Tx, p: { readonly personaId: string; readonly procedencia: Procedencia; readonly momento: Date }): Promise<number> {
  await tomarLaHistoriaAnterior(tx, p.personaId, 'escribir');
  const filas = await tx.autorizacionDeHistoriaAnterior.findMany({ where: { asesoradoId: p.personaId }, orderBy: [{ alcanceDeVinculoId: 'asc' }, { version: 'asc' }] });
  const porComponente = new Map<string, AutorizacionDeHistoriaAnterior[]>();
  for (const f of filas) porComponente.set(f.alcanceDeVinculoId, [...(porComponente.get(f.alcanceDeVinculoId) ?? []), f]);
  let retiradas = 0;
  for (const versiones of porComponente.values()) {
    const ultima = ultimaVersion(versiones);
    if (!ultima || ultima.estado !== 'VIGENTE') continue;
    await agregarVersion(tx, { componente: { id: ultima.alcanceDeVinculoId, profesionalId: ultima.profesionalId, alcance: ultima.alcance }, personaId: p.personaId, anterior: ultima, estado: 'RETIRADA', procedencia: p.procedencia, momento: p.momento });
    retiradas += 1;
  }
  return retiradas;
}

/** Los nombres visibles de varios profesionales, en una consulta. Sin perfil, «Profesional». */
export async function nombresDe(tx: Tx, ids: readonly string[]): Promise<ReadonlyMap<string, string>> {
  if (ids.length === 0) return new Map();
  const perfiles = await tx.perfilProfesional.findMany({ where: { identidadId: { in: [...new Set(ids)] } }, select: { identidadId: true, nombreVisible: true } });
  const nombres = new Map(perfiles.map((p) => [p.identidadId, p.nombreVisible ?? 'Profesional'] as const));
  return new Map(ids.map((id) => [id, nombres.get(id) ?? 'Profesional'] as const));
}

/** El texto del acto, como lo muestra la app (hoy, una propuesta). */
export const textoApi = (): MiHistoriaAnteriorResponse['data']['text'] => ({
  id: TEXTO_DE_LA_HISTORIA_ANTERIOR.id,
  title: TEXTO_DE_LA_HISTORIA_ANTERIOR.titulo,
  text: TEXTO_DE_LA_HISTORIA_ANTERIOR.texto,
  textHash: TEXTO_DE_LA_HISTORIA_ANTERIOR.hash,
  effectiveFrom: TEXTO_DE_LA_HISTORIA_ANTERIOR.vigenteDesde,
  approval: TEXTO_DE_LA_HISTORIA_ANTERIOR.propuesta ? 'PENDING_APPROVAL' : 'APPROVED',
});

/** Las lecturas de la historia anterior de la persona: decisiones PERMITIDAS de API-HIA-04, las más recientes primero. */
async function lecturas(tx: Tx, personaId: string, tope: number) {
  return tx.decisionDeAcceso.findMany({
    where: { sujetoId: personaId, operacion: 'API-HIA-04', resultado: 'PERMITIDA', recursoTipo: RECURSO_DE_LA_HISTORIA_ANTERIOR },
    orderBy: { secuencia: 'desc' },
    take: tope,
    select: { actorId: true, alcance: true, momentoDeOcurrencia: true },
  });
}

/**
 * API-HIA-01 y la respuesta de 02 y 03: por cada componente sin terminar de la persona, el profesional, si hubo otro antes
 * en esa área, qué vería, la última versión de su autorización y la última vez que la miró. `solo` acota a un componente,
 * cualquiera sea su estado (la respuesta de un retiro sobre un vínculo ya terminado).
 */
export async function estadoDeLaPersona(tx: Tx, personaId: string, solo: string | null = null): Promise<MiHistoriaAnteriorResponse['data']> {
  const componentes = await componentesDeLaPersona(tx, personaId);
  const actuales = componentes.filter((c) => (solo === null ? c.estado !== 'FINALIZADO' : c.id === solo));
  const [autorizaciones, ultimas, recientes] = await Promise.all([
    tx.autorizacionDeHistoriaAnterior.findMany({ where: { asesoradoId: personaId, alcanceDeVinculoId: { in: actuales.map((c) => c.id) } }, orderBy: { version: 'asc' } }),
    tx.decisionDeAcceso.groupBy({
      by: ['actorId', 'alcance'],
      where: { sujetoId: personaId, operacion: 'API-HIA-04', resultado: 'PERMITIDA', recursoTipo: RECURSO_DE_LA_HISTORIA_ANTERIOR },
      _max: { momentoDeOcurrencia: true },
    }),
    solo === null ? lecturas(tx, personaId, LECTURAS_DE_LA_HISTORIA_ANTERIOR) : Promise.resolve([]),
  ]);
  const nombres = await nombresDe(tx, [...actuales.map((c) => c.profesionalId), ...recientes.map((l) => l.actorId)]);
  const todos = componentes.map((c) => ({ profesionalId: c.profesionalId, alcance: c.alcance, inicio: c.inicio.toISOString() }));
  const items: HistoriaAnteriorDeUnArea[] = actuales
    .map((c) => {
      const ultima = ultimaVersion(autorizaciones.filter((a) => a.alcanceDeVinculoId === c.id));
      const leida = ultimas.find((u) => u.actorId === c.profesionalId && u.alcance === c.alcance)?._max.momentoDeOcurrencia ?? null;
      return {
        relationshipId: c.id,
        area: c.alcance,
        professional: { identityId: c.profesionalId, displayName: nombres.get(c.profesionalId) as string },
        relationshipState: c.estado,
        hadEarlierProfessional: huboOtroAntes({ profesionalId: c.profesionalId, alcance: c.alcance, inicio: c.inicio.toISOString() }, todos),
        includes: [...LO_QUE_ENTRA[c.alcance]],
        authorization: ultima ? { state: ultima.estado === 'VIGENTE' ? ('GRANTED' as const) : ('WITHDRAWN' as const), version: token(ultima.version), since: ultima.momentoDeOcurrencia.toISOString() } : null,
        lastReadAt: leida?.toISOString() ?? null,
      };
    })
    .sort((a, b) => ALCANCES.indexOf(a.area) - ALCANCES.indexOf(b.area) || a.professional.displayName.localeCompare(b.professional.displayName, 'es'));
  return {
    text: textoApi(),
    items,
    accesses: recientes.map((l) => ({ professional: { identityId: l.actorId, displayName: nombres.get(l.actorId) as string }, area: l.alcance, readAt: l.momentoDeOcurrencia.toISOString() })),
  };
}
