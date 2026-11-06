/**
 * DL-165 D-9 (WP-FORMULARIOS-RONDA-2, FR-10) · los hábitos de la persona y su autorización, en la base: lecturas, cerrojos
 * y las dos escrituras que viven en transacciones ajenas (API-FRI-04 y el cierre de cuenta). Las reglas son del dominio
 * (`habitos-de-la-persona.ts`); la base las vuelve a exigir (migración 20261105130100).
 *
 * **Cerrojos** (fuera del orden único de `prisma/concurrencia.ts`, y siempre al final de la transacción, después del A3 y del
 * PDP, para no invertirlo con nadie):
 * - los hábitos de una persona: exclusivo, para escribir una versión (FRI-04 y API-HBT-02). Ordena dos escrituras
 *   simultáneas: la segunda lee la versión que dejó la primera y sigue desde ahí;
 * - su autorización: exclusivo para escribir una versión (API-HBT-03 y 04, el cierre de cuenta) y **compartido para
 *   leerla** desde API-HBT-05. Así un retiro espera a las lecturas que ya empezaron, y toda lectura que empieza después ve
 *   el retiro: el corte es a futuro y en el momento (RNF-PRI-002).
 */
import {
  CAMPOS_DE_HABITOS,
  comoLosRecibe,
  ETIQUETA_DE_ALCANCE,
  habitosDespuesDeUnFormulario,
  parteDeHabitos,
  type Alcance,
  type CompartirHabitos,
  type ComponenteParaHabitos,
  type EstadoDelPedidoDeAcceso,
  type PedidoDeAccesoDelProfesional,
  type OrigenDeHabitos,
  type Procedencia,
  type ProfesionalDeLaPersona,
  type ProfesionalParaHabitos,
  type RenglonDeLaAutorizacion,
  type RespuestaDeCampoV2Entrada,
  type SeccionDePlantillaV2,
  type VersionDeHabitos,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import type { AutorizacionDeHabitos as FilaDeAutorizacion, HabitosDeLaPersona as FilaDeHabitos, PedidoDeAccesoAHabitos as FilaDePedido } from '@prisma/client';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { nombreDeProfesional } from '../vinculo/lectura';
import { registrarEventoDeFormulario } from './eventos';

type Tx = Prisma.TransactionClient;

const token = (n: number): string => `v${n}`;

// ─── Cerrojos ───────────────────────────────────────────────────────────────────────────────────

export async function tomarLosHabitos(tx: Tx, personaId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`habitos-de-la-persona|${personaId}`}, 0))`;
}

export async function tomarLaAutorizacion(tx: Tx, personaId: string, modo: 'escribir' | 'leer'): Promise<void> {
  const clave = `autorizacion-de-habitos|${personaId}`;
  if (modo === 'escribir') await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${clave}, 0))`;
  else await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(hashtextextended(${clave}, 0))`;
}

// ─── Los hábitos ────────────────────────────────────────────────────────────────────────────────

/** Lo que guarda `contenido`: el formato V2 de una respuesta, cada valor SELF_REPORTED. */
interface ContenidoDeHabitos {
  format: 2;
  answers: { fieldCode: string; answer: RespuestaDeCampoV2Entrada['answer']; provenance: 'SELF_REPORTED' }[];
}

export const contenidoDeHabitos = (respuestas: readonly RespuestaDeCampoV2Entrada[]): Prisma.InputJsonValue =>
  ({ format: 2, answers: respuestas.map((r) => ({ fieldCode: r.fieldCode, answer: r.answer, provenance: 'SELF_REPORTED' })) }) as unknown as Prisma.InputJsonValue;

/** Las respuestas de una versión, como entradas (sin la procedencia, que es siempre la misma). */
export function respuestasDeHabitos(fila: Pick<FilaDeHabitos, 'contenido'>): RespuestaDeCampoV2Entrada[] {
  const c = fila.contenido as unknown as ContenidoDeHabitos | null;
  return (c?.answers ?? []).filter((a) => CAMPOS_DE_HABITOS.includes(a.fieldCode)).map((a) => ({ fieldCode: a.fieldCode, answer: a.answer }));
}

const ORIGEN_API: Readonly<Record<FilaDeHabitos['origen'], OrigenDeHabitos>> = { FORMULARIO: 'FORM', MIS_HABITOS: 'MY_HABITS' };

export function versionDeHabitosApi(fila: FilaDeHabitos): VersionDeHabitos {
  return {
    habitsVersionId: fila.id,
    version: token(fila.version),
    answers: respuestasDeHabitos(fila).map((r) => ({ ...r, provenance: 'SELF_REPORTED' as const })),
    origin: ORIGEN_API[fila.origen],
    recordedAt: fila.momentoDeRegistro.toISOString(),
  };
}

export const origenApi = (fila: Pick<FilaDeHabitos, 'origen'>): OrigenDeHabitos => ORIGEN_API[fila.origen];

export function ultimaVersionDeHabitos(tx: Tx, personaId: string): Promise<FilaDeHabitos | null> {
  return tx.habitosDeLaPersona.findFirst({ where: { asesoradoId: personaId }, orderBy: { version: 'desc' } });
}

/** Cuántas versiones devuelve «Mis hábitos», como mucho: la vigente y la historia más reciente. */
export const VERSIONES_EN_MIS_HABITOS = 50;

export function versionesDeHabitos(tx: Tx, personaId: string): Promise<FilaDeHabitos[]> {
  return tx.habitosDeLaPersona.findMany({ where: { asesoradoId: personaId }, orderBy: { version: 'desc' }, take: VERSIONES_EN_MIS_HABITOS });
}

/** Una versión nueva, la que sigue a la vigente, con su hecho en la bitácora de los formularios. Con el cerrojo ya tomado. */
export async function agregarVersionDeHabitos(
  tx: Tx,
  p: {
    readonly personaId: string;
    readonly respuestas: readonly RespuestaDeCampoV2Entrada[];
    readonly origen: 'FORMULARIO' | 'MIS_HABITOS';
    readonly respuestaDeFormularioId: string | null;
    readonly anterior: Pick<FilaDeHabitos, 'version'> | null;
    readonly procedencia: Procedencia;
    readonly momento: Date;
  },
): Promise<FilaDeHabitos> {
  const version = (p.anterior?.version ?? 0) + 1;
  const fila = await tx.habitosDeLaPersona.create({
    data: {
      asesoradoId: p.personaId,
      version,
      contenido: contenidoDeHabitos(p.respuestas),
      origen: p.origen,
      respuestaDeFormularioId: p.respuestaDeFormularioId,
      procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      momentoDeOcurrencia: p.momento,
    },
  });
  await registrarEventoDeFormulario(tx, {
    tipo: 'VersionDeHabitosRegistrada',
    profesionalId: null,
    asesoradoId: p.personaId,
    recurso: { tipo: 'HabitosDeLaPersona', id: fila.id },
    estadoPrevio: p.anterior ? token(p.anterior.version) : null,
    estadoPosterior: token(version),
    actorId: p.personaId,
    procedencia: p.procedencia,
    momento: p.momento,
  });
  return fila;
}

/**
 * API-FRI-04 (§4.2; D-16): si la versión del formulario trae la parte «Tus hábitos», lo que la persona respondió ahí agrega
 * una versión de sus hábitos, en la misma transacción que la Respuesta: lo que el formulario preguntó de la parte reemplaza
 * lo vigente, lo que no preguntó queda como estaba. Sin la parte, o sin nada que agregar, no escribe nada. La Respuesta
 * guarda sus respuestas como siempre: por eso, sin la autorización, cada profesional sigue viendo solo lo de su formulario.
 * Va al final de FRI-04, con el cerrojo de los hábitos (después del PDP y de la Respuesta).
 */
export async function registrarHabitosDeUnFormulario(
  tx: Tx,
  p: {
    readonly personaId: string;
    readonly secciones: readonly SeccionDePlantillaV2[];
    readonly pedidos: readonly string[];
    readonly respuestas: readonly RespuestaDeCampoV2Entrada[];
    readonly respuestaDeFormularioId: string;
    readonly procedencia: Procedencia;
    readonly momento: Date;
  },
): Promise<FilaDeHabitos | null> {
  const parte = parteDeHabitos(p.secciones);
  if (!parte) return null;
  await tomarLosHabitos(tx, p.personaId);
  const vigente = await ultimaVersionDeHabitos(tx, p.personaId);
  const habitos = habitosDespuesDeUnFormulario({ parte, pedidos: p.pedidos, respondidas: p.respuestas, vigentes: vigente ? respuestasDeHabitos(vigente) : null });
  if (habitos === null) return null;
  return agregarVersionDeHabitos(tx, {
    personaId: p.personaId,
    respuestas: habitos,
    origen: 'FORMULARIO',
    respuestaDeFormularioId: p.respuestaDeFormularioId,
    anterior: vigente,
    procedencia: p.procedencia,
    momento: p.momento,
  });
}

// ─── La autorización ────────────────────────────────────────────────────────────────────────────

export interface AutorizacionVigente {
  readonly fila: FilaDeAutorizacion;
  /** Los renglones, si está ACTIVA; `null` si está RETIRADA. */
  readonly renglones: readonly RenglonDeLaAutorizacion[] | null;
  /** Desde cuándo está activa sin un retiro en el medio; `null` si está RETIRADA. */
  readonly activaDesde: Date | null;
}

/** La última versión de la autorización de la persona, con su lista si está ACTIVA. `null` si nunca la dio. */
export async function autorizacionVigente(tx: Tx, personaId: string): Promise<AutorizacionVigente | null> {
  const filas = await tx.autorizacionDeHabitos.findMany({ where: { asesoradoId: personaId }, orderBy: { version: 'desc' }, include: { destinatarios: true } });
  const ultima = filas[0];
  if (!ultima) return null;
  if (ultima.estado !== 'ACTIVA') return { fila: ultima, renglones: null, activaDesde: null };
  // La primera ACTIVA de la racha: hacia atrás, mientras siga ACTIVA.
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
      incluido: d.estado === 'LOS_RECIBE',
      incluidoDesde: d.incluidoDesde?.toISOString() ?? null,
    })),
    activaDesde: desde,
  };
}

export function compartirApi(vigente: AutorizacionVigente | null): CompartirHabitos {
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

/** Los profesionales de la persona con algún componente de vínculo sin terminar (aceptado o en pausa), con su nombre. */
export async function profesionalesDeLaPersona(tx: Tx, personaId: string): Promise<(ProfesionalDeLaPersona & { readonly nombre: string })[]> {
  const filas = await tx.$queryRaw<{ profesional_id: string; alcance_de_vinculo_id: string; alcance: Alcance; estado: 'ACEPTADO' | 'PAUSADO'; nombre: string | null }[]>`
    SELECT vi."profesional_id"::text AS "profesional_id", av."id"::text AS "alcance_de_vinculo_id", av."alcance"::text AS "alcance",
           av."estado"::text AS "estado", pp."nombre_visible" AS "nombre"
      FROM "alcance_de_vinculo" av
      JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
      LEFT JOIN "perfil_profesional" pp ON pp."identidad_id" = vi."profesional_id"
     WHERE vi."asesorado_id" = ${personaId}::uuid AND av."estado" <> 'FINALIZADO'
     ORDER BY vi."profesional_id", av."alcance"`;
  const porProfesional = new Map<string, { nombre: string; componentes: ComponenteParaHabitos[] }>();
  for (const f of filas) {
    const p = porProfesional.get(f.profesional_id) ?? { nombre: nombreDeProfesional(f.nombre === null ? null : { nombreVisible: f.nombre }), componentes: [] };
    p.componentes.push({ alcanceDeVinculoId: f.alcance_de_vinculo_id, alcance: f.alcance, estado: f.estado });
    porProfesional.set(f.profesional_id, p);
  }
  return [...porProfesional.entries()].map(([profesionalId, p]) => ({ profesionalId, nombre: p.nombre, componentes: p.componentes }));
}

/** Lo que la autorización dice de cada profesional, en el orden de sus nombres. */
export function profesionalesApi(profesionales: readonly (ProfesionalDeLaPersona & { readonly nombre: string })[], vigente: AutorizacionVigente | null): ProfesionalParaHabitos[] {
  const renglones = vigente?.renglones ?? null;
  return profesionales
    .map((p) => {
      const como = comoLosRecibe(p.componentes, p.profesionalId, renglones);
      return {
        professional: { identityId: p.profesionalId, displayName: p.nombre },
        scopes: [...new Set(p.componentes.map((c) => c.alcance))].map((code) => ({ code, label: ETIQUETA_DE_ALCANCE[code] })),
        link: p.componentes.some((c) => c.estado === 'ACEPTADO') ? ('ACTIVE' as const) : ('PAUSED' as const),
        sharing: como.sharing,
        sharedSince: como.sharedSince,
      };
    })
    .sort((a, b) => a.professional.displayName.localeCompare(b.professional.displayName, 'es') || a.professional.identityId.localeCompare(b.professional.identityId));
}

/**
 * Una versión nueva de la autorización, la que sigue a la última, con su hecho. Con el cerrojo de escribir ya tomado. Si
 * queda ACTIVA, guarda el texto aceptado (con su hash) y sus renglones.
 */
export async function agregarVersionDeAutorizacion(
  tx: Tx,
  p: {
    readonly personaId: string;
    readonly anterior: FilaDeAutorizacion | null;
    readonly estado: 'ACTIVA' | 'RETIRADA';
    readonly texto: { readonly id: string; readonly hash: string } | null;
    readonly renglones: readonly RenglonDeLaAutorizacion[];
    readonly procedencia: Procedencia;
    readonly momento: Date;
  },
): Promise<FilaDeAutorizacion> {
  const version = (p.anterior?.version ?? 0) + 1;
  const fila = await tx.autorizacionDeHabitos.create({
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
    await tx.destinatarioDeHabitos.createMany({
      data: p.renglones.map((r) => ({
        autorizacionId: fila.id,
        alcanceDeVinculoId: r.alcanceDeVinculoId,
        profesionalId: r.profesionalId,
        estado: r.incluido ? ('LOS_RECIBE' as const) : ('NO_LOS_RECIBE' as const),
        incluidoDesde: r.incluidoDesde ? new Date(r.incluidoDesde) : null,
      })),
    });
  }
  const tipo = p.estado === 'RETIRADA' ? 'AutorizacionDeHabitosRetirada' : p.anterior?.estado === 'ACTIVA' ? 'AutorizacionDeHabitosModificada' : 'AutorizacionDeHabitosActivada';
  await registrarEventoDeFormulario(tx, {
    tipo,
    profesionalId: null,
    asesoradoId: p.personaId,
    recurso: { tipo: 'AutorizacionDeHabitos', id: fila.id },
    estadoPrevio: p.anterior ? `${p.anterior.estado} ${token(p.anterior.version)}` : null,
    estadoPosterior: `${p.estado} ${token(version)}`,
    actorId: p.personaId,
    procedencia: p.procedencia,
    momento: p.momento,
  });
  return fila;
}

/**
 * Cerrar la cuenta retira la autorización (§4.5): en la transacción del cierre, después de los vínculos y de las
 * propuestas, una versión RETIRADA si la última está ACTIVA. El actor es la persona, que cerró su cuenta.
 */
export async function retirarAutorizacionDeHabitosPorCierre(tx: Tx, p: { readonly personaId: string; readonly procedencia: Procedencia; readonly momento: Date }): Promise<boolean> {
  await tomarLaAutorizacion(tx, p.personaId, 'escribir');
  const vigente = await autorizacionVigente(tx, p.personaId);
  if (!vigente || vigente.fila.estado !== 'ACTIVA') return false;
  await agregarVersionDeAutorizacion(tx, { personaId: p.personaId, anterior: vigente.fila, estado: 'RETIRADA', texto: null, renglones: [], procedencia: p.procedencia, momento: p.momento });
  return true;
}

/** La hora de la base para una escritura de hábitos, tomada después de los cerrojos. */
export const momentoDeLosHabitos = momentoDeLaBase;

// ─── Ronda 2.1 (2026-11-06) · los pedidos de acceso (D-17 nueva; D-23 a D-25) ───────────────────

/**
 * Los pedidos de acceso de una persona, con un cerrojo de transacción por persona: exclusivo para crear o resolver uno. Se
 * toma después del de la autorización (que va antes en API-HBT-03, 06 y 09): el orden es el mismo en todas.
 */
export async function tomarLosPedidos(tx: Tx, personaId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`pedidos-de-acceso-a-habitos|${personaId}`}, 0))`;
}

