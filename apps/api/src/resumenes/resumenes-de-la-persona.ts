/**
 * DL-163 D-13, ampliada por Dirección el 2026-11-07 (WP-TABLERO-ALTA-GAMA TB-52 a TB-56) · lo que la persona comparte de
 * otras áreas, en la base: lecturas, cerrojos y las escrituras que viven en transacciones ajenas (el cierre de cuenta y la
 * nota que cita un plan, TB-53). Las reglas son del dominio (`resumenes-compartidos.ts`); la base las vuelve a exigir
 * (migración 20261107120100). Calca la autorización de los hábitos (`formularios/habitos-de-la-persona.ts`, DL-165 D-9).
 *
 * **Cerrojos** (fuera del orden único de `prisma/concurrencia.ts`, y siempre al final de la transacción, después del A3 y del
 * PDP, como los de los hábitos):
 * - la autorización de una persona: exclusivo para escribir una versión (API-RES-02, 03 y 10, el cierre de cuenta) y
 *   **compartido para leerla** (API-RES-04, 06, 07 y 08, y la nota que cita un plan). Un retiro o una baja de nivel espera a
 *   las lecturas que ya empezaron, y toda lectura que empieza después ya lo ve (RNF-PRI-002);
 * - sus pedidos de ver un plan: exclusivo para crear o resolver uno, después del de la autorización.
 */
import {
  ALCANCES,
  CATALOGO_DE_TEXTOS,
  ETIQUETA_DE_ALCANCE,
  evaluarAutorizacion,
  VERSION_VIGENTE,
  VERSIONES_PROPUESTAS,
  areasQueSeLePuedenCompartir,
  esAreaConPlan,
  laMatrizDejaVerElPlan,
  loQueRecibe,
  renglonesDelPlan,
  type AccesoALoCompartido,
  type Alcance,
  type AreaConPlan,
  type CompartirResumenes,
  type ComponenteDeLaPersona,
  type EstadoDelPedidoDePlan,
  type NivelDeResumen,
  type PedidoDePlanDelProfesional,
  type Procedencia,
  type ProfesionalParaResumenes,
  type RenglonDeResumen,
  type TextoDeCompartirResumenes,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import type { AutorizacionDeResumenes as FilaDeAutorizacion, NivelDeResumenCompartido, PedidoDeAccesoAPlan as FilaDePedido } from '@prisma/client';
import type { PdpService } from '../autorizacion/pdp.service';
import { profesionalesDeLaPersona } from '../formularios/habitos-de-la-persona';
import { registrarEventoDeFormulario } from '../formularios/eventos';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { nombreDeProfesional } from '../vinculo/lectura';

type Tx = Prisma.TransactionClient;

export const token = (n: number): string => `v${n}`;

// ─── Cerrojos ───────────────────────────────────────────────────────────────────────────────────

export async function tomarLaAutorizacionDeResumenes(tx: Tx, personaId: string, modo: 'escribir' | 'leer'): Promise<void> {
  const clave = `autorizacion-de-resumenes|${personaId}`;
  if (modo === 'escribir') await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${clave}, 0))`;
  else await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(hashtextextended(${clave}, 0))`;
}

