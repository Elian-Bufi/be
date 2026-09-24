import { Injectable } from '@nestjs/common';
import { FINALIDAD_DE_ALCANCE, type Alcance, type EsquemaDeContrato, type Procedencia, type SalidaDe } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { DenegacionDelPdp, PdpService, type SolicitudDeDecision } from '../autorizacion/pdp.service';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from './auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from './idempotencia.service';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';

type Tx = Prisma.TransactionClient;

export interface Recurso {
  readonly tipo: string;
  readonly id: string;
}

/** Lo que devuelve el efecto de una escritura: la respuesta y lo que queda en la auditoría. */
export interface ResultadoDeEfecto {
  readonly estadoHttp: 200 | 201;
  readonly cuerpo: unknown;
  readonly sujetoId: string | null;
  readonly recurso: Recurso;
}

interface Comun {
  readonly operacion: string;
  /** UC del 05 que la operación ejecuta: queda en la procedencia (T-06-23). */
  readonly casoDeUso: string;
  readonly actor: ActorAutenticado;
  readonly ctx: ContextoDeSolicitud;
  /** Recurso que se intentó, para auditar también el rechazo (reconstruir un intento de enumeración). */
  readonly recursoIntentado: Recurso | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (s: string): boolean => UUID.test(s);

/**
 * Esqueleto común de las operaciones de un dominio de salud, parametrizado por Alcance. El orden es el de WP-03:
 * 1. el cuerpo se valida contra su schema (400); no depende del recurso, así que no es un oráculo;
 * 2. Idempotency-Key, cuando el 09 la exige (09v9:1051-1068);
 * 3. en UNA transacción: el efecto, que decide el PDP con `PdpService.decidirEnTransaccion` antes de escribir, la
 *    auditoría de éxito y el registro de idempotencia, que guarda qué decidió el PDP. Un reintento con la misma clave
 *    vuelve a decidir antes de devolver la respuesta guardada: si ya no se permite, es el mismo 404;
 * 4. si el PDP denegó, la transacción se revirtió: se registra la decisión denegada y se responde el 404;
 * 5. todo rechazo de contrato queda auditado como RECHAZO, con el recurso intentado.
 *
 * La auditoría es REQUIRED_SAME_TX (09v9:1051-1068): si no se puede auditar, no hay éxito (09v7 T18).
 *
 * Lo introdujo WP-04 para nutrición; WP-05 lo generaliza sin cambiar su comportamiento, porque lo único propio de
 * la vertical eran el Alcance y su Finalidad (docs/paquetes/WP-05.md §9.2). Cada dominio declara su Alcance en una
 * subclase inyectable; la Finalidad sale de `FINALIDAD_DE_ALCANCE`, que ya la deriva (REG-06-61).
 */
@Injectable()
export abstract class EjecutorDeDominio {
  protected constructor(
    private readonly alcance: Alcance,
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly pdp: PdpService,
  ) {}

  /** Escritura con Idempotency-Key obligatoria. */
  async escribirIdempotente<S extends EsquemaDeContrato>(
    p: Comun & {
      readonly clave: string | undefined;
      readonly esquema: S;
      readonly cuerpo: unknown;
      /** Lo que identifica al request lógico además del cuerpo (ids de ruta). */
      readonly huellaExtra: Record<string, unknown>;
      readonly efecto: (tx: Tx, pedido: SalidaDe<S>, procedencia: Procedencia) => Promise<ResultadoDeEfecto>;
    },
  ): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(p.esquema, p.cuerpo);
    if (!IdempotenciaService.claveValida(p.clave)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const huella = IdempotenciaService.huella({ ...p.huellaExtra, pedido });
    const procedencia = procedenciaDe(p.ctx, p.casoDeUso, p.operacion);
    return this.conAuditoria(p, () =>
      this.idempotencia.ejecutar({ operacion: p.operacion, ambito: p.actor.identidadId, clave: p.clave as string, huella }, async (tx) => {
        const r = await p.efecto(tx, pedido, procedencia);
        await this.exito(tx, p, r);
        return { estadoHttp: r.estadoHttp, cuerpo: r.cuerpo as Prisma.InputJsonValue };
      }, {
        capturar: (fn) => this.pdp.capturarDecisiones(fn),
        reautorizar: (tx, decisiones) => this.pdp.reautorizar(tx, decisiones as readonly SolicitudDeDecision[], p.ctx),
      }),
    );
  }