/** Para quien lo hizo: esperando la respuesta, o respondido (aceptado, «no, por ahora» o reemplazado), sin decir qué. */
const ESTADO_DEL_PEDIDO_API: Readonly<Record<FilaDePedido['estado'], EstadoDelPedidoDeAcceso>> = {
  PENDIENTE: 'PENDING',
  ACEPTADO: 'ANSWERED',
  NO_POR_AHORA: 'ANSWERED',
  REEMPLAZADO: 'ANSWERED',
};

export function pedidoDelProfesionalApi(f: FilaDePedido): PedidoDeAccesoDelProfesional {
  return { accessRequestId: f.id, scope: f.alcance, status: ESTADO_DEL_PEDIDO_API[f.estado], requestedAt: f.pedidoEn.toISOString() };
}

/** El último pedido de este profesional a esta persona, en cualquier estado: de él salen el límite de 7 días y lo que ve. */
export function ultimoPedidoDelProfesional(tx: Tx, profesionalId: string, personaId: string): Promise<FilaDePedido | null> {
  return tx.pedidoDeAccesoAHabitos.findFirst({ where: { profesionalId, asesoradoId: personaId }, orderBy: [{ pedidoEn: 'desc' }, { momentoDeRegistro: 'desc' }] });
}

type EstadoResuelto = 'ACEPTADO' | 'NO_POR_AHORA' | 'REEMPLAZADO';
const HECHO_DEL_PEDIDO = {
  PENDIENTE: 'PedidoDeAccesoAHabitosHecho',
  ACEPTADO: 'PedidoDeAccesoAHabitosAceptado',
  NO_POR_AHORA: 'PedidoDeAccesoAHabitosNoPorAhora',
  REEMPLAZADO: 'PedidoDeAccesoAHabitosReemplazado',
} as const;

