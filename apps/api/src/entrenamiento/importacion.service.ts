import { Injectable } from '@nestjs/common';
import {
  camposCorregidosDeEjercicio,
  CrearCandidatoDeEjercicioRequestSchema,
  faltantesDeEjercicio,
  ResolverCandidatoDeEjercicioRequestSchema,
  type CandidatoDeEjercicio,
  type EjercicioCandidato,
  type ResolucionDeEjercicio,
} from '@be/domain';
import type { CandidatoDeImportacion, Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { candidatoPropio, exigirResoluble, fuenteExternaDe, fundamentoDe, procedenciaDeCandidato, vencimientoDe } from '../integraciones/candidatos';
import { ProveedorNoDisponible } from '../integraciones/proveedor-http';
import { Wger } from '../integraciones/wger';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EjecutorDeEntrenamiento } from './ejecutor';
import { registrarEventoDeEntrenamiento } from './eventos';

/**
 * UC-I07 con wger (RF-038; API-INT-TRN-02 y 03; 09v12 §7). Las mismas garantías que la importación nutricional, más
 * una propia: **la relación músculo/zona que declara wger no se acepta como canónica** (09v12:397-401). El ejercicio
 * importado entra al catálogo sin zonas BE —la relación es 0..N (REG-06-139)— y los músculos de wger quedan en el
 * candidato como dato del proveedor.
 */
@Injectable()
export class ImportacionDeEjerciciosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly catalogo: CatalogoDeEjerciciosService,
    private readonly proveedor: Wger,
  ) {}

  // ─── API-INT-TRN-02 ────────────────────────────────────────────────────────────────────────
  crearCandidato(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotenteConPreparacion({
      operacion: 'API-INT-TRN-02',
      casoDeUso: 'UC-I07',
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearCandidatoDeEjercicioRequestSchema,
      cuerpo,
      huellaExtra: {},
      preparar: async (pedido) => {
        if (!(await this.catalogo.esProfesionalDeEntrenamiento(this.prisma, actor.identidadId))) throw errores.accionNoPermitida();
        try {
          const r = await this.proveedor.consultar(pedido.lookup.externalId);
          if (!r.encontrado) throw errores.fuenteNoEncontrada();
          return r;
        } catch (e) {
          if (e instanceof ProveedorNoDisponible) throw errores.proveedorNoDisponible();
          throw e;
        }
      },
      efecto: async (tx, pedido, procedencia, consulta) => {
        if (!(await this.catalogo.esProfesionalDeEntrenamiento(tx, actor.identidadId))) throw errores.accionNoPermitida();
        const fila = await tx.candidatoDeImportacion.create({
          data: {
            alcance: 'ENTRENAMIENTO',
            proveedor: 'WGER',
            idExterno: pedido.lookup.externalId,
            contenido: consulta.candidato as unknown as Prisma.InputJsonValue,
            huellaDeLoRecibido: consulta.respuesta.huella,
            licencia: consulta.licencia as unknown as Prisma.InputJsonValue,
            urlDeOrigen: consulta.respuesta.url,
            profesionalId: actor.identidadId,
            recibidoEn: consulta.respuesta.recibidoEn,
            venceEn: vencimientoDe(consulta.respuesta.recibidoEn),
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        return { estadoHttp: 201, cuerpo: { data: candidatoApi(fila) }, sujetoId: null, recurso: { tipo: 'CandidatoDeImportacion', id: fila.id } };
      },
    });
  }

  // ─── API-INT-TRN-03 ────────────────────────────────────────────────────────────────────────
  resolver(actor: ActorAutenticado, candidateId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-INT-TRN-03',
      casoDeUso: 'UC-I07',
      actor,
      ctx,
      recursoIntentado: { tipo: 'CandidatoDeImportacion', id: candidateId },
      clave,
      esquema: ResolverCandidatoDeEjercicioRequestSchema,
      cuerpo,
      huellaExtra: { candidateId },
      efecto: async (tx, pedido, procedencia) => {
        if (!(await this.catalogo.esProfesionalDeEntrenamiento(tx, actor.identidadId))) throw errores.accionNoPermitida();
        const c = await candidatoPropio(tx, candidateId, actor.identidadId, 'ENTRENAMIENTO');
        const ahora = await momentoDeLaBase(tx);
        exigirResoluble(c, ahora);
        const fundamento = fundamentoDe(pedido.rationale);

        if (pedido.decision === 'REJECT') {
          const r = await tx.resolucionDeCandidato.create({
            data: { candidatoId: c.id, decision: 'RECHAZAR', fundamento, autorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue },
          });
          const data: ResolucionDeEjercicio = { candidateId: c.id, decision: 'REJECT', exercise: null, correctedFields: [], resolvedAt: r.momentoDeRegistro.toISOString() };
          return { estadoHttp: 200, cuerpo: { data }, sujetoId: null, recurso: { tipo: 'CandidatoDeImportacion', id: c.id } };
        }

        const revisado = pedido.reviewedContent;
        const faltantes = faltantesDeEjercicio(revisado);
        if (faltantes.length > 0) throw errores.contenidoRevisadoInvalido(faltantes);
        const corregidos = camposCorregidosDeEjercicio(c.contenido as unknown as EjercicioCandidato, revisado);
        const nombre = (revisado.name as string).trim();

        const ejercicio = await tx.ejercicioDeCatalogo.create({ data: { procedencia: 'CONTROLLED_IMPORT', creadoPorId: actor.identidadId } });
        const version = await tx.versionDeEjercicio.create({
          data: {
            ejercicioId: ejercicio.id,
            nombre,
            disponibilidad: 'DISPONIBLE',
            procedencia: { ...procedencia, carga: 'IMPORTACION_CONTROLADA', candidatoId: c.id, fuenteExterna: fuenteExternaDe(c), camposCorregidos: corregidos } as unknown as Prisma.InputJsonValue,
          },
        });
        const r = await tx.resolucionDeCandidato.create({
          data: {
            candidatoId: c.id,
            decision: 'IMPORTAR',
            contenidoRevisado: { name: nombre } as unknown as Prisma.InputJsonValue,
            camposCorregidos: corregidos as unknown as Prisma.InputJsonValue,
            fundamento,
            ejercicioId: ejercicio.id,
            versionCreadaId: version.id,
            autorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'EjercicioDeCatalogoCreado',
          profesionalId: actor.identidadId,
          asesoradoId: null,
          recurso: { tipo: 'EjercicioDeCatalogo', id: ejercicio.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: ahora,
        });
        const data: ResolucionDeEjercicio = {
          candidateId: c.id,
          decision: 'IMPORT',
          exercise: { exerciseId: ejercicio.id, versionId: version.id },
          correctedFields: corregidos,
          resolvedAt: r.momentoDeRegistro.toISOString(),
        };
        return { estadoHttp: 200, cuerpo: { data }, sujetoId: null, recurso: { tipo: 'CandidatoDeImportacion', id: c.id } };
      },
    });
  }
}

function candidatoApi(c: CandidatoDeImportacion): CandidatoDeEjercicio {
  return {
    candidateId: c.id,
    provider: 'WGER',
    externalId: c.idExterno,
    receivedAt: c.recibidoEn.toISOString(),
    expiresAt: c.venceEn.toISOString(),
    candidate: c.contenido as unknown as EjercicioCandidato,
    provenance: procedenciaDeCandidato(c),
  };
}
