import { Injectable } from '@nestjs/common';
import { CodigoDeError, EditarPerfilPropioRequestSchema, nombreVisibleValido, type PerfilPropio, type PerfilPropioResponse } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { token } from '../vinculo/lectura';

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
 *   agregar) y el perfil pasa a apuntar a ella; quitar el nombre también es una versión, con `null`.
 * - **Concurrencia:** `expectedVersion` («v0» sin versiones). La actualización del perfil está condicionada a la
 *   versión leída: dos cambios simultáneos con la misma versión dejan uno, y el otro recibe 409 VERSION_CONFLICT.
 * - **Validación:** el nombre se normaliza (sin espacios de más) y tiene de 1 a 60 caracteres, sin caracteres de
 *   control: si no, 422 INVALID_PROFILE_DATA. Un campo que no es del perfil: 400 UNKNOWN_FIELD.
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
        const nombre = pedido.changes.displayName === null ? null : nombreVisibleValido(pedido.changes.displayName);
        if (pedido.changes.displayName !== null && nombre === null) {
          throw new ErrorDeApi(422, CodigoDeError.INVALID_PROFILE_DATA, 'El nombre tiene que tener entre 1 y 60 caracteres, sin símbolos invisibles.', {
            issues: [{ code: 'INVALID_DISPLAY_NAME', path: 'changes.displayName' }],
          });
        }
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