/** Un pedido nuevo, PENDIENTE, con su hecho. Con el cerrojo de los pedidos ya tomado. */
export async function crearPedidoDeAcceso(
  tx: Tx,
  p: { readonly profesionalId: string; readonly personaId: string; readonly alcanceDeVinculoId: string; readonly alcance: Alcance; readonly procedencia: Procedencia; readonly momento: Date },
): Promise<FilaDePedido> {
  const fila = await tx.pedidoDeAccesoAHabitos.create({
    data: {
      profesionalId: p.profesionalId,
      asesoradoId: p.personaId,
      alcanceDeVinculoId: p.alcanceDeVinculoId,
      alcance: p.alcance,
      pedidoEn: p.momento,
      procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
    },
  });
  await registrarEventoDeFormulario(tx, {
    tipo: HECHO_DEL_PEDIDO.PENDIENTE,
    profesionalId: p.profesionalId,
    asesoradoId: p.personaId,
    recurso: { tipo: 'PedidoDeAccesoAHabitos', id: fila.id },
    estadoPrevio: null,
    estadoPosterior: 'PENDIENTE',
    actorId: p.profesionalId,
    procedencia: p.procedencia,
    momento: p.momento,
  });
  return fila;
}

/**
 * Resolver un pedido que espera, una sola vez, con su hecho: `false` si ya no esperaba (otra operación lo resolvió en el
 * medio). El actor es quien lo resuelve: la persona (aceptar, «no, por ahora») o el profesional (un pedido nuevo lo reemplaza).
 */
