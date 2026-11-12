import { Injectable } from '@nestjs/common';
import { AceptarVersionVigenteRequestSchema, EditarPerfilPropioRequestSchema, nombreVisibleValido, problemaDelNombre, type LoQueFaltaParaSeguirResponse, type PasoPendiente, type PerfilPropio, type PerfilPropioResponse } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { token } from '../vinculo/lectura';
import { pasosDeTextosPendientes, registrarAceptacionVigente } from './textos-vigentes';

type Tx = Prisma.TransactionClient;

const RECURSO = 'PerfilPropio';
const CASO_DE_USO = 'UC-P25';

/**
 * El esqueleto común (validación, transacción y auditoría REQUIRED_SAME_TX) para el perfil propio. No es un dato de
 * salud ni tiene otro titular que el actor: no decide con el PDP. El Alcance fijo de la superclase no se usa: queda el
 * de Nutrición solo porque el constructor lo exige (mismo tratamiento que VAN, MED y FRM, que lo documentan igual).
 */
@Injectable()
export class EjecutorDePerfilPropio extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}

/**
 * El perfil propio: API-ACC-06 (09v8:509-554) y su lectura, API-ACC-06-PROPIA. DEUDA_LEGAJO DL-009 (opción B) y
 * DL-040, decididas por Dirección el 2026-10-15: un solo campo, el nombre visible.
 * - **Historia por adición.** Cada cambio agrega una versión (`version_de_perfil_propio`, que la base deja solo
 *   agregar) y el perfil pasa a apuntar a ella. Desde DL-169 (UF-D3) el nombre se cambia pero no se quita: `null` o un
 *   texto vacío responden 422 INVALID_PROFILE_DATA con DISPLAY_NAME_REQUIRED, y la base rechaza una versión nueva sin
 *   nombre (las viejas, guardadas con `null`, quedan en la historia).
 * - **Concurrencia:** `expectedVersion` («v0» sin versiones). La actualización del perfil está condicionada a la
 *   versión leída: dos cambios simultáneos con la misma versión dejan uno, y el otro recibe 409 VERSION_CONFLICT.
 * - **Validación:** el nombre se normaliza (sin espacios de más) y tiene de 1 a 60 caracteres, sin caracteres de
 *   control: si no, 422 INVALID_PROFILE_DATA. Un campo que no es del perfil: 400 UNKNOWN_FIELD.
 * - **API-ACC-07** (DL-169, UF-D4) dice qué le falta a la cuenta para seguir: hoy, el nombre de una cuenta anterior.
 * - **Auditoría** en la misma transacción: si no se puede auditar, no hay cambio (09v7 T18). No guarda el nombre.
 */
@Injectable()
export class PerfilPropioService {
  constructor(private readonly ejecutor: EjecutorDePerfilPropio) {}

  // ─── API-ACC-06-PROPIA ─────────────────────────────────────────────────────────────────────────
  consultar(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<PerfilPropioResponse> {
    return this.ejecutor.leer({
      operacion: 'API-ACC-06-PROPIA',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => ({ data: (await leerPerfil(tx, actor.identidadId)).api }),
    });
  }

  // ─── API-ACC-07 · Lo que falta para seguir (DL-169, UF-D4) ─────────────────────────────────────
  /**
   * Los pasos que la cuenta tiene que completar antes de usar BE. Hoy, `DISPLAY_NAME` si el perfil no tiene nombre (una
   * cuenta anterior a DL-169): con la propuesta del nombre profesional, si la identidad tiene perfil profesional (UF-01,
   * punto 4). Es una lectura del propio actor: no decide con el PDP ni revela nada de otro.
   */
  loQueFaltaParaSeguir(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<LoQueFaltaParaSeguirResponse> {
    return this.ejecutor.leer({
      operacion: 'API-ACC-07',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        const steps: PasoPendiente[] = [];
        if ((await leerPerfil(tx, actor.identidadId)).api.displayName === null) {
          const profesional = await tx.perfilProfesional.findUnique({ where: { identidadId: actor.identidadId }, select: { nombreVisible: true } });
          steps.push({ step: 'DISPLAY_NAME', suggestion: profesional ? nombreVisibleValido(profesional.nombreVisible) : null });
        }
        // UF-05: la versión vigente de los términos y de la privacidad, solo para un cliente que sabe mostrarla.
        steps.push(...(await pasosDeTextosPendientes(tx, actor.identidadId, ctx.capacidades)));
        return { data: { steps } };
      },
    });
  }

  // ─── API-ACC-08 · Aceptar la versión vigente (UF-05, DL-169) ─────────────────────────────────────
  /**
   * Registra la aceptación de la versión vigente de los términos o de la información de privacidad que mostró «Antes de
   * seguir». Sin Idempotency-Key: si ya estaba aceptada esa versión, 200 con ese acto; si no, 201 con el nuevo.
   */
  aceptarVersionVigente(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribir({
      operacion: 'API-ACC-08',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      esquema: AceptarVersionVigenteRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        const momento = await momentoDeLaBase(tx);
        const r = await registrarAceptacionVigente(tx, { identidadId: actor.identidadId, texto: pedido.text, versionId: pedido.versionId, ctx, procedencia, momento });
        return { estadoHttp: r.creado ? 201 : 200, cuerpo: r.respuesta, sujetoId: actor.identidadId, recurso: { tipo: 'ActoRegistrable', id: r.respuesta.data.actId } };
      },
    });
  }

