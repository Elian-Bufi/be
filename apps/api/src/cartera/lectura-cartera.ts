import { Prisma, type Alcance } from '@prisma/client';
import { ALCANCES, CLAVE_DE_DOMINIO, clasificarRevision, diaSiguiente, fechaCivil, inicioDelDia, ordenarPendientes, type CarteraResponse, type DominioDeCartera, type PendienteDeCartera, type TipoDePendiente, type VistaDeApertura } from '@be/domain';
import type { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { ZONA_POR_DEFECTO } from '../nutricion/zona';
import type { PrismaService } from '../prisma/prisma.service';
import type { ProcesoService } from '../proceso/proceso.service';
import { nombreDelPar, nombresDeAsesoradosPorPar } from '../vinculo/lectura';

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
 * - Los hechos se leen **por conjuntos** (WP-CARTERA-LECTURA-POR-CONJUNTOS, 2026-10-28): una consulta por tipo de hecho
 *   para toda la cartera, cada una acotada a los pares (profesional, asesorado) que el PDP permitió en ese alcance, en
 *   lugar de cinco a siete consultas por persona y área. El resultado por par es el mismo; lo fija
 *   `test/integration/cartera-por-conjuntos.int-spec.ts` contra la copia congelada de la lectura anterior.
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

/** Un par autorizado por el PDP en un alcance: lo único que las lecturas de hechos reciben. */
interface ParAutorizado {
  readonly asesoradoId: string;
  readonly alcance: Alcance;
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

  // 3. Una foto: todos los hechos en una transacción de lectura, por conjuntos.
  const items = await prisma.$transaction(async (tx) => {
    // Cada asesorado con su nombre si el vínculo está vigente; si no, la referencia neutral (DL-040).
    const nombres = await nombresDeAsesoradosPorPar(tx, permitidos.map((p) => ({ profesionalId: actorId, asesoradoId: p.asesoradoId })));
    // Solo los pares del dominio pedido aportan, y solo de ellos se leen hechos (como en la lectura persona por persona).
    const pares = consulta.domain ? permitidos.filter((p) => CLAVE_DE_DOMINIO[p.alcance] === consulta.domain) : permitidos;
    const hechosDe = await leerHechosPorConjuntos(tx, procesos, actorId, pares, hoy, consulta.periodo);
    const filas: PendienteDeCartera[] = [];
    // El orden de los pares es el de los vínculos (paso 1): el orden final lo da `ordenarPendientes`, y ante un empate
    // total (mismo tipo, fecha, atraso y asesorado en dos dominios) conserva este, por ser estable.
    for (const p of pares) {
      const domain = CLAVE_DE_DOMINIO[p.alcance];
      const [hechos, actividad] = hechosDe(p);
      for (const h of hechos) {
        if (consulta.kind && h.kind !== consulta.kind) continue;
        filas.push({
          advisee: { identityId: p.asesoradoId, displayName: nombreDelPar(nombres, { profesionalId: actorId, asesoradoId: p.asesoradoId }) },
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

// ─── Los hechos, por conjuntos ────────────────────────────────────────────────────────────────

type Planificacion = 'NUTRICION' | 'ENTRENAMIENTO';
const PLANIFICACION: readonly Planificacion[] = ['NUTRICION', 'ENTRENAMIENTO'];

/** Las tablas del plan y de sus versiones por alcance de planificación: identificadores fijos, nunca datos del pedido. */
const TABLAS_DE_PLAN: Readonly<Record<Planificacion, { readonly plan: Prisma.Sql; readonly version: Prisma.Sql }>> = {
  NUTRICION: { plan: Prisma.raw('"plan_nutricional"'), version: Prisma.raw('"version_de_plan_nutricional"') },
  ENTRENAMIENTO: { plan: Prisma.raw('"plan_de_entrenamiento"'), version: Prisma.raw('"version_de_plan_de_entrenamiento"') },
};

const clavePar = (asesoradoId: string, alcance: Alcance): string => `${alcance}|${asesoradoId}`;
const SIN_ACTIVIDAD: Actividad = { lastActivityAt: null, activityCount: 0 };

/** Un grupo de `groupBy` por asesorado: cuántos registros y el último, en el período. */
interface GrupoDeActividad {
  readonly asesoradoId: string;
  readonly _count: { readonly _all: number };
  readonly _max: { readonly momentoDeOcurrencia: Date | null };
}

/**
 * Lee los hechos de todos los pares autorizados con una consulta por tipo de hecho, y devuelve cómo armar los de cada
 * par. Cada consulta recibe, por alcance, exactamente los asesorados que el PDP permitió en ese alcance: lo que no fue
 * permitido no se lee (ni se filtra después). Las consultas:
 * - el borrador pendiente de cada plan (el más antiguo posterior a la activación vigente), una por alcance de
 *   planificación, con `DISTINCT ON`: una fila por par, cualquiera sea la cantidad de borradores;
 * - el Proceso abierto de cada par (único por el índice parcial `proceso_operativo_uno_abierto`) y, en otra sentencia, la
 *   expectativa vigente de cada uno (`ProcesoService.proximasRevisionesVigentes`, la misma regla de la cadena);
 * - las solicitudes de formulario sin respuesta de los pares, en orden de registro: la más antigua por par y alcance;
 * - las evaluaciones antropométricas en preparación de los pares, en orden de registro: la más antigua por par;
 * - la actividad del período agrupada por asesorado, una por alcance (comidas sin anular, sesiones, tomas registradas).
 * Lo que vuelve es del orden de los pares (hasta 200 personas por tres alcances), salvo las solicitudes sin respuesta y
 * las evaluaciones en preparación, que son el trabajo pendiente de la cartera y, por eso, pocas.
 */
async function leerHechosPorConjuntos(tx: Tx, procesos: ProcesoService, profesionalId: string, pares: readonly ParAutorizado[], hoy: string, periodo: PeriodoCivil): Promise<(par: ParAutorizado) => [Hecho[], Actividad]> {
  const porAlcance: Record<Alcance, Set<string>> = { NUTRICION: new Set(), ENTRENAMIENTO: new Set(), ANTROPOMETRIA: new Set() };
  for (const p of pares) porAlcance[p.alcance].add(p.asesoradoId);
  const ids: Record<Alcance, string[]> = { NUTRICION: [...porAlcance.NUTRICION], ENTRENAMIENTO: [...porAlcance.ENTRENAMIENTO], ANTROPOMETRIA: [...porAlcance.ANTROPOMETRIA] };
  const conPares = <A extends Alcance>(alcances: readonly A[]): A[] => alcances.filter((a) => ids[a].length > 0);
  /** La condición «este alcance, y solo sus asesorados permitidos», una rama por alcance con pares. */
  const soloLosPermitidos = (alcances: readonly Alcance[]): { alcance: Alcance; asesoradoId: { in: string[] } }[] => alcances.map((alcance) => ({ alcance, asesoradoId: { in: ids[alcance] } }));
  const planificacion = conPares(PLANIFICACION);

  // a) El borrador pendiente de cada plan: el más antiguo posterior a la activación vigente (o cualquiera, sin activación).
  const borradores = new Map<string, Date>();
  for (const alcance of planificacion) {
    const t = TABLAS_DE_PLAN[alcance];
    const filas = await tx.$queryRaw<{ asesoradoId: string; momentoDeRegistro: Date }[]>`
      SELECT DISTINCT ON (p."asesorado_id") p."asesorado_id"::text AS "asesoradoId", v."momento_de_registro" AS "momentoDeRegistro"
        FROM ${t.version} v
        JOIN ${t.plan} p ON p."id" = v."plan_id"
        LEFT JOIN ${t.version} e ON e."id" = p."version_efectiva_id"
       WHERE p."profesional_id" = ${profesionalId}::uuid
         AND p."asesorado_id" = ANY(${ids[alcance]}::uuid[])
         AND v."estado" = 'BORRADOR'
         AND (e."momento_de_activacion" IS NULL OR v."momento_de_registro" > e."momento_de_activacion")
       ORDER BY p."asesorado_id", v."momento_de_registro" ASC, v."id" ASC`;
    for (const f of filas) borradores.set(clavePar(f.asesoradoId, alcance), f.momentoDeRegistro);
  }

  // b) El Proceso abierto de cada par y la expectativa de revisión vigente de cada Proceso (terminal de la cadena).
  const abiertos =
    planificacion.length === 0
      ? []
      : await tx.procesoOperativo.findMany({
          where: { profesionalId, estado: 'ABIERTO', OR: soloLosPermitidos(planificacion) },
          select: { id: true, asesoradoId: true, alcance: true },
        });
  const procesoDe = new Map(abiertos.map((p) => [clavePar(p.asesoradoId, p.alcance), p.id]));
  const expectativas = await procesos.proximasRevisionesVigentes(tx, abiertos.map((p) => p.id));

  // c) La solicitud de formulario sin respuesta más antigua de cada par, en los tres alcances.
  const conSolicitudes = conPares(ALCANCES);
  const solicitudes =
    conSolicitudes.length === 0
      ? []
      : await tx.solicitudDeFormulario.findMany({
          where: { profesionalId, respuesta: null, OR: soloLosPermitidos(conSolicitudes) },
          orderBy: [{ momentoDeRegistro: 'asc' }, { id: 'asc' }],
          select: { asesoradoId: true, alcance: true, momentoDeRegistro: true },
        });
  const primeraSolicitud = new Map<string, Date>();
  for (const s of solicitudes) {
    const k = clavePar(s.asesoradoId, s.alcance);
    if (!primeraSolicitud.has(k)) primeraSolicitud.set(k, s.momentoDeRegistro);
  }

  // d) La evaluación antropométrica en preparación más antigua de cada par.
  const enPreparacion = new Map<string, Date>();
  if (ids.ANTROPOMETRIA.length > 0) {
    const filas = await tx.evaluacionAntropometrica.findMany({
      where: { profesionalId, asesoradoId: { in: ids.ANTROPOMETRIA }, estado: 'EN_PREPARACION' },
      orderBy: [{ momentoDeRegistro: 'asc' }, { id: 'asc' }],
      select: { asesoradoId: true, momentoDeRegistro: true },
    });
    for (const f of filas) if (!enPreparacion.has(f.asesoradoId)) enPreparacion.set(f.asesoradoId, f.momentoDeRegistro);
  }

  // e) La actividad del período, por asesorado y alcance. Un asesorado sin registros no tiene grupo: cero y sin último.
  const lapso = enElPeriodo(periodo);
  const enElLapso = lapso ? { momentoDeOcurrencia: lapso } : {};
  const actividad = new Map<string, Actividad>();
  const anotar = (alcance: Alcance, grupos: readonly GrupoDeActividad[]): void => {
    for (const g of grupos) actividad.set(clavePar(g.asesoradoId, alcance), { lastActivityAt: g._max.momentoDeOcurrencia?.toISOString() ?? null, activityCount: g._count._all });
  };
  if (ids.NUTRICION.length > 0) {
    // DL-121: una ingesta anulada por su titular no es actividad.
    const comidas = await tx.ingestaNutricional.groupBy({
      by: ['asesoradoId'],
      where: { asesoradoId: { in: ids.NUTRICION }, versionDePlan: { plan: { profesionalId } }, anulacion: { is: null }, ...enElLapso },
      _count: { _all: true },
      _max: { momentoDeOcurrencia: true },
    });
    anotar('NUTRICION', comidas);
  }
  if (ids.ENTRENAMIENTO.length > 0) {
    const sesiones = await tx.ejecucionDeEntrenamiento.groupBy({
      by: ['asesoradoId'],
      where: { asesoradoId: { in: ids.ENTRENAMIENTO }, versionDePlan: { plan: { profesionalId } }, ...enElLapso },
      _count: { _all: true },
      _max: { momentoDeOcurrencia: true },
    });
    anotar('ENTRENAMIENTO', sesiones);
  }
  if (ids.ANTROPOMETRIA.length > 0) {
    // Solo las REGISTRADAS son un dato (REG-06-214 inciso 4), como en API-DSH-03.
    const tomas = await tx.evaluacionAntropometrica.groupBy({
      by: ['asesoradoId'],
      where: { profesionalId, asesoradoId: { in: ids.ANTROPOMETRIA }, estado: 'REGISTRADA', ...enElLapso },
      _count: { _all: true },
      _max: { momentoDeOcurrencia: true },
    });
    anotar('ANTROPOMETRIA', tomas);
  }

  // Los hechos de un par, en el mismo orden de siempre: revisión, borrador o sin plan, solicitud (antropometría: en
  // preparación, solicitud). El orden importa solo para los empates totales del orden final.
  return (par) => {
    const k = clavePar(par.asesoradoId, par.alcance);
    const hechos: Hecho[] = [];
    if (par.alcance === 'ANTROPOMETRIA') {
      const preparacion = enPreparacion.get(par.asesoradoId);
      if (preparacion) hechos.push({ kind: 'ANTHRO_DRAFT_PENDING', since: civil(preparacion), daysOverdue: null, daysUntil: null });
    } else {
      const procesoId = procesoDe.get(k);
      const expectativa = procesoId ? expectativas.get(procesoId) : undefined;
      if (expectativa) {
        const fechaObjetivo = expectativa.fechaObjetivo ? expectativa.fechaObjetivo.toISOString().slice(0, 10) : null;
        const c = clasificarRevision(fechaObjetivo, hoy);
        if (c.kind === 'REVIEW_OVERDUE') hechos.push({ kind: c.kind, since: fechaObjetivo, daysOverdue: c.dias, daysUntil: null });
        else if (c.kind === 'REVIEW_DUE_SOON') hechos.push({ kind: c.kind, since: fechaObjetivo, daysOverdue: null, daysUntil: c.dias });
        else if (c.kind === 'REVIEW_UNDATED') hechos.push({ kind: c.kind, since: civil(expectativa.momentoDeRegistro), daysOverdue: null, daysUntil: null });
      }
      const borrador = borradores.get(k);
      if (borrador) hechos.push({ kind: 'PLAN_DRAFT_PENDING', since: civil(borrador), daysOverdue: null, daysUntil: null });
      else if (!procesoId) hechos.push({ kind: 'NO_ACTIVE_PLAN', since: null, daysOverdue: null, daysUntil: null });
    }
    const solicitud = primeraSolicitud.get(k);
    if (solicitud) hechos.push({ kind: 'FORM_REQUEST_OPEN', since: civil(solicitud), daysOverdue: null, daysUntil: null });
    return [hechos, actividad.get(k) ?? SIN_ACTIVIDAD];
  };
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
