import { Injectable } from '@nestjs/common';
import {
  camposCorregidosDeAlimento,
  composicionCompleta,
  CrearCandidatoDeAlimentoRequestSchema,
  faltantesDeAlimento,
  ResolverCandidatoDeAlimentoRequestSchema,
  type AlimentoCandidato,
  type CandidatoDeAlimento,
  type ResolucionDeAlimento,
} from '@be/domain';
import type { CandidatoDeImportacion, Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { candidatoPropio, exigirResoluble, fuenteExternaDe, fundamentoDe, procedenciaDeCandidato, vencimientoDe } from '../integraciones/candidatos';
import { OpenFoodFacts } from '../integraciones/open-food-facts';
import { ProveedorNoDisponible, registrarProveedorNoDisponible } from '../integraciones/proveedor-http';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';

/**
 * UC-I07 con Open Food Facts (RF-028; API-INT-NUT-02 y 03; 09v12 §5). Lo que la operación garantiza:
 * - **no hay importación ciega**: consultar crea un candidato, no un elemento del catálogo;
 * - el candidato es de quien lo pidió, y solo él lo resuelve;
 * - importar valida como la carga manual y deja en la procedencia del elemento qué vino del proveedor y qué corrigió
 *   el profesional; el candidato conserva lo recibido;
 * - si el proveedor no responde, 503 con el catálogo propio y la carga manual disponibles, y nada se inventa;
 * - ningún I/O externo ocurre dentro de la transacción (09v12:84).
 */
@Injectable()
export class ImportacionNutricionalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ejecutor: EjecutorNutricional,
    private readonly catalogo: CatalogoService,
    private readonly proveedor: OpenFoodFacts,
  ) {}

  // ─── API-INT-NUT-02 ────────────────────────────────────────────────────────────────────────
  crearCandidato(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotenteConPreparacion({
      operacion: 'API-INT-NUT-02',
      casoDeUso: 'UC-I07',
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearCandidatoDeAlimentoRequestSchema,
      cuerpo,
      huellaExtra: {},
      // Fuera de la transacción: primero quién puede pedirlo —no se consulta a un tercero para quien no puede—, después
      // el proveedor.
      preparar: async (pedido) => {
        await this.catalogo.exigirProfesionalDeNutricion(this.prisma, actor.identidadId);
        try {
          const r = await this.proveedor.consultar(pedido.lookup.externalId);
          if (!r.encontrado) throw errores.fuenteNoEncontrada();
          return r;
        } catch (e) {
          if (e instanceof ProveedorNoDisponible) {
            registrarProveedorNoDisponible('OPEN_FOOD_FACTS', e, ctx.requestId);
            throw errores.proveedorNoDisponible();
          }
          throw e;
        }
      },
      efecto: async (tx, pedido, procedencia, consulta) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const fila = await tx.candidatoDeImportacion.create({
          data: {
            alcance: 'NUTRICION',
            proveedor: 'OPEN_FOOD_FACTS',
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

  // ─── API-INT-NUT-03 ────────────────────────────────────────────────────────────────────────
  resolver(actor: ActorAutenticado, candidateId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-INT-NUT-03',
      casoDeUso: 'UC-I07',
      actor,
      ctx,
      recursoIntentado: { tipo: 'CandidatoDeImportacion', id: candidateId },
      clave,
      esquema: ResolverCandidatoDeAlimentoRequestSchema,
      cuerpo,
      huellaExtra: { candidateId },
      efecto: async (tx, pedido, procedencia) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const c = await candidatoPropio(tx, candidateId, actor.identidadId, 'NUTRICION');
        const ahora = await momentoDeLaBase(tx);
        exigirResoluble(c, ahora);
        const fundamento = fundamentoDe(pedido.rationale);

        if (pedido.decision === 'REJECT') {
          const r = await tx.resolucionDeCandidato.create({
            data: { candidatoId: c.id, decision: 'RECHAZAR', fundamento, autorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue },
          });
          const data: ResolucionDeAlimento = { candidateId: c.id, decision: 'REJECT', catalogItem: null, correctedFields: [], resolvedAt: r.momentoDeRegistro.toISOString() };
          return { estadoHttp: 200, cuerpo: { data }, sujetoId: null, recurso: { tipo: 'CandidatoDeImportacion', id: c.id } };
        }

        // RF-028: «datos insuficientes se corrigen o rechazan». Lo que falta se dice por ruta.
        const revisado: AlimentoCandidato = pedido.reviewedContent;
        const faltantes = faltantesDeAlimento(revisado);
        if (faltantes.length > 0) throw errores.contenidoRevisadoInvalido(faltantes);
        const corregidos = camposCorregidosDeAlimento(c.contenido as unknown as AlimentoCandidato, revisado);
        const composicion = composicionCompleta(revisado.composition);
        const nombre = (revisado.name as string).trim();

        const elemento = await tx.elementoDeCatalogoNutricional.create({ data: { procedencia: 'CONTROLLED_IMPORT', creadoPorId: actor.identidadId } });
        const version = await tx.versionDeElementoNutricional.create({
          data: {
            elementoId: elemento.id,
            nombre,
            composicion: composicion as unknown as Prisma.InputJsonValue,
            disponibilidad: 'DISPONIBLE',
            // Lo que el catálogo muestra como procedencia (RF-060): de dónde vino y qué se corrigió.
            procedencia: { ...procedencia, carga: 'IMPORTACION_CONTROLADA', candidatoId: c.id, fuenteExterna: fuenteExternaDe(c), camposCorregidos: corregidos } as unknown as Prisma.InputJsonValue,
          },
        });
        const r = await tx.resolucionDeCandidato.create({
          data: {
            candidatoId: c.id,
            decision: 'IMPORTAR',
            contenidoRevisado: { name: nombre, composition: composicion } as unknown as Prisma.InputJsonValue,
            camposCorregidos: corregidos as unknown as Prisma.InputJsonValue,
            fundamento,
            elementoNutricionalId: elemento.id,
            versionCreadaId: version.id,
            autorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await registrarEventoDeNutricion(tx, {
          tipo: 'ElementoDeCatalogoCreado',
          profesionalId: actor.identidadId,
          asesoradoId: null,
          recurso: { tipo: 'ElementoDeCatalogoNutricional', id: elemento.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: ahora,
        });
        const data: ResolucionDeAlimento = {
          candidateId: c.id,
          decision: 'IMPORT',
          catalogItem: { catalogItemId: elemento.id, versionId: version.id },
          correctedFields: corregidos,
          resolvedAt: r.momentoDeRegistro.toISOString(),
        };
        return { estadoHttp: 200, cuerpo: { data }, sujetoId: null, recurso: { tipo: 'CandidatoDeImportacion', id: c.id } };
      },
    });
  }
}

function candidatoApi(c: CandidatoDeImportacion): CandidatoDeAlimento {
  return {
    candidateId: c.id,
    provider: 'OPEN_FOOD_FACTS',
    externalId: c.idExterno,
    receivedAt: c.recibidoEn.toISOString(),
    expiresAt: c.venceEn.toISOString(),
    candidate: c.contenido as unknown as AlimentoCandidato,
    provenance: procedenciaDeCandidato(c),
  };
}