  /**
   * Escritura idempotente con una **preparación fuera de la transacción**: el I/O externo de la importación controlada
   * (WP-08). «Ningún I/O externo ocurre dentro de las transacciones» (09v12:84): primero se consulta, después se abre la
   * transacción que guarda.
   * - La preparación corre después de validar el cuerpo y la clave, y solo si la clave todavía no tiene resultado: un
   *   reintento se sirve de lo guardado, sin volver a consultar al proveedor.
   * - Si otra request con la misma clave termina entre la consulta y el lock, `ejecutar` sirve la suya y este efecto no
   *   corre: la consulta de más no deja rastro.
   * - Un error de la preparación (el proveedor no responde, no conoce el identificador) se audita como cualquier rechazo.
   */
  async escribirIdempotenteConPreparacion<S extends EsquemaDeContrato, P>(
    p: Comun & {
      readonly clave: string | undefined;
      readonly esquema: S;
      readonly cuerpo: unknown;
      readonly huellaExtra: Record<string, unknown>;
      readonly preparar: (pedido: SalidaDe<S>) => Promise<P>;
      readonly efecto: (tx: Tx, pedido: SalidaDe<S>, procedencia: Procedencia, preparado: P) => Promise<ResultadoDeEfecto>;
    },
  ): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(p.esquema, p.cuerpo);
    if (!IdempotenciaService.claveValida(p.clave)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const huella = IdempotenciaService.huella({ ...p.huellaExtra, pedido });
    const procedencia = procedenciaDe(p.ctx, p.casoDeUso, p.operacion);
    const clave = { operacion: p.operacion, ambito: p.actor.identidadId, clave: p.clave };
    return this.conAuditoria(p, async () => {
      const preparado = (await this.idempotencia.yaRegistrada(clave)) ? null : { valor: await p.preparar(pedido) };
      return this.idempotencia.ejecutar({ ...clave, huella }, async (tx) => {
        // Sin preparación solo se llega acá si el resultado guardado desapareció entre la consulta y el lock: no se hace
        // I/O dentro de la transacción para reponerlo.
        if (!preparado) throw errores.conflictoConcurrente();
        const r = await p.efecto(tx, pedido, procedencia, preparado.valor);
        await this.exito(tx, p, r);
        return { estadoHttp: r.estadoHttp, cuerpo: r.cuerpo as Prisma.InputJsonValue };
      }, {
        capturar: (fn) => this.pdp.capturarDecisiones(fn),
        reautorizar: (tx, decisiones) => this.pdp.reautorizar(tx, decisiones as readonly SolicitudDeDecision[], p.ctx),
      });
    });
  }

  /** Escritura sin Idempotency-Key (PATCH con expectedVersion y validate, 09v9:1051-1068). */
  async escribir<S extends EsquemaDeContrato>(
    p: Comun & {
      readonly esquema: S;
      readonly cuerpo: unknown;
      readonly efecto: (tx: Tx, pedido: SalidaDe<S>, procedencia: Procedencia) => Promise<ResultadoDeEfecto>;
    },
  ): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(p.esquema, p.cuerpo);
    const procedencia = procedenciaDe(p.ctx, p.casoDeUso, p.operacion);
    return this.conAuditoria(p, () =>
      conReintento(() =>
        this.prisma.$transaction(async (tx) => {
          const r = await p.efecto(tx, pedido, procedencia);
          await this.exito(tx, p, r);
          return { estadoHttp: r.estadoHttp, cuerpo: r.cuerpo as Prisma.InputJsonValue };
        }),
      ),
    );
  }

