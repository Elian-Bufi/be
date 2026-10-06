import { Injectable } from '@nestjs/common';
import { CAPACIDAD_OBJETIVOS_POR_SERIE, CodigoDeError, COPY_COMPATIBILIDAD_DE_CLIENTES, planExigeObjetivosPorSerie, type ContenidoDePlanDeEntrenamiento } from '@be/domain';
import { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';

type Tx = Prisma.TransactionClient;

/**
 * Precierre del 2026-10-06, §2 (DL-122) — a qué clientes se les entrega un plan con objetivos por serie
 * (`compatibilidad-de-clientes.ts` del dominio).
 *
 * Las APK instaladas (0.13.2 y las candidatas 0.14.0) leen la prescripción con su forma de siempre: mostrarían la
 * intensidad y la carga generales como si fueran los objetivos de cada serie. No muestran textos del servidor, así que no
 * se les puede pedir que se actualicen. En cambio:
 * - **el cliente declara lo que sabe mostrar** (`X-BE-Capabilities`, en `ContextoDeSolicitud.capacidades`) y, cuando el
 *   titular abre «Hoy» (API-TRN-14) o una sesión para registrar (API-SER-02) con la capacidad, la API lo registra;
 * - **la activación** de un plan que exige objetivos por serie espera ese registro (API-TRN-12, 409
 *   CLIENT_CAPABILITY_REQUIRED), y API-SER-01 se lo informa al profesional;
 * - **la entrega** a un pedido del titular sin la capacidad se retiene: «Hoy» y el período dicen que el plan no está
 *   disponible, una forma que esas APK ya conocen, y el detalle (API-TRN-09) y abrir el borrador (API-TRN-15) son el 404 de
 *   lo inexistente. El motivo real queda en la auditoría.
 * Los pedidos del profesional nunca pasan por acá, y lo registrado tampoco (API-TRN-16 a 20 y 19-LISTA): esas APK no
 * muestran ahí valores planificados, y el historial se conserva.
 */

/** Si el pedido viene de un cliente que muestra el objetivo de cada serie. Sin la cabecera, no. */
export const muestraObjetivosPorSerie = (ctx: ContextoDeSolicitud): boolean => ctx.capacidades.has(CAPACIDAD_OBJETIVOS_POR_SERIE);

/**
 * Si el contenido de una versión de plan exige un cliente que muestre los objetivos por serie. Lo guardado ya tiene la
 * forma que pide `planExigeObjetivosPorSerie`: el criterio de intensidad se guarda normalizado (`RIR` o `PERCENT_RM`, de
 * `interpretarCriterio`), que `esCriterioRir` reconoce igual que en la entrada, y cada serie guarda solo los objetivos que
 * declaró, así que lo ausente hereda como al resolverlos. De una versión activada se mira su instantánea: es lo que se
 * entrega.
 */
export const exigeObjetivosPorSerie = (contenido: ContenidoDePlanDeEntrenamiento): boolean => planExigeObjetivosPorSerie(contenido);

/** Si una versión no se le entrega a este pedido: exige objetivos por serie y el cliente no declara que los muestra. */
export const seRetieneLaEntrega = (ctx: ContextoDeSolicitud, contenido: ContenidoDePlanDeEntrenamiento): boolean =>
  !muestraObjetivosPorSerie(ctx) && exigeObjetivosPorSerie(contenido);

/** El 404 de lo inexistente (09:226), idéntico. El motivo real queda solo en la auditoría (`motivoDeAuditoria`). */
export const entregaRetenida = (): ErrorDeApi =>
  new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, CodigoDeError.CLIENT_CAPABILITY_REQUIRED);

/** API-TRN-12: el titular todavía no usó una app que muestre los objetivos por serie. Es un 409 sin ningún cambio. */
export const capacidadDelClienteRequerida = (): ErrorDeApi =>
  new ErrorDeApi(409, CodigoDeError.CLIENT_CAPABILITY_REQUIRED, COPY_COMPATIBILIDAD_DE_CLIENTES.activacionBloqueada);

