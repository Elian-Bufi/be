/**
 * La autorización de la historia anterior en la base (DL-175; migración 20261115120000): sus versiones por componente de
 * vínculo, el cerrojo que ordena cada cambio con cada lectura, lo que ve la persona (API-HIA-01) y los retiros que no pide
 * ella con el interruptor (revocar el B2 de ese componente, cerrar la cuenta). Sin reglas de negocio propias: las decide
 * `historia-anterior.ts` de @be/domain.
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
import { Prisma, type AutorizacionDeHistoriaAnterior } from '@prisma/client';
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
 * exclusivo para escribir la autorización (darla, retirarla, revocar el B2, cerrar la cuenta). Se toma **al final**,
 * después del componente, el A3 y el PDP, como el de los hábitos y el de lo de otras áreas: un retiro queda antes o
 * después de cada lectura, nunca en el medio.
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

/**
 * El componente de la persona, tomado en modo compartido (`FOR SHARE`), o `null` si no es suyo o no existe. Es el primer
 * cerrojo de autorizar y de retirar, en el lugar del componente en el orden único (antes del A3 y del cerrojo de la
 * historia): quien lo termina o le revoca el B2 lo toma `FOR NO KEY UPDATE`, así que una autorización y un cierre del
 * componente quedan uno antes que el otro, nunca a la vez (una VIGENTE no queda sobre un componente terminado).
 */
