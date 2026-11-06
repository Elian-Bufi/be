import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  compartirAlAceptarUnPedido,
  CompartirHabitosRequestSchema,
  DejarDeCompartirHabitosRequestSchema,
  desdeCuandoLosRecibe,
  ETIQUETA_DE_ALCANCE,
  habitosEnOrden,
  PedirAccesoAHabitosRequestSchema,
  problemasDelPedidoDeCompartir,
  puedePedirAcceso,
  RegistrarHabitosRequestSchema,
  renglonesDeLaAutorizacion,
  ResponderPedidoDeAccesoRequestSchema,
  SECCION_DE_HABITOS,
  SOLICITUD_DE_MIS_HABITOS,
  VERSION_VIGENTE,
  VERSIONES_PROPUESTAS,
  type HabitosCompartidosResponse,
  type HabitosParaElProfesionalResponse,
  type MisHabitosResponse,
  type PedidosDeAccesoResponse,
  type TextoDeCompartirHabitos,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { PublicadorDeNovedades } from '../novedades/publicador';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import {
  aceptarLosPedidosDeQuienesLosReciben,
  agregarVersionDeAutorizacion,
  agregarVersionDeHabitos,
  autorizacionVigente,
  compartirApi,
  crearPedidoDeAcceso,
  habitosDeSusSolicitudes,
  momentoDeLosHabitos,
  origenApi,
  pedidoDelProfesionalApi,
  pedidosQueEsperan,
  profesionalesApi,
  profesionalesDeLaPersona,
  resolverPedidoDeAcceso,
  respuestasDeHabitos,
  tomarLaAutorizacion,
  tomarLosHabitos,
  tomarLosPedidos,
  ultimaVersionDeHabitos,
  ultimoPedidoDelProfesional,
  versionDeHabitosApi,
  versionesDeHabitos,
} from './habitos-de-la-persona';
import { exigirRespuestasValidas } from './lectura-formularios-v2';

type Tx = Prisma.TransactionClient;

/** La persona declara y comparte lo suyo (UC-P33); el profesional lee lo que ella le comparte (UC-P32). */
const DE_LA_PERSONA = 'UC-P33';
const DEL_PROFESIONAL = 'UC-P32';

const token = (n: number): string => `v${n}`;

/** El texto del acto que se muestra para compartir o sumar a alguien: el vigente de su tipo, hoy una propuesta. */
function textoDelActo(): TextoDeCompartirHabitos {
  const v = VERSION_VIGENTE.HABITOS_COMPARTIDOS;
  return { id: v.id, title: v.titulo, text: v.texto, textHash: v.hash, effectiveFrom: v.vigenteDesde, approval: VERSIONES_PROPUESTAS.has(v.id) ? 'PENDING_APPROVAL' : 'APPROVED' };
}

/** El 404 de lo inexistente, idéntico, cuando la persona no le comparte sus hábitos a este profesional: el motivo, solo en la auditoría. */
const noLosComparte = (): ErrorDeApi => new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, 'HABITOS_NO_COMPARTIDOS');

/**
 * API-HBT-01 a 05 — los hábitos de la persona y la autorización para compartirlos (DL-165 D-9; WP-FORMULARIOS-RONDA-2
 * §4.2 a §4.5). Lo que garantiza este servicio, con la base detrás (migración 20261105130100):
 * - **los hábitos son de la persona**: solo ella los lee completos (con su historia) y los escribe, con su A3 vigente
 *   (08:406). Cada escritura es una versión nueva, con Idempotency-Key, auditoría y su hecho (como FRI);
 * - **la autorización es suya y explícita**: la da, la cambia y la retira ella, con la versión del texto que vio. Ampliar
 *   la lista es una aceptación nueva (08 C-12); un profesional que la acompaña después no la recibe solo;
 * - **retirarla no exige el A3**: siempre se puede (RNF-PRI-002). Corta a futuro y para todos: una lectura de API-HBT-05
 *   que empieza después del retiro ya lo ve (el cerrojo compartido de la autorización);
 * - **el profesional** los ve solo si la autorización está activa y lo nombra con un componente que el PDP permite hoy.
 *   Si no, el mismo 404 que lo inexistente: no se entera de que hay hábitos ni de que otro profesional los ve.
 * Ronda 2.1 (D-17 nueva de Dirección, 2026-11-06), API-HBT-06 a 09: **el profesional puede pedir acceso** y a la persona le
 * llega como una novedad importante; **la persona siempre decide**, con «Sí, que los vea» (es compartir, con el A3 y el
 * texto) o «No, por ahora», y lo puede cambiar cuando quiera en «Mis hábitos». Lo que el profesional sabe sale solo de lo
 * que él ya puede ver (D-22). El límite para que no sea insistente: una pendiente por vez y 7 días entre pedidos (D-24).
 */
