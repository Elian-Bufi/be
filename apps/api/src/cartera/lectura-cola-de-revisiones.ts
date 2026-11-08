import type { Alcance, Prisma } from '@prisma/client';
import { compararFilasDeLaCola, fechaCivil, motivoDeLaCola, type ColaDeRevisionesResponse, type DominioDeLaCola, type ItemDeLaCola, type MotivoDeLaCola } from '@be/domain';
import type { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { ZONA_POR_DEFECTO } from '../nutricion/zona';
import type { PrismaService } from '../prisma/prisma.service';
import type { ProcesoService } from '../proceso/proceso.service';
import { nombreDelPar, nombresDeAsesoradosPorPar } from '../vinculo/lectura';
import { aplicacionPosteriorA, ultimaRevisionDelProceso } from './hechos-de-revision';
import { MAXIMO_DE_ASESORADOS } from './lectura-cartera';

type Tx = Prisma.TransactionClient;

/**
 * API-DSH-02 — La cola de revisiones (09 v0.11 §14; B10-08 §6; DL-163 D-6; TB-14). Reglas de lectura:
 * - Se recorren los vínculos con alcance ACEPTADO del profesional en Nutrición y Entrenamiento (Antropometría no abre
 *   seguimiento). El PDP decide y registra por asesorado y por alcance, como en API-CAR-01; un alcance denegado no
 *   aparece ni se explica.
 * - Por seguimiento abierto, un motivo como mucho, con `motivoDeLaCola`: la definición de pendiente del dominio de
 *   revisión (REG-06-150), sin una regla nueva. Los hechos son los de los servicios de revisión.
 * - Todo en una transacción de lectura: la cola es una foto. Abrirla no escribe nada fuera de las decisiones del PDP.
 * - «Hoy» es la fecha civil en la zona por defecto de BE, la misma de la cartera.
 */
export interface ConsultaDeLaCola {
  readonly domain: DominioDeLaCola | null;
  readonly status: MotivoDeLaCola | null;
  readonly limit: number;
  readonly cursor: string | null;
}

const OPERACION = 'API-DSH-02';
const DOMINIO: Readonly<Record<'NUTRICION' | 'ENTRENAMIENTO', DominioDeLaCola>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING' };

type Fila = ItemDeLaCola & { adviseeId: string };

export async function leerColaDeRevisiones(prisma: PrismaService, pdp: PdpService, procesos: ProcesoService, actorId: string, ctx: ContextoDeSolicitud, consulta: ConsultaDeLaCola): Promise<ColaDeRevisionesResponse> {
  const hoy = fechaCivil(new Date().toISOString(), ZONA_POR_DEFECTO);

  // 1. Los vínculos vigentes del profesional en las áreas con seguimiento, agrupados por asesorado.
  const alcances = await prisma.alcanceDeVinculo.findMany({
    where: { estado: 'ACEPTADO', alcance: { in: ['NUTRICION', 'ENTRENAMIENTO'] }, vinculo: { profesionalId: actorId } },
    select: { alcance: true, vinculo: { select: { asesoradoId: true } } },
    orderBy: [{ momentoDeRegistro: 'asc' }, { id: 'asc' }],
  });
  const porAsesorado = new Map<string, Set<Alcance>>();
  for (const a of alcances) {
    if (!porAsesorado.has(a.vinculo.asesoradoId) && porAsesorado.size >= MAXIMO_DE_ASESORADOS) break;
    porAsesorado.set(a.vinculo.asesoradoId, (porAsesorado.get(a.vinculo.asesoradoId) ?? new Set()).add(a.alcance));
  }

  // 2. El PDP decide por asesorado y por alcance, y registra cada decisión.
  const permitidos: { asesoradoId: string; alcance: 'NUTRICION' | 'ENTRENAMIENTO'; relationshipId: string }[] = [];
  for (const [asesoradoId, conVinculo] of porAsesorado) {
    const decisiones = await pdp.decidirPorAlcance(OPERACION, actorId, asesoradoId, ctx);
    for (const d of decisiones.porAlcance) {
      if (!conVinculo.has(d.alcance) || (d.alcance !== 'NUTRICION' && d.alcance !== 'ENTRENAMIENTO')) continue;
      if (d.decision.permitida) permitidos.push({ asesoradoId, alcance: d.alcance, relationshipId: d.decision.alcanceDeVinculoId });
    }
  }

  // 3. Una foto: los hechos de cada seguimiento en una transacción de lectura.
  const filas = await prisma.$transaction(async (tx) => {
    const nombres = await nombresDeAsesoradosPorPar(tx, permitidos.map((p) => ({ profesionalId: actorId, asesoradoId: p.asesoradoId })));
    const salida: Fila[] = [];
    for (const p of permitidos) {
      const domain = DOMINIO[p.alcance];
      if (consulta.domain && domain !== consulta.domain) continue;
      const item = await itemDelSeguimiento(tx, procesos, actorId, p.asesoradoId, p.alcance, hoy);
      if (!item || (consulta.status && item.reason.code !== consulta.status)) continue;
      salida.push({
        ...item,
        advisee: { identityId: p.asesoradoId, displayName: nombreDelPar(nombres, { profesionalId: actorId, asesoradoId: p.asesoradoId }) },
        relationshipId: p.relationshipId,
        domain,
        adviseeId: p.asesoradoId,
      });
    }
    return salida;
  });

  const ordenadas = [...filas].sort((a, b) => compararFilasDeLaCola({ motivo: a.reason.code, desde: a.pendingSince, adviseeId: a.adviseeId, domain: a.domain }, { motivo: b.reason.code, desde: b.pendingSince, adviseeId: b.adviseeId, domain: b.domain }));
  const { pagina, page } = paginarLaCola(ordenadas, consulta.limit, consulta.cursor);
  return { data: pagina.map(({ adviseeId: _omitido, ...item }) => item), page };
}

/** Los hechos de un seguimiento y su motivo, o `null` si no está en la cola. */
async function itemDelSeguimiento(
  tx: Tx,
  procesos: ProcesoService,
  profesionalId: string,
  asesoradoId: string,
  alcance: 'NUTRICION' | 'ENTRENAMIENTO',
  hoy: string,
): Promise<Pick<ItemDeLaCola, 'pendingSince' | 'reason' | 'agreedReviewDate' | 'sourceReferences'> | null> {
  const proceso = await tx.procesoOperativo.findFirst({ where: { profesionalId, asesoradoId, alcance, estado: 'ABIERTO' }, select: { id: true } });
  if (!proceso) return null;
  const par = { profesionalId_asesoradoId: { profesionalId, asesoradoId } };
  const seleccion = { versionEfectiva: { select: { id: true, momentoDeActivacion: true } } } as const;
  const plan = alcance === 'NUTRICION' ? await tx.planNutricional.findUnique({ where: par, select: seleccion }) : await tx.planDeEntrenamiento.findUnique({ where: par, select: seleccion });
  const efectiva = plan?.versionEfectiva?.momentoDeActivacion ? { id: plan.versionEfectiva.id, activadaEn: plan.versionEfectiva.momentoDeActivacion } : null;
  const ultima = await ultimaRevisionDelProceso(tx, alcance, proceso.id);
  const expectativa = await procesos.proximaRevisionVigente(tx, proceso.id);
  const posterior = expectativa ? await aplicacionPosteriorA(tx, alcance, proceso.id, expectativa.momentoDeRegistro) : null;
  const fechaObjetivo = expectativa?.fechaObjetivo ? expectativa.fechaObjetivo.toISOString().slice(0, 10) : null;

  const motivo = motivoDeLaCola({
    procesoAbierto: true,
    planActivadoEn: efectiva ? civil(efectiva.activadaEn) : null,
    ultimaRevision: ultima ? { registradaEn: civil(ultima.momentoDeRegistro), aplicadaEn: ultima.aplicadaEn ? civil(ultima.aplicadaEn) : null } : null,
    expectativa: expectativa ? { fechaObjetivo, registradaEn: civil(expectativa.momentoDeRegistro) } : undefined,
    aplicacionPosterior: posterior ? { aplicadaEn: civil(posterior.momentoDeRegistro) } : null,
    hoy,
  });
  if (!motivo) return null;

  // Lo que se puede abrir: la revisión que espera o la que resolvió la acordada, y la versión vigente del plan.
  const fuentes: ItemDeLaCola['sourceReferences'] = [];
  if (motivo.motivo === 'NEXT_ACTION_PENDING' && ultima) fuentes.push({ type: 'REVIEW', id: ultima.id });
  if (motivo.motivo === 'ACTIVE_PLAN_WITHOUT_REVIEW' && posterior) fuentes.push({ type: 'REVIEW', id: posterior.revisionId });
  if (efectiva) fuentes.push({ type: 'PLAN_VERSION', id: efectiva.id });
  // La fecha acordada que sigue en pie: no la que una revisión aplicada ya resolvió.
  const enPie = expectativa && !posterior ? fechaObjetivo : null;
  return { pendingSince: motivo.desde, reason: { code: motivo.motivo }, agreedReviewDate: enPie, sourceReferences: fuentes };
}

const civil = (momento: Date): string => fechaCivil(momento.toISOString(), ZONA_POR_DEFECTO);

/**
 * Paginación de una lista calculada, como la de API-CAR-01: el cursor es la clave del último ítem servido (motivo,
 * área, asesorado). Si la lista cambió y la clave ya no está, 400 INVALID_CURSOR: se vuelve a pedir desde el inicio.
 */
const claveDe = (i: Fila): string => `${i.reason.code}|${i.domain}|${i.adviseeId}`;

function paginarLaCola(ordenadas: readonly Fila[], limit: number, cursor: string | null): { pagina: readonly Fila[]; page: ColaDeRevisionesResponse['page'] } {
  let desde = 0;
  if (cursor !== null) {
    const clave = Buffer.from(cursor, 'base64url').toString('utf8');
    if (!/^[A-Z_]+\|[A-Z]+\|[0-9a-f-]{36}$/.test(clave)) throw errores.cursorInvalido();
    const posicion = ordenadas.findIndex((i) => claveDe(i) === clave);
    if (posicion < 0) throw errores.cursorInvalido();
    desde = posicion + 1;
  }
  const pagina = ordenadas.slice(desde, desde + limit);
  const hasMore = desde + limit < ordenadas.length;
  const ultima = pagina[pagina.length - 1];
  return { pagina, page: { limit, nextCursor: hasMore && ultima ? Buffer.from(claveDe(ultima), 'utf8').toString('base64url') : null, hasMore } };
}
