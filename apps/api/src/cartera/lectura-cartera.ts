import type { Alcance, Prisma } from '@prisma/client';
import { CLAVE_DE_DOMINIO, clasificarRevision, diaSiguiente, fechaCivil, inicioDelDia, ordenarPendientes, type CarteraResponse, type DominioDeCartera, type PendienteDeCartera, type TipoDePendiente, type VistaDeApertura } from '@be/domain';
import type { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { ZONA_POR_DEFECTO } from '../nutricion/zona';
import type { PrismaService } from '../prisma/prisma.service';
import type { ProcesoService } from '../proceso/proceso.service';
import { nombreDeAsesorado } from '../vinculo/lectura';

type Tx = Prisma.TransactionClient;

/**
 * API-CAR-01 — Cartera del profesional (PF-07, propuesta; DL-107). Hasta DL-116 se llamó API-DSH-04, que en el 09 es la
 * línea temporal: las decisiones de acceso registradas antes conservan ese nombre. Reglas de lectura:
 * - Se recorren los vínculos con alcance ACEPTADO del profesional. Por asesorado, el PDP decide y registra por alcance
 *   igual que en API-DSH-03; solo los alcances permitidos aportan pendientes, y un alcance con vínculo aceptado que el
 *   PDP deniega (A3 revocado, cuenta suspendida) deja `partialView` en `true` sin decir por qué (B10-08 §8.4).
 * - Todos los hechos se leen en **una** transacción: la cartera es una foto, no cincuenta fotos.
 * - Los pendientes salen de datos existentes: la expectativa de revisión vigente del Proceso abierto (terminal de la
 *   cadena, REG-06-146), la versión BORRADOR posterior a la activada, la ausencia de Proceso abierto, la solicitud de
 *   formulario sin respuesta y la evaluación antropométrica en preparación. La actividad registrada en el período es
 *   un dato del ítem, nunca un ítem (D-3 de la ficha).
 * - «Hoy» es la fecha civil en la zona por defecto de BE (la misma que usan las lecturas nutricionales); se informa.
 */
/** Período de actividad en fechas civiles (inclusive), `null` = sin cota de ese lado. Se recorta en la zona por defecto. */
export interface PeriodoCivil {
  readonly start: string | null;
  readonly end: string | null;
}

export interface ConsultaDeCartera {
  readonly periodo: PeriodoCivil;
  readonly domain: DominioDeCartera | null;
  readonly kind: TipoDePendiente | null;
  readonly limit: number;
  readonly cursor: string | null;
}

const OPERACION = 'API-CAR-01';
/** Tope de asesorados por lectura: por encima, la cartera necesita otra estrategia (ficha, §f.2). */
export const MAXIMO_DE_ASESORADOS = 200;

const VISTA_QUE_RESUELVE: Readonly<Record<TipoDePendiente, VistaDeApertura>> = {
  REVIEW_OVERDUE: 'revisiones',
  REVIEW_DUE_SOON: 'revisiones',
  REVIEW_UNDATED: 'revisiones',
  PLAN_DRAFT_PENDING: 'plan',
  NO_ACTIVE_PLAN: 'plan',
  FORM_REQUEST_OPEN: 'solicitudes',
  ANTHRO_DRAFT_PENDING: 'preparacion',
};

interface Hecho {
  readonly kind: TipoDePendiente;
  readonly since: string | null;
  readonly daysOverdue: number | null;
  readonly daysUntil: number | null;
}

interface Actividad {
  readonly lastActivityAt: string | null;
  readonly activityCount: number;
}

export async function leerCartera(prisma: PrismaService, pdp: PdpService, procesos: ProcesoService, actorId: string, ctx: ContextoDeSolicitud, consulta: ConsultaDeCartera): Promise<CarteraResponse> {
  const hoy = fechaCivil(new Date().toISOString(), ZONA_POR_DEFECTO);

  // 1. Los vínculos vigentes del profesional, agrupados por asesorado (el vínculo es único por par).
  const alcances = await prisma.alcanceDeVinculo.findMany({
    where: { estado: 'ACEPTADO', vinculo: { profesionalId: actorId } },
    select: { alcance: true, vinculo: { select: { asesoradoId: true } } },
    orderBy: [{ momentoDeRegistro: 'asc' }, { id: 'asc' }],
  });
  const porAsesorado = new Map<string, Set<Alcance>>();
  for (const a of alcances) {
    if (!porAsesorado.has(a.vinculo.asesoradoId) && porAsesorado.size >= MAXIMO_DE_ASESORADOS) break;
    porAsesorado.set(a.vinculo.asesoradoId, (porAsesorado.get(a.vinculo.asesoradoId) ?? new Set()).add(a.alcance));
  }

  // 2. El PDP decide por asesorado y por alcance, y registra cada decisión (igual que API-DSH-03).
  let partialView = false;
  const permitidos: { asesoradoId: string; alcance: Alcance; relationshipId: string }[] = [];
  for (const [asesoradoId, conVinculo] of porAsesorado) {
    const decisiones = await pdp.decidirPorAlcance(OPERACION, actorId, asesoradoId, ctx);
    for (const d of decisiones.porAlcance) {
      if (!conVinculo.has(d.alcance)) continue;
      if (d.decision.permitida) permitidos.push({ asesoradoId, alcance: d.alcance, relationshipId: d.decision.alcanceDeVinculoId });
      else partialView = true;
    }
  }

  // 3. Una foto: todos los hechos en una transacción de lectura.
  const items = await prisma.$transaction(async (tx) => {
    const filas: PendienteDeCartera[] = [];
    for (const p of permitidos) {
      const domain = CLAVE_DE_DOMINIO[p.alcance];
      if (consulta.domain && domain !== consulta.domain) continue;
      const [hechos, actividad] = p.alcance === 'ANTROPOMETRIA' ? await deAntropometria(tx, actorId, p.asesoradoId, hoy, consulta.periodo) : await dePlanificacion(tx, procesos, actorId, p.asesoradoId, p.alcance, hoy, consulta.periodo);
      for (const h of hechos) {
        if (consulta.kind && h.kind !== consulta.kind) continue;
        filas.push({
          advisee: { identityId: p.asesoradoId, displayName: nombreDeAsesorado(p.asesoradoId) },
          relationshipId: p.relationshipId,
          domain,
          kind: h.kind,
          since: h.since,
          daysOverdue: h.daysOverdue,
          daysUntil: h.daysUntil,
          lastActivityAt: actividad.lastActivityAt,
          activityCount: actividad.activityCount,
          open: { view: VISTA_QUE_RESUELVE[h.kind] },
        });
      }
    }
    return filas;
  });

  const ordenados = ordenarPendientes(items.map((i) => ({ ...i, adviseeId: i.advisee.identityId })));
  const { pagina, page } = paginarCartera(ordenados, consulta.limit, consulta.cursor);
  return {
    data: { today: hoy, timeZone: ZONA_POR_DEFECTO, period: consulta.periodo, partialView, items: pagina.map(({ adviseeId: _omitido, ...item }) => item) },
    page,
  };
}

/** Nutrición y entrenamiento comparten la forma: plan con versión efectiva, Proceso con expectativa, borradores y solicitudes. */
async function dePlanificacion(tx: Tx, procesos: ProcesoService, profesionalId: string, asesoradoId: string, alcance: 'NUTRICION' | 'ENTRENAMIENTO', hoy: string, periodo: PeriodoCivil): Promise<[Hecho[], Actividad]> {
  const hechos: Hecho[] = [];
  const par = { profesionalId_asesoradoId: { profesionalId, asesoradoId } };
  const plan =
    alcance === 'NUTRICION'
      ? await tx.planNutricional.findUnique({ where: par, select: { id: true, versionEfectiva: { select: { momentoDeActivacion: true } } } })
      : await tx.planDeEntrenamiento.findUnique({ where: par, select: { id: true, versionEfectiva: { select: { momentoDeActivacion: true } } } });
  const activadaEn = plan?.versionEfectiva?.momentoDeActivacion ?? null;
  // Un borrador posterior a la última activación (o sin ninguna): trabajo empezado y no activado.
  const dondeBorrador = { estado: 'BORRADOR' as const, ...(activadaEn ? { momentoDeRegistro: { gt: activadaEn } } : {}) };
  const borrador = plan
    ? alcance === 'NUTRICION'
      ? await tx.versionDePlanNutricional.findFirst({ where: { planId: plan.id, ...dondeBorrador }, orderBy: { momentoDeRegistro: 'asc' }, select: { momentoDeRegistro: true } })
      : await tx.versionDePlanDeEntrenamiento.findFirst({ where: { planId: plan.id, ...dondeBorrador }, orderBy: { momentoDeRegistro: 'asc' }, select: { momentoDeRegistro: true } })
    : null;

  const proceso = await tx.procesoOperativo.findFirst({ where: { profesionalId, asesoradoId, alcance, estado: 'ABIERTO' }, select: { id: true } });
  if (proceso) {
    const expectativa = await procesos.proximaRevisionVigente(tx, proceso.id);
    if (expectativa) {
      const fechaObjetivo = expectativa.fechaObjetivo ? expectativa.fechaObjetivo.toISOString().slice(0, 10) : null;
      const c = clasificarRevision(fechaObjetivo, hoy);
      if (c.kind === 'REVIEW_OVERDUE') hechos.push({ kind: c.kind, since: fechaObjetivo, daysOverdue: c.dias, daysUntil: null });
      else if (c.kind === 'REVIEW_DUE_SOON') hechos.push({ kind: c.kind, since: fechaObjetivo, daysOverdue: null, daysUntil: c.dias });
      else if (c.kind === 'REVIEW_UNDATED') hechos.push({ kind: c.kind, since: civil(expectativa.momentoDeRegistro), daysOverdue: null, daysUntil: null });
    }
  }
  if (borrador) hechos.push({ kind: 'PLAN_DRAFT_PENDING', since: civil(borrador.momentoDeRegistro), daysOverdue: null, daysUntil: null });
  else if (!proceso) hechos.push({ kind: 'NO_ACTIVE_PLAN', since: null, daysOverdue: null, daysUntil: null });
  const solicitud = await solicitudAbierta(tx, profesionalId, asesoradoId, alcance);
  if (solicitud) hechos.push(solicitud);

  const donde = { asesoradoId, versionDePlan: { plan: { profesionalId } }, ...(enElPeriodo(periodo) ? { momentoDeOcurrencia: enElPeriodo(periodo) } : {}) };
  const registros =
    alcance === 'NUTRICION'
      ? await tx.ingestaNutricional.aggregate({ where: donde, _count: { _all: true }, _max: { momentoDeOcurrencia: true } })
      : await tx.ejecucionDeEntrenamiento.aggregate({ where: donde, _count: { _all: true }, _max: { momentoDeOcurrencia: true } });
  return [hechos, { lastActivityAt: registros._max.momentoDeOcurrencia?.toISOString() ?? null, activityCount: registros._count._all }];
}

async function deAntropometria(tx: Tx, profesionalId: string, asesoradoId: string, _hoy: string, periodo: PeriodoCivil): Promise<[Hecho[], Actividad]> {
  const hechos: Hecho[] = [];
  const enPreparacion = await tx.evaluacionAntropometrica.findFirst({ where: { profesionalId, asesoradoId, estado: 'EN_PREPARACION' }, orderBy: { momentoDeRegistro: 'asc' }, select: { momentoDeRegistro: true } });
  if (enPreparacion) hechos.push({ kind: 'ANTHRO_DRAFT_PENDING', since: civil(enPreparacion.momentoDeRegistro), daysOverdue: null, daysUntil: null });
  const solicitud = await solicitudAbierta(tx, profesionalId, asesoradoId, 'ANTROPOMETRIA');
  if (solicitud) hechos.push(solicitud);
  // Solo las REGISTRADAS son un dato (REG-06-214 inciso 4), como en API-DSH-03.
  const registradas = await tx.evaluacionAntropometrica.aggregate({
    where: { profesionalId, asesoradoId, estado: 'REGISTRADA', ...(enElPeriodo(periodo) ? { momentoDeOcurrencia: enElPeriodo(periodo) } : {}) },
    _count: { _all: true },
    _max: { momentoDeOcurrencia: true },
  });
  return [hechos, { lastActivityAt: registradas._max.momentoDeOcurrencia?.toISOString() ?? null, activityCount: registradas._count._all }];
}

/** La solicitud de formulario más antigua de este profesional a este asesorado, en este alcance, sin respuesta. */
async function solicitudAbierta(tx: Tx, profesionalId: string, asesoradoId: string, alcance: Alcance): Promise<Hecho | null> {
  const s = await tx.solicitudDeFormulario.findFirst({ where: { profesionalId, asesoradoId, alcance, respuesta: null }, orderBy: { momentoDeRegistro: 'asc' }, select: { momentoDeRegistro: true } });
  return s ? { kind: 'FORM_REQUEST_OPEN', since: civil(s.momentoDeRegistro), daysOverdue: null, daysUntil: null } : null;
}

const civil = (momento: Date): string => fechaCivil(momento.toISOString(), ZONA_POR_DEFECTO);

/** Del primer instante del día inicial al primer instante del día siguiente al final (exclusivo), en la zona por defecto. */
function enElPeriodo(p: PeriodoCivil): { gte?: Date; lt?: Date } | undefined {
  const filtro = { ...(p.start ? { gte: new Date(inicioDelDia(p.start, ZONA_POR_DEFECTO)) } : {}), ...(p.end ? { lt: new Date(inicioDelDia(diaSiguiente(p.end), ZONA_POR_DEFECTO)) } : {}) };
  return Object.keys(filtro).length > 0 ? filtro : undefined;
}

/**
 * Paginación de una lista calculada: el cursor es la clave del último ítem servido (tipo, dominio, asesorado). Si la
 * lista cambió y la clave ya no está, el cursor es inválido (400 INVALID_CURSOR): se vuelve a pedir desde el inicio.
 */
type Ordenado = PendienteDeCartera & { adviseeId: string };
const claveDe = (i: Ordenado): string => `${i.kind}|${i.domain}|${i.adviseeId}`;

function paginarCartera(ordenados: readonly Ordenado[], limit: number, cursor: string | null): { pagina: readonly Ordenado[]; page: CarteraResponse['page'] } {
  let desde = 0;
  if (cursor !== null) {
    const clave = leerCursorDeCartera(cursor);
    const posicion = ordenados.findIndex((i) => claveDe(i) === clave);
    if (posicion < 0) throw errores.cursorInvalido();
    desde = posicion + 1;
  }
  const pagina = ordenados.slice(desde, desde + limit);
  const hasMore = desde + limit < ordenados.length;
  const ultima = pagina[pagina.length - 1];
  return { pagina, page: { limit, nextCursor: hasMore && ultima ? Buffer.from(claveDe(ultima), 'utf8').toString('base64url') : null, hasMore } };
}

function leerCursorDeCartera(texto: string): string {
  const clave = Buffer.from(texto, 'base64url').toString('utf8');
  if (!/^[A-Z_]+\|[a-z]+\|[0-9a-f-]{36}$/.test(clave)) throw errores.cursorInvalido();
  return clave;
}