  /**
   * Lectura protegida: la decisión del PDP (que registra el acceso, 08:634) y la lectura en la misma transacción, así
   * la respuesta sale de la misma foto que autorizó.
   */
  async leer<T>(p: Comun & { readonly lectura: (tx: Tx) => Promise<T> }): Promise<T> {
    try {
      return await conReintento(() => this.prisma.$transaction((tx) => p.lectura(tx)));
    } catch (e) {
      if (e instanceof DenegacionDelPdp) await this.pdp.registrarDenegacion(e);
      throw e;
    }
  }

  /**
   * El recurso no existe, o existe y el PDP permitiría al actor sobre su titular pero el recurso es de otro profesional
   * (DL-057). Se responde el 404 idéntico (09:226) y se registra la decisión denegada: sin titular si el recurso no
   * existe, con el titular si existe (08:491: el titular puede saber quién intentó acceder). La dimensión es ROL: el
   * actor no es el profesional del recurso. Si el PDP deniega antes, queda registrada su dimensión real.
   */
  noRevelable(
    p: { operacion: string; actorId: string; recurso: Recurso | null; sujetoId?: string | null; alcance?: Alcance },
    ctx: ContextoDeSolicitud,
  ): DenegacionDelPdp {
    // El Alcance real, cuando ya se conoce (p. ej. porque el recurso existe y se leyó antes del corte), sostiene
    // metadata de auditoría precisa incluso en un dominio transversal a más de un Alcance (WP-07: FRM opera sobre
    // los tres). Sin él, se usa el fijo de la vertical, como siempre.
    const alcance = p.alcance ?? this.alcance;
    return new DenegacionDelPdp({
      operacion: p.operacion,
      resultado: 'DENEGADA',
      actorId: p.actorId,
      sujetoId: p.sujetoId ?? null,
      alcance,
      finalidad: FINALIDAD_DE_ALCANCE[alcance],
      dimensionesDesfavorables: ['ROL'],
      recursoTipo: p.recurso?.tipo ?? null,
      recursoId: p.recurso && esUuid(p.recurso.id) ? p.recurso.id.toLowerCase() : null,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: new Date(),
    });
  }

  private async exito(tx: Tx, p: Comun, r: ResultadoDeEfecto): Promise<void> {
    await this.auditoria.registrar(
      {
        operacion: p.operacion,
        resultado: 'EXITO',
        actorId: p.actor.identidadId,
        sujetoId: r.sujetoId,
        recursoTipo: r.recurso.tipo,
        recursoId: r.recurso.id,
        superficie: p.ctx.superficie,
        requestId: p.ctx.requestId,
        momentoDeOcurrencia: p.ctx.momentoDeRecepcion,
      },
      tx,
    );
  }

  private async conAuditoria(p: Comun, operacion: () => Promise<ResultadoIdempotente>): Promise<ResultadoIdempotente> {
    try {
      return await operacion();
    } catch (e) {
      if (e instanceof DenegacionDelPdp) await this.pdp.registrarDenegacion(e);
      if (e instanceof ErrorDeApi) {
        const intentado = p.recursoIntentado && esUuid(p.recursoIntentado.id) ? p.recursoIntentado : null;
        await this.auditoria.registrar({
          operacion: p.operacion,
          resultado: 'RECHAZO',
          motivo: e.code,
          actorId: p.actor.identidadId,
          recursoTipo: intentado?.tipo ?? null,
          recursoId: intentado?.id.toLowerCase() ?? null,
          superficie: p.ctx.superficie,
          requestId: p.ctx.requestId,
          momentoDeOcurrencia: p.ctx.momentoDeRecepcion,
        });
      }
      throw e;
    }
  }
}