@Injectable()
export class HabitosService {
  constructor(
    private readonly ejecutor: EjecutorDeFormularios,
    private readonly pdp: PdpService,
    private readonly publicador: PublicadorDeNovedades,
  ) {}

  // ─── API-HBT-01 · Mis hábitos ───────────────────────────────────────────────────────────────
  mios(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<MisHabitosResponse> {
    return this.ejecutor.leer({
      operacion: 'API-HBT-01',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirA3Vigente(tx, actor.identidadId);
        const [versiones, vigente, profesionales] = await Promise.all([
          versionesDeHabitos(tx, actor.identidadId),
          autorizacionVigente(tx, actor.identidadId),
          profesionalesDeLaPersona(tx, actor.identidadId),
        ]);
        const [actual, ...anteriores] = versiones.map(versionDeHabitosApi);
        return {
          data: {
            section: SECCION_DE_HABITOS,
            current: actual ?? null,
            history: anteriores,
            sharing: compartirApi(vigente),
            professionals: profesionalesApi(profesionales, vigente),
            text: textoDelActo(),
          },
        };
      },
    });
  }

  // ─── API-HBT-02 · una versión nueva desde «Mis hábitos» ─────────────────────────────────────
  registrar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-HBT-02',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: RegistrarHabitosRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        // Una escritura propia que no pasa por el PDP: el A3, con el acto tomado (DL-115).
        await exigirA3Vigente(tx, personaId, { bloquear: true });
        exigirRespuestasValidas([SECCION_DE_HABITOS], SOLICITUD_DE_MIS_HABITOS, pedido.answers, { exigirObligatorios: false });
        await tomarLosHabitos(tx, personaId);
        const vigente = await ultimaVersionDeHabitos(tx, personaId);
        // Lo que se vio tiene que ser la vigente: si entró otra (otro formulario, otro teléfono), no se pisa en silencio.
        if ((vigente ? token(vigente.version) : null) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const momento = await momentoDeLosHabitos(tx);
        const fila = await agregarVersionDeHabitos(tx, {
          personaId,
          respuestas: habitosEnOrden(pedido.answers),
          origen: 'MIS_HABITOS',
          respuestaDeFormularioId: null,
          anterior: vigente,
          procedencia,
          momento,
        });
        return { estadoHttp: 201, cuerpo: { data: versionDeHabitosApi(fila) }, sujetoId: personaId, recurso: { tipo: 'HabitosDeLaPersona', id: fila.id } };
      },
    });
  }

  // ─── API-HBT-03 · compartirlos, o cambiar con quiénes ───────────────────────────────────────
  compartir(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-HBT-03',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CompartirHabitosRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        await exigirA3Vigente(tx, personaId, { bloquear: true });
        // La versión mostrada es la aceptada (08 §12.2): la vigente del tipo, como en CON-02.
        const texto = VERSION_VIGENTE.HABITOS_COMPARTIDOS;
        if (pedido.textVersionId !== texto.id) throw errores.versionDeConsentimientoVieja();
        await tomarLaAutorizacion(tx, personaId, 'escribir');
        const vigente = await autorizacionVigente(tx, personaId);
        if ((vigente ? token(vigente.fila.version) : null) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const profesionales = await profesionalesDeLaPersona(tx, personaId);
        const issues = problemasDelPedidoDeCompartir(new Set(profesionales.map((p) => p.profesionalId)), pedido.professionalIds, pedido.declinedProfessionalIds);
        if (issues.length > 0) throw new ErrorDeApi(422, CodigoDeError.HABITS_RECIPIENT_NOT_AVAILABLE, 'Uno de los profesionales nombrados no te acompaña hoy, o está repetido.', { issues });
        const momento = await momentoDeLosHabitos(tx);
        const renglones = renglonesDeLaAutorizacion({
          profesionales,
          anteriores: vigente?.renglones ?? null,
          incluidos: new Set(pedido.professionalIds.map((id) => id.toLowerCase())),
          declinados: new Set(pedido.declinedProfessionalIds.map((id) => id.toLowerCase())),
          ahora: momento.toISOString(),
        });
        const fila = await agregarVersionDeAutorizacion(tx, { personaId, anterior: vigente?.fila ?? null, estado: 'ACTIVA', texto: { id: texto.id, hash: texto.hash }, renglones, procedencia, momento });
        // Ronda 2.1 (D-25): si alguien que pidió acceso ahora los recibe, su pedido queda aceptado. Vale también para la APK
        // 0.21, que no conoce los pedidos: sumarlo desde «Mis hábitos» es responderle que sí.
        await tomarLosPedidos(tx, personaId);
        await aceptarLosPedidosDeQuienesLosReciben(tx, { personaId, renglones, procedencia, momento });
        return { estadoHttp: 200, cuerpo: await this.estado(tx, personaId), sujetoId: personaId, recurso: { tipo: 'AutorizacionDeHabitos', id: fila.id } };
      },
    });
  }

  // ─── API-HBT-04 · dejar de compartirlos ─────────────────────────────────────────────────────
  dejarDeCompartir(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-HBT-04',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: DejarDeCompartirHabitosRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        // Sin el A3: retirar siempre se puede (RNF-PRI-002), como revocar.
        await tomarLaAutorizacion(tx, personaId, 'escribir');
        const vigente = await autorizacionVigente(tx, personaId);
        if (!vigente || vigente.fila.estado !== 'ACTIVA' || token(vigente.fila.version) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const momento = await momentoDeLosHabitos(tx);
        const fila = await agregarVersionDeAutorizacion(tx, { personaId, anterior: vigente.fila, estado: 'RETIRADA', texto: null, renglones: [], procedencia, momento });
        return { estadoHttp: 200, cuerpo: await this.estado(tx, personaId), sujetoId: personaId, recurso: { tipo: 'AutorizacionDeHabitos', id: fila.id } };
      },
    });
  }

  // ─── API-HBT-05 · lo que ve el profesional ──────────────────────────────────────────────────
  deLaPersona(actor: ActorAutenticado, adviseeId: string, ctx: ContextoDeSolicitud): Promise<HabitosCompartidosResponse> {
    const recurso = { tipo: 'HabitosDeLaPersona', id: adviseeId };
    return this.ejecutor.leer({
      operacion: 'API-HBT-05',
      casoDeUso: DEL_PROFESIONAL,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-HBT-05', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        // El PDP primero, para el par: vínculo aceptado (ni en pausa ni terminado), B2, cuentas y el A3 de la persona. Sin
        // ningún alcance permitido, el 404 con la decisión registrada. Cada lectura queda en el registro de accesos.
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(
          tx,
          { operacion: 'API-HBT-05', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: personaId, recurso: { tipo: 'HabitosDeLaPersona', id: personaId } },
          ctx,
        );
        // La autorización, con su cerrojo compartido: un retiro que empezó antes ya está confirmado cuando se lee.
        await tomarLaAutorizacion(tx, personaId, 'leer');
        const vigente = await autorizacionVigente(tx, personaId);
        const desde = desdeCuandoLosRecibe(actor.identidadId, permitidos.map((p) => p.alcanceDeVinculoId), vigente?.renglones ?? null);
        if (desde === null) throw noLosComparte();
        const actual = await ultimaVersionDeHabitos(tx, personaId);
        return {
          data: {
            section: SECCION_DE_HABITOS,
            sharedSince: desde,
            current: actual
              ? { answers: respuestasDeHabitos(actual).map((r) => ({ ...r, provenance: 'SELF_REPORTED' as const })), recordedAt: actual.momentoDeRegistro.toISOString(), origin: origenApi(actual) }
              : null,
          },
        };
      },
    });
  }

  // ─── Ronda 2.1 (D-17 nueva) · API-HBT-06 · el profesional pide acceso ───────────────────────────
  /**
   * El profesional le pide a la persona ver sus hábitos, desde un área en la que la acompaña. No cambia ningún acceso: le
   * llega a ella una novedad importante (con el aviso push genérico) y lo decide ella (D-23). El límite (D-24): una
   * pendiente por vez y volver a pedir recién a los 7 días del último; un pedido nuevo reemplaza al pendiente.
   */
  pedirAcceso(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'Asesorado', id: adviseeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-HBT-06',
      casoDeUso: DEL_PROFESIONAL,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: PedirAccesoAHabitosRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        // Primero la autorización, como FRM-03: a quien no puede pedir, el 404 de lo inexistente, con la decisión registrada.
        // El PDP decide el par en las tres áreas (vínculo aceptado, ni en pausa ni terminado, B2, cuentas y el A3 de la
        // persona): el área del pedido tiene que estar entre las permitidas, y con ellas se sabe si ya los recibe.
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-HBT-06', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(
          tx,
          { operacion: 'API-HBT-06', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: personaId, recurso },
          ctx,
        );
        const delArea = permitidos.find((p) => p.alcance === pedido.scope);
        if (!delArea) {
          // Esa área no está permitida (aunque otra sí): la decisión de esa área, con su dimensión real, da el 404.
          await this.pdp.decidirEnTransaccion(tx, { operacion: 'API-HBT-06', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: personaId, alcance: pedido.scope, recurso }, ctx);
          throw this.ejecutor.noRevelable({ operacion: 'API-HBT-06', actorId: actor.identidadId, recurso, sujetoId: personaId, alcance: pedido.scope }, ctx);
        }
        // Si ya los recibe, no hay nada que pedir: lo sabe por API-HBT-05. El cerrojo compartido de la autorización ordena
        // este pedido con un retiro o un cambio que esté en curso.
        await tomarLaAutorizacion(tx, personaId, 'leer');
        const vigente = await autorizacionVigente(tx, personaId);
        const losRecibe = desdeCuandoLosRecibe(actor.identidadId, permitidos.map((p) => p.alcanceDeVinculoId), vigente?.renglones ?? null) !== null;
        await tomarLosPedidos(tx, personaId);
        const momento = await momentoDeLosHabitos(tx);
        const ultimo = await ultimoPedidoDelProfesional(tx, actor.identidadId, personaId);
        const puede = puedePedirAcceso({ losRecibe, ultimoPedidoEl: ultimo?.pedidoEn.toISOString() ?? null, ahora: momento.toISOString() });
        if (!puede.puede) {
          if (puede.motivo === 'YA_LOS_RECIBE') throw new ErrorDeApi(422, CodigoDeError.HABITS_ALREADY_SHARED, 'La persona ya te comparte sus hábitos.');
          throw new ErrorDeApi(422, CodigoDeError.HABITS_ACCESS_REQUEST_TOO_SOON, 'Ya le pediste acceso hace menos de 7 días.', { availableFrom: puede.desde as string });
        }
        // Uno pendiente de hace 7 días o más: el nuevo lo reemplaza (sigue habiendo uno solo).
        if (ultimo && ultimo.estado === 'PENDIENTE') {
          await resolverPedidoDeAcceso(tx, { pedido: ultimo, estado: 'REEMPLAZADO', actorId: actor.identidadId, procedencia, momento });
        }
        const fila = await crearPedidoDeAcceso(tx, { profesionalId: actor.identidadId, personaId, alcanceDeVinculoId: delArea.alcanceDeVinculoId, alcance: pedido.scope, procedencia, momento });
        // La novedad nace en la misma transacción; el aviso push sale después, genérico, sin nombres ni datos (DL-133).
        await this.publicador.publicar(
          tx,
          [
            {
              tipo: 'PEDIDO_DE_ACCESO_A_HABITOS',
              destinatarioId: personaId,
              alcance: pedido.scope,
              fuenteId: actor.identidadId,
              referencia: { tipo: 'PedidoDeAccesoAHabitos', id: fila.id },
              identidadDelHecho: fila.id,
              momentoDeOcurrencia: momento,
            },
          ],
          procedencia,
        );
        return { estadoHttp: 201, cuerpo: { data: pedidoDelProfesionalApi(fila) }, sujetoId: personaId, recurso: { tipo: 'PedidoDeAccesoAHabitos', id: fila.id } };
      },
    });
  }

  // ─── Ronda 2.1 · API-HBT-07 · lo que el profesional sabe de los hábitos de la persona ─────────────
  /**
   * Sin ver ningún hábito: si los recibe, lo más nuevo que ve (sus respuestas con la parte o lo compartido), desde cuándo
   * espera una solicitud suya con la parte, su último pedido y si puede pedir. Solo de lo que él ya puede ver (D-22).
   */
  paraElProfesional(actor: ActorAutenticado, adviseeId: string, ctx: ContextoDeSolicitud): Promise<HabitosParaElProfesionalResponse> {
    const recurso = { tipo: 'HabitosDeLaPersona', id: adviseeId };
    return this.ejecutor.leer({
      operacion: 'API-HBT-07',
      casoDeUso: DEL_PROFESIONAL,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-HBT-07', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(
          tx,
          { operacion: 'API-HBT-07', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: personaId, recurso: { tipo: 'HabitosDeLaPersona', id: personaId } },
          ctx,
        );
        await tomarLaAutorizacion(tx, personaId, 'leer');
        const vigente = await autorizacionVigente(tx, personaId);
        const desde = desdeCuandoLosRecibe(actor.identidadId, permitidos.map((p) => p.alcanceDeVinculoId), vigente?.renglones ?? null);
        const alcances = [...new Set(permitidos.map((p) => p.alcance))];
        const [propias, ultimo, actual, momento] = await Promise.all([
          habitosDeSusSolicitudes(tx, { profesionalId: actor.identidadId, personaId, alcances }),
          ultimoPedidoDelProfesional(tx, actor.identidadId, personaId),
          desde !== null ? ultimaVersionDeHabitos(tx, personaId) : Promise.resolve(null),
          momentoDeLosHabitos(tx),
        ]);
        const vistos = [propias.respondidaEl, actual?.momentoDeRegistro ?? null].filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime());
        const puede = puedePedirAcceso({ losRecibe: desde !== null, ultimoPedidoEl: ultimo?.pedidoEn.toISOString() ?? null, ahora: momento.toISOString() });
        return {
          data: {
            scopes: alcances,
            receives: desde !== null,
            sharedSince: desde,
            latestSeenAt: vistos[0]?.toISOString() ?? null,
            pendingHabitsRequestSince: propias.pendienteDesde?.toISOString() ?? null,
            accessRequest: ultimo ? pedidoDelProfesionalApi(ultimo) : null,
            canRequestAccess: puede.puede,
            canRequestAccessFrom: !puede.puede && puede.motivo === 'MUY_PRONTO' ? puede.desde : null,
          },
        };
      },
    });
  }

  // ─── Ronda 2.1 · API-HBT-08 · los pedidos que esperan la respuesta de la persona ────────────────
  pedidosQueEsperan(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<PedidosDeAccesoResponse> {
    return this.ejecutor.leer({
      operacion: 'API-HBT-08',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        // Como «Mis hábitos»: sin el A3, lo propio no se lee (08:406).
        await exigirA3Vigente(tx, actor.identidadId);
        const filas = await pedidosQueEsperan(tx, actor.identidadId);
        return {
          data: filas.map((f) => ({
            accessRequestId: f.id,
            version: token(f.version),
            professional: { identityId: f.profesionalId, displayName: f.nombre },
            scope: { code: f.alcance, label: ETIQUETA_DE_ALCANCE[f.alcance] },
            requestedAt: f.pedidoEn.toISOString(),
          })),
        };
      },
    });
  }

  // ─── Ronda 2.1 · API-HBT-09 · la persona responde ───────────────────────────────────────────────
  /**
   * «Sí, que los vea» es compartir (como API-HBT-03, con el A3 y el texto vigente): suma a quien pidió, o activa la
   * autorización solo para él (D-25). «No, por ahora» solo resuelve el pedido: no cambia la autorización ni pide el A3.
   */
  responderPedido(actor: ActorAutenticado, accessRequestId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'PedidoDeAccesoAHabitos', id: accessRequestId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-HBT-09',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: ResponderPedidoDeAccesoRequestSchema,
      cuerpo,
      huellaExtra: { accessRequestId },
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        const comparte = pedido.answer === 'SHARE';
        // Compartir es lo propio con el A3, con el acto tomado (DL-115), como API-HBT-03; decir que no siempre se puede.
        if (comparte) await exigirA3Vigente(tx, personaId, { bloquear: true });
        const texto = VERSION_VIGENTE.HABITOS_COMPARTIDOS;
        if (pedido.sharing && pedido.sharing.textVersionId !== texto.id) throw errores.versionDeConsentimientoVieja();
        if (comparte) await tomarLaAutorizacion(tx, personaId, 'escribir');
        await tomarLosPedidos(tx, personaId);
        const fila = esUuid(accessRequestId) ? await tx.pedidoDeAccesoAHabitos.findUnique({ where: { id: accessRequestId.toLowerCase() } }) : null;
        // Ajeno o inexistente, el mismo 404.
        if (!fila || fila.asesoradoId !== personaId) throw this.ejecutor.noRevelable({ operacion: 'API-HBT-09', actorId: personaId, recurso }, ctx);
        // Lo que se vio tiene que seguir esperando: si ya se respondió o lo reemplazó uno nuevo, que lo vuelva a leer.
        if (fila.estado !== 'PENDIENTE' || token(fila.version) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const momento = await momentoDeLosHabitos(tx);
        if (!comparte) {
          await resolverPedidoDeAcceso(tx, { pedido: fila, estado: 'NO_POR_AHORA', actorId: personaId, procedencia, momento });
          return { estadoHttp: 200, cuerpo: { data: { accessRequestId: fila.id, answer: 'NOT_NOW', answeredAt: momento.toISOString() } }, sujetoId: personaId, recurso: { tipo: 'PedidoDeAccesoAHabitos', id: fila.id } };
        }
        const vigente = await autorizacionVigente(tx, personaId);
        if ((vigente ? token(vigente.fila.version) : null) !== pedido.sharing!.expectedVersion) throw errores.conflictoDeVersion();
        const profesionales = await profesionalesDeLaPersona(tx, personaId);
        // Quien pidió tiene que acompañarla hoy, con el vínculo aceptado en algún área.
        const quien = profesionales.find((p) => p.profesionalId === fila.profesionalId);
        if (!quien || !quien.componentes.some((c) => c.estado === 'ACEPTADO')) {
          throw new ErrorDeApi(422, CodigoDeError.HABITS_RECIPIENT_NOT_AVAILABLE, 'Ese profesional ya no te acompaña.', { issues: [{ code: 'HABITS_RECIPIENT_NOT_AVAILABLE', path: 'accessRequestId' }] });
        }
        const { incluidos, declinados } = compartirAlAceptarUnPedido({ profesionales, renglones: vigente?.renglones ?? null, profesionalId: fila.profesionalId });
        const renglones = renglonesDeLaAutorizacion({ profesionales, anteriores: vigente?.renglones ?? null, incluidos, declinados, ahora: momento.toISOString() });
        await agregarVersionDeAutorizacion(tx, { personaId, anterior: vigente?.fila ?? null, estado: 'ACTIVA', texto: { id: texto.id, hash: texto.hash }, renglones, procedencia, momento });
        // El pedido queda aceptado (y el de cualquier otro que ahora los recibe).
        await aceptarLosPedidosDeQuienesLosReciben(tx, { personaId, renglones, procedencia, momento });
        return { estadoHttp: 200, cuerpo: { data: { accessRequestId: fila.id, answer: 'SHARE', answeredAt: momento.toISOString() } }, sujetoId: personaId, recurso: { tipo: 'PedidoDeAccesoAHabitos', id: fila.id } };
      },
    });
  }

  /** Cómo queda la autorización, para la respuesta de HBT-03 y 04: con lo que esta misma transacción acaba de escribir. */
  private async estado(tx: Tx, personaId: string) {
    const [vigente, profesionales] = await Promise.all([autorizacionVigente(tx, personaId), profesionalesDeLaPersona(tx, personaId)]);
    return { data: { sharing: compartirApi(vigente), professionals: profesionalesApi(profesionales, vigente) } };
  }
}