export async function tomarLosPedidosDePlan(tx: Tx, personaId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`pedidos-de-acceso-a-plan|${personaId}`}, 0))`;
}

/** La hora de la base para una escritura, tomada después de los cerrojos. */
export const momentoDeLosResumenes = momentoDeLaBase;

// ─── El texto del acto ──────────────────────────────────────────────────────────────────────────

/** El texto del acto que se muestra para compartir o ampliar: el vigente de su tipo, hoy una propuesta. */
export function textoDelActo(): TextoDeCompartirResumenes {
  const v = VERSION_VIGENTE.RESUMENES_COMPARTIDOS;
  return { id: v.id, title: v.titulo, text: v.texto, textHash: v.hash, effectiveFrom: v.vigenteDesde, approval: VERSIONES_PROPUESTAS.has(v.id) ? 'PENDING_APPROVAL' : 'APPROVED' };
}

/** Una versión del texto del acto por su id, con su hash; `null` si no es de este tipo. */
export function versionDelTexto(id: string): { readonly id: string; readonly hash: string } | null {
  const v = CATALOGO_DE_TEXTOS.find((t) => t.id === id && t.tipo === 'RESUMENES_COMPARTIDOS');
  return v ? { id: v.id, hash: v.hash } : null;
}

// ─── Los componentes de la persona ──────────────────────────────────────────────────────────────

export interface ProfesionalConNombre {
  readonly profesionalId: string;
  readonly nombre: string;
}

/** Los componentes de vínculo sin terminar de la persona (aceptados o en pausa), con el nombre de cada profesional. */
export async function componentesDeLaPersona(tx: Tx, personaId: string): Promise<{ componentes: ComponenteDeLaPersona[]; nombres: Map<string, string> }> {
  const profesionales = await profesionalesDeLaPersona(tx, personaId);
  return {
    componentes: profesionales.flatMap((p) => p.componentes.map((c) => ({ profesionalId: p.profesionalId, alcanceDeVinculoId: c.alcanceDeVinculoId, alcance: c.alcance, estado: c.estado }))),
    nombres: new Map(profesionales.map((p) => [p.profesionalId, p.nombre] as const)),
  };
}

/**
 * Quién lleva hoy cada área con la persona, además de `excluir`: los profesionales con un vínculo con ella que el PDP
 * permite hoy en esa área, evaluados sin registrar, como API-CRD-01-LISTA (es lo que esa operación ya revela). Ordenados
 * por nombre.
 */
export async function quienesLlevanCadaArea(tx: Tx, pdp: PdpService, personaId: string, excluir: string): Promise<Map<Alcance, ProfesionalConNombre[]>> {
  const filas = await tx.$queryRaw<{ id: string; nombre: string | null }[]>`
    SELECT DISTINCT v."profesional_id"::text AS "id", pp."nombre_visible" AS "nombre"
      FROM "vinculo" v LEFT JOIN "perfil_profesional" pp ON pp."identidad_id" = v."profesional_id"
     WHERE v."asesorado_id" = ${personaId}::uuid AND v."profesional_id" <> ${excluir}::uuid
     ORDER BY 1`;
  const porArea = new Map<Alcance, ProfesionalConNombre[]>(ALCANCES.map((a) => [a, []]));
  for (const f of filas) {
    const nombre = nombreDeProfesional(f.nombre === null ? null : { nombreVisible: f.nombre });
    for (const h of await pdp.leerHechos(tx, f.id, personaId)) {
      if (evaluarAutorizacion(h).permitida) porArea.get(h.operacion.alcance)!.push({ profesionalId: f.id, nombre });
    }
  }
  for (const lista of porArea.values()) lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es') || a.profesionalId.localeCompare(b.profesionalId));
  return porArea;
}

// ─── La autorización ────────────────────────────────────────────────────────────────────────────

const NIVEL_API: Readonly<Record<NivelDeResumenCompartido, NivelDeResumen>> = { RESUMEN: 'SUMMARY', RESUMEN_Y_PLAN: 'SUMMARY_AND_PLAN' };
const NIVEL_EN_LA_BASE: Readonly<Record<NivelDeResumen, NivelDeResumenCompartido>> = { SUMMARY: 'RESUMEN', SUMMARY_AND_PLAN: 'RESUMEN_Y_PLAN' };

export interface AutorizacionDeResumenesVigente {
  readonly fila: FilaDeAutorizacion;
  /** Los renglones, si está ACTIVA; `null` si está RETIRADA. Todos los guardados: cuáles valen hoy lo dice `renglonesVigentes`. */
  readonly renglones: readonly RenglonDeResumen[] | null;
  /** Desde cuándo está activa sin un retiro en el medio; `null` si está RETIRADA. */
  readonly activaDesde: Date | null;
}

/** La última versión de la autorización de la persona, con su lista si está ACTIVA. `null` si nunca la dio. */
export async function autorizacionDeResumenesVigente(tx: Tx, personaId: string): Promise<AutorizacionDeResumenesVigente | null> {
  const filas = await tx.autorizacionDeResumenes.findMany({ where: { asesoradoId: personaId }, orderBy: { version: 'desc' }, include: { destinatarios: true } });
  const ultima = filas[0];
  if (!ultima) return null;
  if (ultima.estado !== 'ACTIVA') return { fila: ultima, renglones: null, activaDesde: null };
  let desde = ultima.momentoDeOcurrencia;
  for (const f of filas) {
    if (f.estado !== 'ACTIVA') break;
    desde = f.momentoDeOcurrencia;
  }
  return {
    fila: ultima,
    renglones: ultima.destinatarios.map((d) => ({
      profesionalId: d.profesionalId,
      alcanceDeVinculoId: d.alcanceDeVinculoId,
      origenId: d.origenId,
      area: d.area,
      nivel: NIVEL_API[d.nivel],
      desde: d.nivelDesde.toISOString(),
    })),
    activaDesde: desde,
  };
}

export function compartirApi(vigente: AutorizacionDeResumenesVigente | null): CompartirResumenes {
  if (!vigente) return { status: 'NOT_GIVEN', version: null, activeSince: null, withdrawnAt: null, acceptedTextVersionId: null };
  const activa = vigente.fila.estado === 'ACTIVA';
  return {
    status: activa ? 'ACTIVE' : 'WITHDRAWN',
    version: token(vigente.fila.version),
    activeSince: activa ? (vigente.activaDesde ?? vigente.fila.momentoDeOcurrencia).toISOString() : null,
    withdrawnAt: activa ? null : vigente.fila.momentoDeOcurrencia.toISOString(),
    acceptedTextVersionId: activa ? vigente.fila.versionDeTextoId : null,
  };
}

/** Lo que la autorización dice de cada profesional de la persona, en el orden de sus nombres. */
export function profesionalesApi(componentes: readonly ComponenteDeLaPersona[], nombres: ReadonlyMap<string, string>, renglones: readonly RenglonDeResumen[]): ProfesionalParaResumenes[] {
  return [...nombres.entries()]
    .map(([profesionalId, nombre]) => {
      const propios = componentes.filter((c) => c.profesionalId === profesionalId);
      return {
        professional: { identityId: profesionalId, displayName: nombre },
        scopes: ALCANCES.filter((a) => propios.some((c) => c.alcance === a)).map((code) => ({ code, label: ETIQUETA_DE_ALCANCE[code] })),
        link: propios.some((c) => c.estado === 'ACEPTADO') ? ('ACTIVE' as const) : ('PAUSED' as const),
        shareableAreas: areasQueSeLePuedenCompartir(profesionalId, componentes),
        shares: loQueRecibe(profesionalId, propios.map((c) => c.alcanceDeVinculoId), renglones),
      };
    })
    .sort((a, b) => a.professional.displayName.localeCompare(b.professional.displayName, 'es') || a.professional.identityId.localeCompare(b.professional.identityId));
}

/**
 * Una versión nueva de la autorización, la que sigue a la última, con su hecho. Con el cerrojo de escribir ya tomado. Si
 * queda ACTIVA, guarda el texto aceptado (con su hash) y sus renglones.
 */
export async function agregarVersionDeAutorizacionDeResumenes(
  tx: Tx,
  p: {
    readonly personaId: string;
    readonly anterior: FilaDeAutorizacion | null;
    readonly estado: 'ACTIVA' | 'RETIRADA';
    readonly texto: { readonly id: string; readonly hash: string } | null;
    readonly renglones: readonly RenglonDeResumen[];
    readonly procedencia: Procedencia;
    readonly momento: Date;
  },
): Promise<FilaDeAutorizacion> {
  const version = (p.anterior?.version ?? 0) + 1;
  const fila = await tx.autorizacionDeResumenes.create({
    data: {
      asesoradoId: p.personaId,
      version,
      predecesoraId: p.anterior?.id ?? null,
      estado: p.estado,
      versionDeTextoId: p.texto?.id ?? null,
      hashDelTexto: p.texto?.hash ?? null,
      actorId: p.personaId,
      procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      momentoDeOcurrencia: p.momento,
    },
  });
  if (p.estado === 'ACTIVA' && p.renglones.length > 0) {
    await tx.destinatarioDeResumenes.createMany({
      data: p.renglones.map((r) => ({
        autorizacionId: fila.id,
        alcanceDeVinculoId: r.alcanceDeVinculoId,
        origenId: r.origenId,
        profesionalId: r.profesionalId,
        area: r.area,
        nivel: NIVEL_EN_LA_BASE[r.nivel],
        nivelDesde: new Date(r.desde),
      })),
    });
  }
  const tipo = p.estado === 'RETIRADA' ? 'AutorizacionDeResumenesRetirada' : p.anterior?.estado === 'ACTIVA' ? 'AutorizacionDeResumenesModificada' : 'AutorizacionDeResumenesActivada';
  await registrarEventoDeFormulario(tx, {
    tipo,
    profesionalId: null,
    asesoradoId: p.personaId,
    recurso: { tipo: 'AutorizacionDeResumenes', id: fila.id },
    estadoPrevio: p.anterior ? `${p.anterior.estado} ${token(p.anterior.version)}` : null,
    estadoPosterior: `${p.estado} ${token(version)}`,
    actorId: p.personaId,
    procedencia: p.procedencia,
    momento: p.momento,
  });
  return fila;
}

/**
 * Cerrar la cuenta retira la autorización: en la transacción del cierre, después de la de los hábitos, una versión
 * RETIRADA si la última está ACTIVA. El actor es la persona, que cerró su cuenta.
 */
export async function retirarAutorizacionDeResumenesPorCierre(tx: Tx, p: { readonly personaId: string; readonly procedencia: Procedencia; readonly momento: Date }): Promise<boolean> {
  await tomarLaAutorizacionDeResumenes(tx, p.personaId, 'escribir');
  const vigente = await autorizacionDeResumenesVigente(tx, p.personaId);
  if (!vigente || vigente.fila.estado !== 'ACTIVA') return false;
  await agregarVersionDeAutorizacionDeResumenes(tx, { personaId: p.personaId, anterior: vigente.fila, estado: 'RETIRADA', texto: null, renglones: [], procedencia: p.procedencia, momento: p.momento });
  return true;
}

// ─── Quién miró lo compartido (API-RES-01; 08 §19.7) ────────────────────────────────────────────

/** Cuántas lecturas devuelve API-RES-01, como mucho: las más recientes. */
export const LECTURAS_EN_QUIEN_VE_QUE = 50;

/** El tipo de recurso con que API-RES-06 registra cada lectura, por área: así la persona sabe qué plan se leyó. */
export const RECURSO_DEL_PLAN_COMPARTIDO: Readonly<Record<AreaConPlan, string>> = { NUTRICION: 'PlanCompartidoDeNutricion', ENTRENAMIENTO: 'PlanCompartidoDeEntrenamiento' };
const AREA_DEL_RECURSO = new Map<string, AreaConPlan>(Object.entries(RECURSO_DEL_PLAN_COMPARTIDO).map(([a, t]) => [t, a as AreaConPlan]));

/**
 * Las lecturas de lo compartido: las decisiones permitidas de API-RES-06 sobre la persona. Una lectura registra una decisión
 * por cada área permitida de quien lee: se cuentan una vez, por su request.
 */
export async function lecturasDeLoCompartido(tx: Tx, personaId: string): Promise<AccesoALoCompartido[]> {
  const filas = await tx.decisionDeAcceso.findMany({
    where: { sujetoId: personaId, operacion: 'API-RES-06', resultado: 'PERMITIDA' },
    orderBy: { secuencia: 'desc' },
    take: LECTURAS_EN_QUIEN_VE_QUE * 3,
    select: { id: true, actorId: true, recursoTipo: true, requestId: true, momentoDeOcurrencia: true },
  });
  const vistas = new Set<string>();
  const lecturas: { actorId: string; area: AreaConPlan; momento: Date }[] = [];
  for (const f of filas) {
    const area = f.recursoTipo ? AREA_DEL_RECURSO.get(f.recursoTipo) : undefined;
    const clave = f.requestId ?? f.id;
    if (!area || vistas.has(clave)) continue;
    vistas.add(clave);
    lecturas.push({ actorId: f.actorId, area, momento: f.momentoDeOcurrencia });
    if (lecturas.length === LECTURAS_EN_QUIEN_VE_QUE) break;
  }
  if (lecturas.length === 0) return [];
  const perfiles = await tx.perfilProfesional.findMany({ where: { identidadId: { in: [...new Set(lecturas.map((l) => l.actorId))] } }, select: { identidadId: true, nombreVisible: true } });
  const nombres = new Map(perfiles.map((p) => [p.identidadId, nombreDeProfesional(p)] as const));
  return lecturas.map((l) => ({ professional: { identityId: l.actorId, displayName: nombres.get(l.actorId) ?? nombreDeProfesional(null) }, area: l.area, readAt: l.momento.toISOString() }));
}

// ─── El plan vigente que se comparte (API-RES-06 y TB-53) ───────────────────────────────────────

/** El plan vigente de un área compartida: de quién es, su versión efectiva, cuándo se activó y desde cuándo se lo comparten. */
export interface PlanVigenteCompartido {
  readonly fuenteId: string;
  readonly versionId: string;
  readonly activadoEn: Date;
  readonly compartidoDesde: string;
}

/**
 * Lo que un profesional ve hoy del plan de otra área, con lo que el PDP ya le permitió (`permitidos`):
 * - `NO_LO_VE`: la matriz no tiene la fila para sus áreas, o la autorización vigente no lo nombra en esa área con «resumen
 *   y plan» por un componente permitido (el 404 de lo inexistente);
 * - `null`: se lo comparten, pero esa área no tiene un plan vigente (TA-92): quien la lleva no tiene hoy el par permitido
 *   en el PDP, o no activó ninguna versión (en Entrenamiento, con el seguimiento abierto);
 * - si no, el plan, el de activación más reciente si hubiera más de uno (dos profesionales en la misma área).
 * Con el cerrojo compartido de la autorización ya tomado.
 */
export async function planVigenteCompartido(
  tx: Tx,
  pdp: PdpService,
  p: {
    readonly profesionalId: string;
    readonly personaId: string;
    readonly area: AreaConPlan;
    readonly permitidos: readonly { readonly alcanceDeVinculoId: string; readonly alcance: Alcance }[];
    readonly componentes: readonly ComponenteDeLaPersona[];
    readonly renglones: readonly RenglonDeResumen[];
  },
): Promise<PlanVigenteCompartido | 'NO_LO_VE' | null> {
  const alcances = [...new Set(p.permitidos.map((x) => x.alcance))];
  const lleva = p.componentes.some((c) => c.profesionalId === p.profesionalId && c.alcance === p.area);
  // La matriz, con las áreas que el PDP le permite hoy; y nunca un área que él mismo lleva (aunque esté en pausa): la ve
  // por su Alcance.
  if (lleva || !esAreaConPlan(p.area) || !laMatrizDejaVerElPlan(p.area, alcances)) return 'NO_LO_VE';
  const delPlan = renglonesDelPlan(p.profesionalId, p.permitidos.map((x) => x.alcanceDeVinculoId), p.area, p.renglones);
  if (delPlan.length === 0) return 'NO_LO_VE';
  const fuentes = new Map<string, string>();
  for (const r of delPlan) {
    const c = p.componentes.find((x) => x.alcanceDeVinculoId === r.origenId);
    if (!c) continue;
    const antes = fuentes.get(c.profesionalId);
    if (!antes || r.desde < antes) fuentes.set(c.profesionalId, r.desde);
  }
  let elegido: PlanVigenteCompartido | null = null;
  for (const [fuenteId, desde] of fuentes) {
    const [hechos] = await pdp.leerHechos(tx, fuenteId, p.personaId, p.area);
    if (!hechos || !evaluarAutorizacion(hechos).permitida) continue;
    const plan =
      p.area === 'NUTRICION'
        ? await tx.planNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: fuenteId, asesoradoId: p.personaId } }, select: { versionEfectivaId: true } })
        : await tx.planDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: fuenteId, asesoradoId: p.personaId } }, select: { versionEfectivaId: true } });
    if (!plan?.versionEfectivaId) continue;
    if (p.area === 'ENTRENAMIENTO' && (await tx.procesoOperativo.count({ where: { profesionalId: fuenteId, asesoradoId: p.personaId, alcance: 'ENTRENAMIENTO', estado: 'ABIERTO' } })) === 0) continue;
    const version =
      p.area === 'NUTRICION'
        ? await tx.versionDePlanNutricional.findUnique({ where: { id: plan.versionEfectivaId }, select: { estado: true, momentoDeActivacion: true } })
        : await tx.versionDePlanDeEntrenamiento.findUnique({ where: { id: plan.versionEfectivaId }, select: { estado: true, momentoDeActivacion: true } });
    if (!version || version.estado !== 'ACTIVADA' || !version.momentoDeActivacion) continue;
    if (!elegido || version.momentoDeActivacion > elegido.activadoEn) elegido = { fuenteId, versionId: plan.versionEfectivaId, activadoEn: version.momentoDeActivacion, compartidoDesde: desde };
  }
  return elegido;
}

// ─── Los pedidos de ver un plan (TB-56) ─────────────────────────────────────────────────────────

/** Para quien lo hizo: esperando la respuesta, o respondido (aceptado, «no, por ahora» o reemplazado), sin decir qué. */
const ESTADO_DEL_PEDIDO_API: Readonly<Record<FilaDePedido['estado'], EstadoDelPedidoDePlan>> = {
  PENDIENTE: 'PENDING',
  ACEPTADO: 'ANSWERED',
  NO_POR_AHORA: 'ANSWERED',
  REEMPLAZADO: 'ANSWERED',
};

export function pedidoDePlanApi(f: FilaDePedido): PedidoDePlanDelProfesional {
  return { accessRequestId: f.id, scope: f.alcance, area: f.area as AreaConPlan, status: ESTADO_DEL_PEDIDO_API[f.estado], requestedAt: f.pedidoEn.toISOString() };
}

/** El último pedido de este profesional a esta persona para el plan de esa área, en cualquier estado: de él sale el límite. */
export function ultimoPedidoDePlan(tx: Tx, profesionalId: string, personaId: string, area: Alcance): Promise<FilaDePedido | null> {
  return tx.pedidoDeAccesoAPlan.findFirst({ where: { profesionalId, asesoradoId: personaId, area }, orderBy: [{ pedidoEn: 'desc' }, { momentoDeRegistro: 'desc' }] });
}

type EstadoResuelto = 'ACEPTADO' | 'NO_POR_AHORA' | 'REEMPLAZADO';
const HECHO_DEL_PEDIDO = {
  PENDIENTE: 'PedidoDeAccesoAPlanHecho',
  ACEPTADO: 'PedidoDeAccesoAPlanAceptado',
  NO_POR_AHORA: 'PedidoDeAccesoAPlanNoPorAhora',
  REEMPLAZADO: 'PedidoDeAccesoAPlanReemplazado',
} as const;

/** Un pedido nuevo, PENDIENTE, con su hecho. Con el cerrojo de los pedidos ya tomado. */
export async function crearPedidoDePlan(
  tx: Tx,
  p: { readonly profesionalId: string; readonly personaId: string; readonly alcanceDeVinculoId: string; readonly alcance: Alcance; readonly area: AreaConPlan; readonly procedencia: Procedencia; readonly momento: Date },
): Promise<FilaDePedido> {
  const fila = await tx.pedidoDeAccesoAPlan.create({
    data: {
      profesionalId: p.profesionalId,
      asesoradoId: p.personaId,
      alcanceDeVinculoId: p.alcanceDeVinculoId,
      alcance: p.alcance,
      area: p.area,
      pedidoEn: p.momento,
      procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
    },
  });
  await registrarEventoDeFormulario(tx, {
    tipo: HECHO_DEL_PEDIDO.PENDIENTE,
    profesionalId: p.profesionalId,
    asesoradoId: p.personaId,
    recurso: { tipo: 'PedidoDeAccesoAPlan', id: fila.id },
    estadoPrevio: null,
    estadoPosterior: 'PENDIENTE',
    actorId: p.profesionalId,
    procedencia: p.procedencia,
    momento: p.momento,
  });
  return fila;
}

/** Resolver un pedido que espera, una sola vez, con su hecho: `false` si ya no esperaba. */
export async function resolverPedidoDePlan(
  tx: Tx,
  p: {
    readonly pedido: Pick<FilaDePedido, 'id' | 'version' | 'profesionalId' | 'asesoradoId'>;
    readonly estado: EstadoResuelto;
    readonly actorId: string;
    readonly procedencia: Procedencia;
    readonly momento: Date;
  },
): Promise<boolean> {
  const r = await tx.pedidoDeAccesoAPlan.updateMany({ where: { id: p.pedido.id, estado: 'PENDIENTE', version: p.pedido.version }, data: { estado: p.estado, resueltoEn: p.momento } });
  if (r.count !== 1) return false;
  await registrarEventoDeFormulario(tx, {
    tipo: HECHO_DEL_PEDIDO[p.estado],
    profesionalId: p.pedido.profesionalId,
    asesoradoId: p.pedido.asesoradoId,
    recurso: { tipo: 'PedidoDeAccesoAPlan', id: p.pedido.id },
    estadoPrevio: 'PENDIENTE',
    estadoPosterior: p.estado,
    actorId: p.actorId,
    procedencia: p.procedencia,
    momento: p.momento,
  });
  return true;
}

/**
 * Cuando la persona comparte con «resumen y plan» un área a un profesional (API-RES-02, desde «Quién ve qué», o API-RES-10),
 * el pedido de ese plan que esperaba de ese profesional queda aceptado: ya lo ve. Con los cerrojos de la autorización y de
 * los pedidos ya tomados, después de escribir la versión nueva.
 */
export async function aceptarLosPedidosDeQuienesVenElPlan(
  tx: Tx,
  p: { readonly personaId: string; readonly renglones: readonly RenglonDeResumen[]; readonly procedencia: Procedencia; readonly momento: Date },
): Promise<number> {
  const conPlan = p.renglones.filter((r) => r.nivel === 'SUMMARY_AND_PLAN');
  if (conPlan.length === 0) return 0;
  const pendientes = await tx.pedidoDeAccesoAPlan.findMany({ where: { asesoradoId: p.personaId, estado: 'PENDIENTE', profesionalId: { in: [...new Set(conPlan.map((r) => r.profesionalId))] } } });
  let n = 0;
  for (const pedido of pendientes) {
    if (!conPlan.some((r) => r.profesionalId === pedido.profesionalId && r.area === pedido.area)) continue;
    if (await resolverPedidoDePlan(tx, { pedido, estado: 'ACEPTADO', actorId: p.personaId, procedencia: p.procedencia, momento: p.momento })) n++;
  }
  return n;
}

/**
 * API-RES-09 · los pedidos que esperan la respuesta de la persona: solo de un componente de vínculo que hoy está aceptado
 * (en pausa no se muestran; terminado, ya no se responden), con el nombre del profesional. Del más nuevo al más viejo.
 */
export async function pedidosDePlanQueEsperan(tx: Tx, personaId: string): Promise<(FilaDePedido & { readonly nombre: string })[]> {
  const filas = await tx.pedidoDeAccesoAPlan.findMany({
    where: { asesoradoId: personaId, estado: 'PENDIENTE', alcanceDeVinculo: { estado: 'ACEPTADO' } },
    orderBy: [{ pedidoEn: 'desc' }, { momentoDeRegistro: 'desc' }],
  });
  if (filas.length === 0) return [];
  const perfiles = await tx.perfilProfesional.findMany({ where: { identidadId: { in: [...new Set(filas.map((f) => f.profesionalId))] } }, select: { identidadId: true, nombreVisible: true } });
  const nombres = new Map(perfiles.map((p) => [p.identidadId, nombreDeProfesional(p)] as const));
  return filas.map((f) => ({ ...f, nombre: nombres.get(f.profesionalId) ?? nombreDeProfesional(null) }));
}