export async function resolverPedidoDeAcceso(
  tx: Tx,
  p: {
    readonly pedido: Pick<FilaDePedido, 'id' | 'version' | 'profesionalId' | 'asesoradoId'>;
    readonly estado: EstadoResuelto;
    readonly actorId: string;
    readonly procedencia: Procedencia;
    readonly momento: Date;
  },
): Promise<boolean> {
  const r = await tx.pedidoDeAccesoAHabitos.updateMany({ where: { id: p.pedido.id, estado: 'PENDIENTE', version: p.pedido.version }, data: { estado: p.estado, resueltoEn: p.momento } });
  if (r.count !== 1) return false;
  await registrarEventoDeFormulario(tx, {
    tipo: HECHO_DEL_PEDIDO[p.estado],
    profesionalId: p.pedido.profesionalId,
    asesoradoId: p.pedido.asesoradoId,
    recurso: { tipo: 'PedidoDeAccesoAHabitos', id: p.pedido.id },
    estadoPrevio: 'PENDIENTE',
    estadoPosterior: p.estado,
    actorId: p.actorId,
    procedencia: p.procedencia,
    momento: p.momento,
  });
  return true;
}

/**
 * D-25 · cuando la persona comparte con alguien (API-HBT-03 desde «Mis hábitos», también con la 0.21, o API-HBT-09), el
 * pedido que esperaba de ese profesional queda aceptado: ya los ve. Con los cerrojos de la autorización y de los pedidos ya
 * tomados, después de escribir la versión nueva.
 */