  // ─── API-ACC-06 ────────────────────────────────────────────────────────────────────────────────
  editar(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribir({
      operacion: 'API-ACC-06',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      esquema: EditarPerfilPropioRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        // DL-169 (UF-D3): se cambia, no se quita. `null` o vacío: DISPLAY_NAME_REQUIRED; inválido: INVALID_DISPLAY_NAME.
        const problema = problemaDelNombre(pedido.changes.displayName);
        if (problema) throw errores.nombreDelPerfil(problema);
        const nombre = nombreVisibleValido(pedido.changes.displayName!)!;
        const actual = await leerPerfil(tx, actor.identidadId);
        if (pedido.expectedVersion !== actual.api.version) throw errores.conflictoDeVersion();
        const momento = await momentoDeLaBase(tx);
        // Dos cambios simultáneos con la misma versión chocan en el número (único por perfil): el segundo, 409.
        const version = await sinDuplicar(
          tx.versionDePerfilPropio.create({
            data: {
              perfilPropioId: actual.perfilId,
              numero: actual.numero + 1,
              nombreVisible: nombre,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              momentoDeRegistro: momento,
            },
          }),
          errores.conflictoDeVersion,
        );
        // Condicionada a la versión leída: si otra escritura avanzó en el medio, no se pisa.
        const r = await tx.perfilPropio.updateMany({ where: { id: actual.perfilId, versionEfectivaId: actual.versionEfectivaId }, data: { versionEfectivaId: version.id } });
        if (r.count !== 1) throw errores.conflictoDeVersion();
        const data: PerfilPropio = { displayName: version.nombreVisible, version: token(version.numero), updatedAt: version.momentoDeRegistro.toISOString() };
        return { estadoHttp: 200, cuerpo: { data }, sujetoId: actor.identidadId, recurso: { tipo: RECURSO, id: actual.perfilId } };
      },
    });
  }
}

/** El perfil propio del actor, con su versión efectiva. Toda identidad registrada tiene uno (INV-06-22). */
async function leerPerfil(tx: Tx, identidadId: string): Promise<{ perfilId: string; versionEfectivaId: string | null; numero: number; api: PerfilPropio }> {
  const perfil = await tx.perfilPropio.findUnique({
    where: { identidadId },
    select: { id: true, versionEfectivaId: true, versionEfectiva: { select: { numero: true, nombreVisible: true, momentoDeRegistro: true } } },
  });
  if (!perfil) throw errores.recursoNoEncontrado();
  const v = perfil.versionEfectiva;
  return {
    perfilId: perfil.id,
    versionEfectivaId: perfil.versionEfectivaId,
    numero: v?.numero ?? 0,
    api: { displayName: v?.nombreVisible ?? null, version: token(v?.numero ?? 0), updatedAt: v ? v.momentoDeRegistro.toISOString() : null },
  };
}
