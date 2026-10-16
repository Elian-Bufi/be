import { Inject, Injectable } from '@nestjs/common';
import {
  CrearInvitacionRequestSchema,
  CuerpoVacioSchema,
  ESTADOS_DE_INVITACION,
  FINALIDAD_DE_ALCANCE,
  SecretoDeInvitacionRequestSchema,
  VIGENCIA_DE_LA_INVITACION_MS,
  codigoDesdeBytes,
  esTokenDeInvitacion,
  estadoDeInvitacion,
  formatearCodigo,
  normalizarCodigo,
  type CrearSolicitudDeVinculoResponse,
  type EstadoDeInvitacion,
  type Invitacion,
  type InvitacionCreadaResponse,
  type InvitacionResponse,
  type ListaDeInvitacionesResponse,
  type Procedencia,
  type SecretoDeInvitacionRequest,
  type SolicitudDeduplicadaResponse,
  type VistaPreviaDeInvitacionResponse,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { esViolacionDeUnicidad, sinDuplicar } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { itemDeSolicitud, nombreDeProfesional, resumenDeAlcance } from './lectura';
import { alcanceYFinalidadDelPedido, exigirClave, SolicitudesService } from './solicitudes.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * La huella con la que se guarda y se busca un secreto de invitación: HMAC-SHA256 con una clave derivada del secreto de
 * firma, no un SHA-256 simple. El código tiene 40 bits: con su SHA-256, una copia de la base alcanzaría para probar todos
 * los códigos fuera de línea. Con la huella con clave, sin el secreto del servidor no se puede (08 §24.3; DL-136 D-4).
 */
export function huellaDeSecretoDeInvitacion(secretoDeFirma: string, secreto: string): string {
  const clave = createHmac('sha256', secretoDeFirma).update('BE · huellas de los secretos de las invitaciones · v1').digest();
  return createHmac('sha256', clave).update(secreto, 'utf8').digest('hex');
}

type InvitacionConResolucion = Prisma.InvitacionDeVinculoGetPayload<{ include: { resolucion: true } }>;

/** Dónde se busca una invitación: la huella con clave del token del enlace o del código normalizado. Nunca el valor. */
type Busqueda = { readonly hashDelToken: string } | { readonly hashDelCodigo: string };

/**
 * Invitaciones de vínculo (WP-INVITACION; DEUDA_LEGAJO DL-136; API-INV-01 a 05). La invitación previa a Identidad BE del
 * 06 §7.4 con token de un solo uso y vencimiento, persistido solo como hash (08 §24.3).
 * - **No es una solicitud** (REG-06-46; INV-06-55, INV-06-56): usarla crea la solicitud de REL-01 con el mismo código
 *   (`SolicitudesService.crearEnTransaccion`), iniciada por el profesional y dirigida a quien la usa. No crea vínculo,
 *   ni B2, ni acceso.
 * - **Un solo uso**: cómo terminó es una fila de `resolucion_de_invitacion`, una por invitación (clave primaria). Dos usos
 *   simultáneos se ordenan con el bloqueo de la invitación; el que pierde ve la resolución del otro (422 INVITATION_USED).
 * - **Sin oráculo** (08 §24.5): una invitación que no existe, un token o un código mal escritos, o un profesional que ya no
 *   está disponible responden el mismo 404, con límite de intentos por cuenta.
 * - **El token y el código no se guardan**: BE los calcula con HMAC desde el id de la invitación y una clave derivada del
 *   secreto del servidor, guarda su huella con clave (no un SHA-256 simple: ver huellaDeSecretoDeInvitacion), y los vuelve a calcular solo para responder el reintento de API-INV-01 con la
 *   misma Idempotency-Key (el registro de idempotencia guarda la respuesta sin ellos).
 */
@Injectable()
export class InvitacionesService {
  /** Clave de los secretos de las invitaciones, derivada del secreto de firma con una etiqueta propia (separación de usos). */
  private readonly clave: Buffer;
  /** La huella con clave de un token o un código: lo único que se guarda y por lo que se busca. */
  private readonly huella: (secreto: string) => string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
    private readonly solicitudes: SolicitudesService,
    @Inject(ENTORNO) entorno: Entorno,
  ) {
    this.clave = createHmac('sha256', entorno.jwtSecret).update('BE · secretos de las invitaciones de vínculo · v1').digest();
    this.huella = (secreto) => huellaDeSecretoDeInvitacion(entorno.jwtSecret, secreto);
  }

  // ─── API-INV-01 ────────────────────────────────────────────────────────────────────────────
  async crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-INV-01';
    exigirClave(clave);
    const pedido = validarCuerpo(CrearInvitacionRequestSchema, cuerpo);
    const huella = IdempotenciaService.huella(pedido);
    const procedencia = procedenciaDe(ctx, 'UC-P04', operacion);
    try {
      const guardado = await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        // Las mismas reglas que REL-01 para el profesional que solicita: el alcance y su finalidad (422), su cuenta operativa
        // (422) y su perfil, verificación y habilitación en ese alcance (422 SCOPE_NOT_AVAILABLE). Su cuenta se bloquea en
        // modo compartido, como en REL-01: una suspensión queda antes o después, nunca en el medio.
        const alcance = alcanceYFinalidadDelPedido(pedido.scope.code, pedido.purpose);
        const cuentas = await this.solicitudes.bloquearCuentas(tx, actor.identidadId, actor.identidadId);
        if (cuentas.get(actor.identidadId) !== 'OPERATIVA') throw errores.estadoNoPermite();
        if (!(await this.solicitudes.profesionalHabilitado(tx, actor.identidadId, alcance))) throw errores.alcanceNoDisponible();

        const id = randomUUID();
        const { token, codigo } = this.secretosDe(id);
        // Un código repetido (40 bits: una en 10^12 por invitación existente) choca con el índice único: 409, y el reintento
        // genera otra invitación con otro código.
        const creada = await sinDuplicar(
          tx.invitacionDeVinculo.create({
            data: {
              id,
              profesionalId: actor.identidadId,
              alcance,
              finalidad: FINALIDAD_DE_ALCANCE[alcance],
              hashDelToken: this.huella(token),
              hashDelCodigo: this.huella(codigo),
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              momentoDeOcurrencia: ctx.momentoDeRecepcion,
              venceEn: new Date(ctx.momentoDeRecepcion.getTime() + VIGENCIA_DE_LA_INVITACION_MS),
            },
          }),
          () => errores.conflictoConcurrente(),
        );
        await this.auditar(tx, operacion, actor.identidadId, null, creada.id, ctx);
        // Lo que queda en el registro de idempotencia: sin el token ni el código (08 §24.3).
        const respuesta: InvitacionResponse = { data: itemDeInvitacion({ ...creada, resolucion: null }, ctx.momentoDeRecepcion) };
        return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
      return await this.conSecretos(guardado);
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx);
      throw e;
    }
  }

  // ─── API-INV-02 ────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<ListaDeInvitacionesResponse> {
    const consulta = leerConsultaDeLista(query, { state: ESTADOS_DE_INVITACION });
    const ahora = ctx.momentoDeRecepcion;
    const estado = consulta.filtros.state as EstadoDeInvitacion | undefined;
    const filas = await this.prisma.invitacionDeVinculo.findMany({
      where: { AND: [{ profesionalId: actor.identidadId }, estado ? filtroDeEstado(estado, ahora) : {}, despuesDelCursor(consulta.cursor)] },
      orderBy: ORDEN_DE_LISTA,
      take: consulta.limit + 1,
      include: { resolucion: true },
    });
    const { pagina, page } = paginar(filas, consulta.limit);
    return { data: pagina.map((i) => itemDeInvitacion(i, ahora)), page };
  }

  // ─── API-INV-03 ────────────────────────────────────────────────────────────────────────────
  async anular(actor: ActorAutenticado, invitacionId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-INV-03';
    exigirClave(clave);
    validarCuerpo(CuerpoVacioSchema, cuerpo);
    const huella = IdempotenciaService.huella({ invitacionId });
    const procedencia = procedenciaDe(ctx, 'UC-P04', operacion);
    try {
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        // Solo la propia: una ajena o inexistente da el mismo 404 (09:226).
        if (!UUID.test(invitacionId)) throw errores.recursoNoEncontrado();
        const id = invitacionId.toLowerCase();
        const [propia] = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id"::text AS "id" FROM "invitacion_de_vinculo"
           WHERE "id" = ${id}::uuid AND "profesional_id" = ${actor.identidadId}::uuid FOR NO KEY UPDATE`;
        if (!propia) throw errores.recursoNoEncontrado();
        // Con la invitación bloqueada, la resolución se lee en otra sentencia: ve la de un uso que terminó recién.
        const invitacion = await tx.invitacionDeVinculo.findUniqueOrThrow({ where: { id }, include: { resolucion: true } });
        exigirVigente(invitacion, ctx.momentoDeRecepcion);
        const resolucion = await tx.resolucionDeInvitacion.create({
          data: { invitacionId: id, tipo: 'REVOCADA', actorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeOcurrencia: ctx.momentoDeRecepcion },
        });
        await this.auditar(tx, operacion, actor.identidadId, null, id, ctx);
        const respuesta: InvitacionResponse = { data: itemDeInvitacion({ ...invitacion, resolucion }, ctx.momentoDeRecepcion) };
        return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx, invitacionId);
      throw e;
    }
  }

  // ─── API-INV-04 ────────────────────────────────────────────────────────────────────────────
  async ver(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<VistaPreviaDeInvitacionResponse> {
    const operacion = 'API-INV-04';
    const secreto = validarCuerpo(SecretoDeInvitacionRequestSchema, cuerpo);
    // Cada intento cuenta, exista o no la invitación: el 429 tampoco es un oráculo (08 §24.5).
    this.limitador.consumir('invitacion', null, actor.identidadId);
    try {
      const busqueda = busquedaDe(secreto, this.huella);
      const invitacion = busqueda
        ? await this.prisma.invitacionDeVinculo.findUnique({
            where: busqueda,
            include: { resolucion: true, profesional: { select: { perfilProfesional: { select: { nombreVisible: true } } } } },
          })
        : null;
      if (!invitacion) throw errores.invitacionNoEncontrada('INVITACION_DESCONOCIDA');
      // Un profesional suspendido, cerrado o sin el alcance verificado y habilitado no se muestra: usarla daría el mismo 404.
      const cliente = this.prisma as unknown as Prisma.TransactionClient;
      if (!(await this.solicitudes.profesionalDisponible(cliente, invitacion.profesionalId, invitacion.alcance))) {
        throw errores.invitacionNoEncontrada('PROFESIONAL_NO_DISPONIBLE');
      }
      await this.auditar(this.prisma, operacion, actor.identidadId, null, invitacion.id, ctx);
      return {
        data: {
          professional: { displayName: nombreDeProfesional(invitacion.profesional.perfilProfesional) },
          scope: resumenDeAlcance(invitacion.alcance),
          purpose: invitacion.finalidad,
          expiresAt: invitacion.venceEn.toISOString(),
          state: estadoDeInvitacion({ resolucion: invitacion.resolucion?.tipo ?? null, venceEn: invitacion.venceEn }, ctx.momentoDeRecepcion),
        },
      };
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx);
      throw e;
    }
  }

  // ─── API-INV-05 ────────────────────────────────────────────────────────────────────────────
  async usar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-INV-05';
    exigirClave(clave);
    const secreto = validarCuerpo(SecretoDeInvitacionRequestSchema, cuerpo);
    this.limitador.consumir('invitacion', null, actor.identidadId);
    const busqueda = busquedaDe(secreto, this.huella);
    // La huella del pedido no lleva el secreto: lleva su huella con clave, la misma que ya guarda la invitación (08 §24.3).
    const huella = IdempotenciaService.huella({ busqueda });
    const procedencia = procedenciaDe(ctx, 'UC-P04', operacion);
    try {
      for (let intento = 1; ; intento++) {
        try {
          return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, (tx) =>
            this.usarEnTransaccion(tx, actor, busqueda, procedencia, ctx),
          );
        } catch (e) {
          // Una solicitud equivalente que nació al mismo tiempo por otro camino (REL-01, u otra invitación del mismo
          // profesional): el índice parcial deja pasar una (REG-06-44). La transacción se revirtió entera y la invitación
          // sigue sin usar: se repite una vez, y ahora encuentra la pendiente o la resolución del otro uso.
          if (intento < 2 && esViolacionDeUnicidad(e)) continue;
          throw e;
        }
      }
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx);
      throw e;
    }
  }

  private async usarEnTransaccion(
    tx: Prisma.TransactionClient,
    actor: ActorAutenticado,
    busqueda: Busqueda | null,
    procedencia: Procedencia,
    ctx: ContextoDeSolicitud,
  ): Promise<ResultadoIdempotente> {
    if (!busqueda) throw errores.invitacionNoEncontrada('INVITACION_DESCONOCIDA');
    const encontrada = await tx.invitacionDeVinculo.findUnique({ where: busqueda, select: { id: true, profesionalId: true } });
    if (!encontrada) throw errores.invitacionNoEncontrada('INVITACION_DESCONOCIDA');

    // Orden único de bloqueos (prisma/concurrencia.ts): las dos cuentas en modo compartido y, después, la invitación.
    await this.solicitudes.bloquearCuentas(tx, encontrada.profesionalId, actor.identidadId);
    await tx.$queryRaw`SELECT 1 FROM "invitacion_de_vinculo" WHERE "id" = ${encontrada.id}::uuid FOR NO KEY UPDATE`;
    // La resolución se lee después del bloqueo y en otra sentencia: así ve la del uso simultáneo que ganó.
    const invitacion = await tx.invitacionDeVinculo.findUniqueOrThrow({ where: { id: encontrada.id }, include: { resolucion: true } });

    // El profesional no usa su propia invitación: la misma respuesta que REL-01 a quien se elige a sí mismo.
    if (invitacion.profesionalId === actor.identidadId) throw errores.contraparteNoElegible();
    exigirVigente(invitacion, ctx.momentoDeRecepcion);

    // Exactamente REL-01, iniciada por el profesional y dirigida a quien la usa. Quien la usa no recibe la novedad de
    // «solicitud recibida»: la acaba de pedir él mismo.
    const r = await this.solicitudes.crearEnTransaccion(tx, {
      profesionalId: invitacion.profesionalId,
      asesoradoId: actor.identidadId,
      alcance: invitacion.alcance,
      iniciador: 'PROFESIONAL',
      solicitanteId: actor.identidadId,
      avisarALaContraparte: false,
      procedencia,
      momento: ctx.momentoDeRecepcion,
    });
    const solicitudId = r.tipo === 'CREADA' ? r.solicitud.id : r.id;
    await tx.resolucionDeInvitacion.create({
      data: {
        invitacionId: invitacion.id,
        tipo: 'USADA',
        actorId: actor.identidadId,
        solicitudDeVinculoId: solicitudId,
        procedencia: procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
    });
    await this.auditar(tx, 'API-INV-05', actor.identidadId, actor.identidadId, invitacion.id, ctx);
    if (r.tipo === 'DEDUPLICADA') {
      const respuesta: SolicitudDeduplicadaResponse = { data: { relationshipRequestId: r.id, deduplicated: true } };
      return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
    }
    const respuesta: CrearSolicitudDeVinculoResponse = { data: itemDeSolicitud(r.solicitud) };
    return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
  }

  // ─── Los secretos ──────────────────────────────────────────────────────────────────────────

  /**
   * El token (32 bytes en base64url) y el código (8 símbolos) de una invitación: HMAC-SHA256 de su id con la clave de las
   * invitaciones. Impredecibles sin esa clave, aunque el id se conozca.
   */
  private secretosDe(invitacionId: string): { readonly token: string; readonly codigo: string } {
    const token = createHmac('sha256', this.clave).update(`token|${invitacionId}`).digest().toString('base64url');
    const codigo = codigoDesdeBytes(createHmac('sha256', this.clave).update(`codigo|${invitacionId}`).digest());
    return { token, codigo };
  }

  /**
   * La respuesta de API-INV-01 con el token y el código, recalculados y comparados con los hashes guardados. Vale para la
   * primera respuesta y para el reintento con la misma clave, que sirve lo guardado (sin ellos).
   */
  private async conSecretos(guardado: ResultadoIdempotente): Promise<ResultadoIdempotente> {
    const cuerpo = guardado.cuerpo as unknown as InvitacionResponse;
    const id = cuerpo.data.invitationId;
    const fila = await this.prisma.invitacionDeVinculo.findUniqueOrThrow({ where: { id }, select: { hashDelToken: true, hashDelCodigo: true } });
    const { token, codigo } = this.secretosDe(id);
    if (this.huella(token) !== fila.hashDelToken || this.huella(codigo) !== fila.hashDelCodigo) throw errores.invitacionNoRecuperable();
    const respuesta: InvitacionCreadaResponse = { data: { ...cuerpo.data, token, code: formatearCodigo(codigo) } };
    return { estadoHttp: guardado.estadoHttp, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
  }

  // ─── Auditoría ─────────────────────────────────────────────────────────────────────────────

  private async auditar(
    cliente: Prisma.TransactionClient | PrismaService,
    operacion: string,
    actorId: string,
    sujetoId: string | null,
    invitacionId: string,
    ctx: ContextoDeSolicitud,
  ): Promise<void> {
    await this.auditoria.registrar(
      {
        operacion,
        resultado: 'EXITO',
        actorId,
        sujetoId,
        recursoTipo: 'InvitacionDeVinculo',
        recursoId: invitacionId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      cliente as Prisma.TransactionClient,
    );
  }

  /**
   * Rechazo auditado fuera de la transacción revertida (patrón de WP-02), con su motivo real cuando se respondió idéntico a
   * otro (el 404). Nunca el token ni el código: un intento de enumeración se reconstruye por actor y momento.
   */
  private async auditarRechazo(e: unknown, operacion: string, actorId: string, ctx: ContextoDeSolicitud, invitacionId?: string): Promise<void> {
    if (!(e instanceof ErrorDeApi)) return;
    const conId = invitacionId !== undefined && UUID.test(invitacionId);
    await this.auditoria.registrar({
      operacion,
      resultado: 'RECHAZO',
      motivo: e.motivoDeAuditoria ?? e.code,
      actorId,
      recursoTipo: conId ? 'InvitacionDeVinculo' : null,
      recursoId: conId ? invitacionId.toLowerCase() : null,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: ctx.momentoDeRecepcion,
    });
  }
}

/** El hash por el que se busca: el del token si tiene forma de token, el del código si se normaliza; si no, ninguno. */
function busquedaDe(secreto: SecretoDeInvitacionRequest, huella: (s: string) => string): Busqueda | null {
  if ('token' in secreto) {
    const token = secreto.token.trim();
    return esTokenDeInvitacion(token) ? { hashDelToken: huella(token) } : null;
  }
  const codigo = normalizarCodigo(secreto.code);
  return codigo ? { hashDelCodigo: huella(codigo) } : null;
}

/** Una invitación usada, anulada o vencida ya no sirve: 422 con su motivo (quien pregunta tiene el secreto). */
function exigirVigente(i: InvitacionConResolucion, ahora: Date): void {
  const estado = estadoDeInvitacion({ resolucion: i.resolucion?.tipo ?? null, venceEn: i.venceEn }, ahora);
  if (estado === 'USED') throw errores.invitacionUsada();
  if (estado === 'REVOKED') throw errores.invitacionAnulada();
  if (estado === 'EXPIRED') throw errores.invitacionVencida();
}

/** El estado derivado como filtro de la base: la resolución y la fecha de vencimiento contra el momento del pedido. */
function filtroDeEstado(estado: EstadoDeInvitacion, ahora: Date): Prisma.InvitacionDeVinculoWhereInput {
  switch (estado) {
    case 'PENDING':
      return { resolucion: { is: null }, venceEn: { gt: ahora } };
    case 'EXPIRED':
      return { resolucion: { is: null }, venceEn: { lte: ahora } };
    case 'USED':
      return { resolucion: { is: { tipo: 'USADA' } } };
    case 'REVOKED':
      return { resolucion: { is: { tipo: 'REVOCADA' } } };
  }
}

/** Una invitación vista por su profesional: nunca el token ni el código. */
function itemDeInvitacion(i: InvitacionConResolucion, ahora: Date): Invitacion {
  const r = i.resolucion;
  return {
    invitationId: i.id,
    scope: resumenDeAlcance(i.alcance),
    purpose: i.finalidad,
    state: estadoDeInvitacion({ resolucion: r?.tipo ?? null, venceEn: i.venceEn }, ahora),
    createdAt: i.momentoDeOcurrencia.toISOString(),
    expiresAt: i.venceEn.toISOString(),
    usedAt: r?.tipo === 'USADA' ? r.momentoDeOcurrencia.toISOString() : null,
    revokedAt: r?.tipo === 'REVOCADA' ? r.momentoDeOcurrencia.toISOString() : null,
    relationshipRequestId: r?.solicitudDeVinculoId ?? null,
  };
}