export async function aceptarLosPedidosDeQuienesLosReciben(
  tx: Tx,
  p: { readonly personaId: string; readonly renglones: readonly RenglonDeLaAutorizacion[]; readonly procedencia: Procedencia; readonly momento: Date },
): Promise<number> {
  const reciben = [...new Set(p.renglones.filter((r) => r.incluido).map((r) => r.profesionalId))];
  if (reciben.length === 0) return 0;
  const pendientes = await tx.pedidoDeAccesoAHabitos.findMany({ where: { asesoradoId: p.personaId, estado: 'PENDIENTE', profesionalId: { in: reciben } } });
  let n = 0;
  for (const pedido of pendientes) if (await resolverPedidoDeAcceso(tx, { pedido, estado: 'ACEPTADO', actorId: p.personaId, procedencia: p.procedencia, momento: p.momento })) n++;
  return n;
}

/**
 * API-HBT-08 · los pedidos que esperan la respuesta de la persona: solo de un componente de vínculo que hoy está aceptado
 * (en pausa no se muestran; terminado, ya no se responden), con el nombre del profesional. Del más nuevo al más viejo.
 */
export async function pedidosQueEsperan(tx: Tx, personaId: string): Promise<(FilaDePedido & { readonly nombre: string })[]> {
  const filas = await tx.pedidoDeAccesoAHabitos.findMany({
    where: { asesoradoId: personaId, estado: 'PENDIENTE', alcanceDeVinculo: { estado: 'ACEPTADO' } },
    orderBy: [{ pedidoEn: 'desc' }, { momentoDeRegistro: 'desc' }],
  });
  if (filas.length === 0) return [];
  const perfiles = await tx.perfilProfesional.findMany({ where: { identidadId: { in: [...new Set(filas.map((f) => f.profesionalId))] } }, select: { identidadId: true, nombreVisible: true } });
  const nombres = new Map(perfiles.map((p) => [p.identidadId, nombreDeProfesional(p)] as const));
  return filas.map((f) => ({ ...f, nombre: nombres.get(f.profesionalId) ?? nombreDeProfesional(null) }));
}