@Injectable()
export class CompatibilidadDeClientesService {
  /** Salida del log técnico; reemplazable en pruebas (propiedad, no parámetro: Nest inyecta el constructor). */
  log: (linea: string) => void = (l) => process.stdout.write(`${l}\n`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /** Si la identidad ya usó un cliente que muestra los objetivos por serie: lo registraron API-TRN-14 o API-SER-02. */
  async titularCapaz(tx: Tx, identidadId: string): Promise<boolean> {
    return (await tx.capacidadDeClienteDeclarada.count({ where: { identidadId, capacidad: CAPACIDAD_OBJETIVOS_POR_SERIE } })) > 0;
  }

  /**
   * Registra que el titular usa un cliente que muestra los objetivos por serie, si el pedido lo declara. La llaman API-TRN-14
   * y API-SER-02 cuando la lectura ya salió bien, fuera de su transacción:
   * - **de mejor esfuerzo:** si falla, la lectura no falla; queda una línea en el log técnico, sin datos de nadie (08 §30).
   *   Lo único que se pierde es esta declaración, y el próximo pedido la vuelve a intentar;
   * - **no escribe en cada pedido:** con una declaración de la última hora no hace nada. Si no, crea la primera o actualiza
   *   la última vez y su superficie. Dos pedidos a la vez se resuelven en la base (única por identidad y capacidad).
   * No es un hecho del dominio ni una operación del contrato: no lleva procedencia ni auditoría, y no guarda nada más que la
   * identidad, la capacidad, la superficie y las dos fechas.
   */
  async registrarDeclaracion(identidadId: string, ctx: ContextoDeSolicitud): Promise<void> {
    if (!muestraObjetivosPorSerie(ctx)) return;
    try {
      const [reciente] = await this.prisma.$queryRaw<{ reciente: number }[]>`
        SELECT 1 AS "reciente" FROM "capacidad_de_cliente_declarada"
         WHERE "identidad_id" = ${identidadId}::uuid AND "capacidad" = ${CAPACIDAD_OBJETIVOS_POR_SERIE}
           AND "momento_de_ultima_declaracion" > now() - interval '1 hour'`;
      if (reciente) return;
      await this.prisma.$executeRaw`
        INSERT INTO "capacidad_de_cliente_declarada" ("identidad_id", "capacidad", "superficie")
        VALUES (${identidadId}::uuid, ${CAPACIDAD_OBJETIVOS_POR_SERIE}, ${ctx.superficie}::"Superficie")
        ON CONFLICT ("identidad_id", "capacidad") DO UPDATE
           SET "momento_de_ultima_declaracion" = EXCLUDED."momento_de_ultima_declaracion", "superficie" = EXCLUDED."superficie"
         WHERE "capacidad_de_cliente_declarada"."momento_de_ultima_declaracion" <= now() - interval '1 hour'`;
    } catch (e) {
      const tipo = e instanceof Error ? e.constructor.name : typeof e;
      const codigo = e instanceof Prisma.PrismaClientKnownRequestError ? e.code : undefined;
      this.log(JSON.stringify({ nivel: 'warn', evento: 'capacidad_de_cliente_no_registrada', tipo, codigo, requestId: ctx.requestId }));
    }
  }

  /**
   * Deja en la auditoría que a un pedido del titular se le retuvo una versión de plan, con el motivo que el cliente no ve
   * (09v7 T16). Va en la transacción de la lectura, como el registro de su decisión de acceso: la respuesta no sale sin él.
   * Lo usan «Hoy» y el período, que responden 200; el detalle y abrir el borrador lo dejan con `entregaRetenida`.
   */
  async registrarRetencion(tx: Tx, p: { readonly operacion: string; readonly actorId: string; readonly versionDePlanId: string }, ctx: ContextoDeSolicitud): Promise<void> {
    await this.auditoria.registrar(
      {
        operacion: p.operacion,
        resultado: 'RECHAZO',
        motivo: CodigoDeError.CLIENT_CAPABILITY_REQUIRED,
        actorId: p.actorId,
        recursoTipo: 'VersionDePlanDeEntrenamiento',
        recursoId: p.versionDePlanId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
  }
}
