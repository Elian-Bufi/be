import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  CompartirHabitosRequestSchema,
  DejarDeCompartirHabitosRequestSchema,
  desdeCuandoLosRecibe,
  habitosEnOrden,
  problemasDelPedidoDeCompartir,
  RegistrarHabitosRequestSchema,
  renglonesDeLaAutorizacion,
  SECCION_DE_HABITOS,
  SOLICITUD_DE_MIS_HABITOS,
  VERSION_VIGENTE,
  VERSIONES_PROPUESTAS,
  type HabitosCompartidosResponse,
  type MisHabitosResponse,
  type TextoDeCompartirHabitos,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import {
  agregarVersionDeAutorizacion,
  agregarVersionDeHabitos,
  autorizacionVigente,
  compartirApi,
  momentoDeLosHabitos,
  origenApi,
  profesionalesApi,
  profesionalesDeLaPersona,
  respuestasDeHabitos,
  tomarLaAutorizacion,
  tomarLosHabitos,
  ultimaVersionDeHabitos,
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
 */
@Injectable()
export class HabitosService {
  constructor(
    private readonly ejecutor: EjecutorDeFormularios,
    private readonly pdp: PdpService,
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

  /** Cómo queda la autorización, para la respuesta de HBT-03 y 04: con lo que esta misma transacción acaba de escribir. */
  private async estado(tx: Tx, personaId: string) {
    const [vigente, profesionales] = await Promise.all([autorizacionVigente(tx, personaId), profesionalesDeLaPersona(tx, personaId)]);
    return { data: { sharing: compartirApi(vigente), professionals: profesionalesApi(profesionales, vigente) } };
  }
}