/**
 * API-HBT-07 (D-22) · lo más nuevo que este profesional ve de los hábitos de la persona por sus propias solicitudes, y desde
 * cuándo espera una: solo las suyas, en las áreas que el PDP le permite hoy, de versiones con la parte «Tus hábitos» y que
 * pidieron alguna pregunta de la parte. Nunca mira lo que la persona le contó a otro profesional.
 */
export async function habitosDeSusSolicitudes(
  tx: Tx,
  p: { readonly profesionalId: string; readonly personaId: string; readonly alcances: readonly Alcance[] },
): Promise<{ readonly respondidaEl: Date | null; readonly pendienteDesde: Date | null }> {
  const solicitudes = await tx.solicitudDeFormulario.findMany({
    where: { profesionalId: p.profesionalId, asesoradoId: p.personaId, alcance: { in: [...p.alcances] } },
    select: { momentoDeRegistro: true, camposSolicitados: true, templateVersion: { select: { contenido: true } }, respuesta: { select: { momentoDeRegistro: true } } },
  });
  let respondidaEl: Date | null = null;
  let pendienteDesde: Date | null = null;
  for (const s of solicitudes) {
    const secciones = (s.templateVersion.contenido as { sections?: SeccionDePlantillaV2[] } | null)?.sections ?? [];
    const parte = parteDeHabitos(secciones);
    if (!parte) continue;
    const pedidos = new Set(Array.isArray(s.camposSolicitados) ? (s.camposSolicitados as string[]) : []);
    if (!parte.fields.some((c) => pedidos.has(c.fieldCode))) continue;
    if (s.respuesta) {
      if (!respondidaEl || s.respuesta.momentoDeRegistro > respondidaEl) respondidaEl = s.respuesta.momentoDeRegistro;
    } else if (!pendienteDesde || s.momentoDeRegistro < pendienteDesde) {
      pendienteDesde = s.momentoDeRegistro;
    }
  }
  return { respondidaEl, pendienteDesde };
}