export async function componenteTomado(
  tx: Tx,
  personaId: string,
  relationshipId: string,
): Promise<{ readonly id: string; readonly alcance: Alcance; readonly estado: ComponenteDeLaPersona['estado']; readonly profesionalId: string } | null> {
  const [fila] = await tx.$queryRaw<{ id: string; alcance: Alcance; estado: ComponenteDeLaPersona['estado']; profesionalId: string }[]>`
    SELECT av."id"::text AS "id", av."alcance"::text AS "alcance", av."estado"::text AS "estado", v."profesional_id"::text AS "profesionalId"
      FROM "alcance_de_vinculo" av JOIN "vinculo" v ON v."id" = av."vinculo_id"
     WHERE av."id" = ${relationshipId}::uuid AND v."asesorado_id" = ${personaId}::uuid
       FOR SHARE OF av`;
  return fila ?? null;
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

/** Retira la última versión de cada componente que la tenga VIGENTE, con la hora de la base ya tomado el cerrojo. */
async function retirarLasVigentes(tx: Tx, p: { readonly personaId: string; readonly procedencia: Procedencia; readonly componente: string | null }): Promise<number> {
  await tomarLaHistoriaAnterior(tx, p.personaId, 'escribir');
  const filas = await tx.autorizacionDeHistoriaAnterior.findMany({
    where: { asesoradoId: p.personaId, ...(p.componente ? { alcanceDeVinculoId: p.componente } : {}) },
    orderBy: [{ alcanceDeVinculoId: 'asc' }, { version: 'asc' }],
  });
  const porComponente = new Map<string, AutorizacionDeHistoriaAnterior[]>();
  for (const f of filas) porComponente.set(f.alcanceDeVinculoId, [...(porComponente.get(f.alcanceDeVinculoId) ?? []), f]);
  const vigentes = [...porComponente.values()].map((versiones) => ultimaVersion(versiones)).filter((u): u is AutorizacionDeHistoriaAnterior => u?.estado === 'VIGENTE');
  if (vigentes.length === 0) return 0;
  // La hora del retiro es la de la base con el cerrojo ya tomado (prisma/concurrencia.ts): una lectura que estaba en curso
  // terminó antes, y su decisión queda antes que el retiro también en el tiempo.
  const momento = await momentoDeLaBase(tx);
  for (const ultima of vigentes) {
    await agregarVersion(tx, { componente: { id: ultima.alcanceDeVinculoId, profesionalId: ultima.profesionalId, alcance: ultima.alcance }, personaId: p.personaId, anterior: ultima, estado: 'RETIRADA', procedencia: p.procedencia, momento });
  }
  return vigentes.length;
}

/**
 * Cerrar la cuenta retira cada autorización vigente de la persona: en la transacción del cierre, una versión RETIRADA por
 * componente cuya última está VIGENTE. El actor es la persona, que cerró su cuenta. Devuelve cuántas retiró.
 */
export function retirarHistoriaAnteriorPorCierre(tx: Tx, p: { readonly personaId: string; readonly procedencia: Procedencia }): Promise<number> {
  return retirarLasVigentes(tx, { ...p, componente: null });
}

/**
 * HA-T14 · revocar el B2 de un componente (API-CON-04) retira, en la misma transacción, la autorización de la historia
 * anterior de ese componente si estaba VIGENTE. El 08 §14.1 la ata «al alcance del nuevo consentimiento»: un B2 otorgado de
 * nuevo (API-CON-02, OtorgarNuevamente) no dice nada de la historia, así que no la devuelve sola; la persona la vuelve a
 * compartir si quiere. Se llama con el componente y el consentimiento ya tomados, y el cerrojo de la historia va al final.
 */
export function retirarHistoriaAnteriorPorRevocacion(tx: Tx, p: { readonly personaId: string; readonly alcanceDeVinculoId: string; readonly procedencia: Procedencia }): Promise<number> {
  return retirarLasVigentes(tx, { personaId: p.personaId, procedencia: p.procedencia, componente: p.alcanceDeVinculoId });
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

/**
 * Las dos lecturas de `decision_de_acceso` que hace API-HIA-01 (y la respuesta de 02 y 03), en SQL con la operación y el
 * resultado **escritos como constantes**: así coinciden con el predicado del índice parcial
 * `decision_de_acceso_lecturas_de_la_historia_anterior` (migración 20261115120000) aunque el plan sea genérico, y no
 * recorren la tabla de todas las decisiones de BE. TEST-HA-034 mira el plan de cada una.
 */
export const consultasDeLasLecturas = {
  /** Las lecturas de la persona, de la más nueva a la más vieja, hasta `tope`. */
  recientes: (personaId: string, tope: number): Prisma.Sql => Prisma.sql`
    SELECT "actor_id"::text AS "actorId", "alcance"::text AS "alcance", "momento_de_ocurrencia" AS "momento"
      FROM "decision_de_acceso"
     WHERE "sujeto_id" = ${personaId}::uuid AND "operacion" = 'API-HIA-04' AND "resultado" = 'PERMITIDA'
       AND "recurso_tipo" = ${RECURSO_DE_LA_HISTORIA_ANTERIOR}
     ORDER BY "secuencia" DESC
     LIMIT ${tope}`,
  /**
   * La última lectura **por componente de vínculo** (la decisión permitida del PDP guarda el suyo): la de un vínculo
   * anterior con el mismo profesional no se muestra debajo del componente nuevo, que nunca la autorizó.
   */
  ultimaPorComponente: (personaId: string): Prisma.Sql => Prisma.sql`
    SELECT "alcance_de_vinculo_id"::text AS "componente", max("momento_de_ocurrencia") AS "ultima"
      FROM "decision_de_acceso"
     WHERE "sujeto_id" = ${personaId}::uuid AND "operacion" = 'API-HIA-04' AND "resultado" = 'PERMITIDA'
       AND "recurso_tipo" = ${RECURSO_DE_LA_HISTORIA_ANTERIOR} AND "alcance_de_vinculo_id" IS NOT NULL
     GROUP BY "alcance_de_vinculo_id"`,
};

/** Si hoy el profesional de un componente ve los datos de su área (el PDP, sin registrar): lo da el servicio. */
export type AccesoDeHoy = (c: ComponenteDeLaPersona) => Promise<boolean>;

/**
 * API-HIA-01 y la respuesta de 02 y 03: por cada componente sin terminar de la persona (y por cada terminado con el que la
 * miraron, para que siga viendo cuándo), el profesional, si hubo otro antes en esa área, qué vería, la última versión de
 * su autorización, si hoy tiene acceso a esa área y la última vez que la miró con ese componente. `solo` acota a un
 * componente, cualquiera sea su estado (la respuesta de un retiro sobre un vínculo ya terminado).
 */
export async function estadoDeLaPersona(tx: Tx, personaId: string, accesoDeHoy: AccesoDeHoy, solo: string | null = null): Promise<MiHistoriaAnteriorResponse['data']> {
  const [componentes, ultimas, recientes] = await Promise.all([
    componentesDeLaPersona(tx, personaId),
    tx.$queryRaw<{ componente: string; ultima: Date }[]>(consultasDeLasLecturas.ultimaPorComponente(personaId)),
    solo === null ? tx.$queryRaw<{ actorId: string; alcance: Alcance; momento: Date }[]>(consultasDeLasLecturas.recientes(personaId, LECTURAS_DE_LA_HISTORIA_ANTERIOR)) : Promise.resolve([]),
  ]);
  const leida = new Map(ultimas.map((u) => [u.componente, u.ultima] as const));
  const actuales = componentes.filter((c) => (solo === null ? c.estado !== 'FINALIZADO' || leida.has(c.id) : c.id === solo));
  const [autorizaciones, accesos, nombres] = await Promise.all([
    tx.autorizacionDeHistoriaAnterior.findMany({ where: { asesoradoId: personaId, alcanceDeVinculoId: { in: actuales.map((c) => c.id) } }, orderBy: { version: 'asc' } }),
    // Solo un componente aceptado puede tener acceso hoy; en pausa o terminado, no (el PDP diría lo mismo).
    Promise.all(actuales.map((c) => (c.estado === 'ACEPTADO' ? accesoDeHoy(c) : Promise.resolve(false)))),
    nombresDe(tx, [...actuales.map((c) => c.profesionalId), ...recientes.map((l) => l.actorId)]),
  ]);
  const todos = componentes.map((c) => ({ profesionalId: c.profesionalId, alcance: c.alcance, inicio: c.inicio.toISOString() }));
  const items: HistoriaAnteriorDeUnArea[] = actuales
    .map((c, i) => {
      const ultima = ultimaVersion(autorizaciones.filter((a) => a.alcanceDeVinculoId === c.id));
      return {
        relationshipId: c.id,
        area: c.alcance,
        professional: { identityId: c.profesionalId, displayName: nombres.get(c.profesionalId) as string },
        relationshipState: c.estado,
        hadEarlierProfessional: huboOtroAntes({ profesionalId: c.profesionalId, alcance: c.alcance, inicio: c.inicio.toISOString() }, todos),
        includes: [...LO_QUE_ENTRA[c.alcance]],
        authorization: ultima ? { state: ultima.estado === 'VIGENTE' ? ('GRANTED' as const) : ('WITHDRAWN' as const), version: token(ultima.version), since: ultima.momentoDeOcurrencia.toISOString() } : null,
        accessInEffect: accesos[i] as boolean,
        lastReadAt: leida.get(c.id)?.toISOString() ?? null,
      };
    })
    .sort((a, b) => ALCANCES.indexOf(a.area) - ALCANCES.indexOf(b.area) || a.professional.displayName.localeCompare(b.professional.displayName, 'es'));
  return {
    text: textoApi(),
    items,
    accesses: recientes.map((l) => ({ professional: { identityId: l.actorId, displayName: nombres.get(l.actorId) as string }, area: l.alcance, readAt: l.momento.toISOString() })),
  };
}
