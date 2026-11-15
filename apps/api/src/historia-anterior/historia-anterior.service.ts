import { Injectable } from '@nestjs/common';
import {
  AutorizarHistoriaAnteriorRequestSchema,
  CodigoDeError,
  RetirarHistoriaAnteriorRequestSchema,
  TEXTO_DE_LA_HISTORIA_ANTERIOR,
  autorizacionVigente,
  decidirCambioDeAutorizacion,
  esAlcance,
  tramoDeLaHistoriaAnterior,
  ultimaVersion,
  type Alcance,
  type HistoriaAnteriorResponse,
  type MiHistoriaAnteriorResponse,
} from '@be/domain';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import { EjecucionesDeEntrenamientoService } from '../entrenamiento/ejecuciones.service';
import { PlanesDeEntrenamientoService } from '../entrenamiento/planes.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { PlanesService } from '../nutricion/planes.service';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import {
  agregarVersion,
  estadoDeLaPersona,
  inicioDe,
  momentoDeLaHistoriaAnterior,
  RECURSO_DE_LA_AUTORIZACION,
  RECURSO_DE_LA_HISTORIA_ANTERIOR,
  tomarLaHistoriaAnterior,
  versionesDelComponente,
} from './autorizaciones';
import { EjecutorDeHistoriaAnterior, esUuid } from './ejecutor';
import { leerHistoriaAnterior } from './lectura-historia-anterior';

/** La persona decide lo suyo; el profesional lee lo que ella le autoriza (como RES: UC-P33 y UC-P32). */
const DE_LA_PERSONA = 'UC-P33';
const DEL_PROFESIONAL = 'UC-P32';

/** El 404 de lo inexistente, idéntico, cuando la persona no lo autoriza: el motivo, solo en la auditoría. */
const noLaComparte = (motivo: string): ErrorDeApi => new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, motivo);

/**
 * API-HIA-01 a 04 — la historia anterior de un área, para el profesional nuevo (DL-175; 08 §14.1, «Cambio de profesional»;
 * REG-06-55; RF-025). Lo que garantiza este servicio, con la base detrás (migración 20261115120000):
 * - **la autorización es de la persona y explícita**, por profesional y por área (el componente de vínculo): darla pide el
 *   A3 y el texto vigente (08 §12.2); retirarla corta en el momento, sin pedir nada (RNF-PRI-002), también con el vínculo
 *   terminado. Cerrar la cuenta la retira. Cada cambio queda en la auditoría y es una versión nueva;
 * - **el profesional** lee (API-HIA-04) solo con el PDP del área que pide (vínculo aceptado, B2 vigente, cuentas y el A3 de
 *   la persona) y la autorización vigente de la persona para su componente en esa área. Si falta cualquiera, el mismo 404
 *   que lo inexistente. Cada lectura queda registrada como una decisión del PDP, y la persona la ve en API-HIA-01;
 * - **lo que lee** es lo de otros profesionales en esa área, de antes de su acompañamiento, sin nombrarlos y sin las notas
 *   propias, los borradores ni las notas internas (`lectura-historia-anterior.ts`).
 */
@Injectable()
export class HistoriaAnteriorService {
  constructor(
    private readonly ejecutor: EjecutorDeHistoriaAnterior,
    private readonly pdp: PdpService,
    private readonly planesDeNutricion: PlanesService,
    private readonly planesDeEntrenamiento: PlanesDeEntrenamientoService,
    private readonly ejecuciones: EjecucionesDeEntrenamientoService,
  ) {}

  // ─── API-HIA-01 · lo que decidí ──────────────────────────────────────────────────────────────
  /** Sin el A3: la persona tiene que poder ver lo que autorizó para poder retirarlo (RNF-PRI-002). */
  mia(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<MiHistoriaAnteriorResponse> {
    return this.ejecutor.leer({
      operacion: 'API-HIA-01',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => ({ data: await estadoDeLaPersona(tx, actor.identidadId) }),
    });
  }

  // ─── API-HIA-02 · autorizar ──────────────────────────────────────────────────────────────────
  autorizar(actor: ActorAutenticado, relationshipId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.cambiar('API-HIA-02', 'AUTORIZAR', actor, relationshipId, cuerpo, clave, ctx);
  }

  // ─── API-HIA-03 · retirar ────────────────────────────────────────────────────────────────────
  retirar(actor: ActorAutenticado, relationshipId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.cambiar('API-HIA-03', 'RETIRAR', actor, relationshipId, cuerpo, clave, ctx);
  }

  private cambiar(operacion: 'API-HIA-02' | 'API-HIA-03', que: 'AUTORIZAR' | 'RETIRAR', actor: ActorAutenticado, relationshipId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'AlcanceDeVinculo', id: relationshipId };
    return this.ejecutor.escribirIdempotente({
      operacion,
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: que === 'AUTORIZAR' ? AutorizarHistoriaAnteriorRequestSchema : RetirarHistoriaAnteriorRequestSchema,
      cuerpo,
      huellaExtra: { relationshipId },
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        // El componente tiene que ser de la persona: ajeno o inexistente, el mismo 404. Para autorizar, además, sin terminar.
        const fila = esUuid(relationshipId)
          ? await tx.alcanceDeVinculo.findUnique({ where: { id: relationshipId.toLowerCase() }, select: { id: true, alcance: true, estado: true, vinculo: { select: { asesoradoId: true, profesionalId: true } } } })
          : null;
        if (!fila || fila.vinculo.asesoradoId !== personaId) throw this.ejecutor.noRevelable({ operacion, actorId: personaId, recurso }, ctx);
        if (que === 'AUTORIZAR' && fila.estado === 'FINALIZADO') throw this.ejecutor.noRevelable({ operacion, actorId: personaId, recurso, sujetoId: personaId, alcance: fila.alcance }, ctx);
        if (que === 'AUTORIZAR') {
          // Dar la autorización pide el A3, con el acto tomado (DL-115), antes del cerrojo; y el texto que se mostró tiene que
          // ser el vigente (08 §12.2: la mostrada es la aceptada).
          await exigirA3Vigente(tx, personaId, { bloquear: true });
          if ((pedido as { textVersionId: string }).textVersionId !== TEXTO_DE_LA_HISTORIA_ANTERIOR.id) throw errores.versionDeConsentimientoVieja();
        }
        await tomarLaHistoriaAnterior(tx, personaId, 'escribir');
        const versiones = await versionesDelComponente(tx, fila.id);
        const ultima = ultimaVersion(versiones);
        const decision = decidirCambioDeAutorizacion({ ultima, pedido: que, versionVista: pedido.expectedVersion });
        if (decision.tipo === 'CONFLICTO') throw errores.conflictoDeVersion();
        const componente = { id: fila.id, profesionalId: fila.vinculo.profesionalId, alcance: fila.alcance };
        const nueva =
          decision.tipo === 'AGREGAR'
            ? await agregarVersion(tx, { componente, personaId, anterior: ultima, estado: decision.estado, procedencia, momento: await momentoDeLaHistoriaAnterior(tx) })
            : (ultima as NonNullable<typeof ultima>);
        // La respuesta es cómo queda ese componente, con lo que esta misma transacción acaba de escribir (también uno
        // terminado, al retirar).
        const [item] = (await estadoDeLaPersona(tx, personaId, fila.id)).items;
        return { estadoHttp: 200, cuerpo: { data: item }, sujetoId: personaId, recurso: { tipo: RECURSO_DE_LA_AUTORIZACION, id: nueva.id } };
      },
    });
  }

  // ─── API-HIA-04 · la historia anterior de un área, para el profesional ───────────────────────
  leer(actor: ActorAutenticado, adviseeId: string, area: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<HistoriaAnteriorResponse> {
    const recurso = { tipo: RECURSO_DE_LA_HISTORIA_ANTERIOR, id: adviseeId };
    const pedido = { inicio: query.periodStart, fin: query.periodEnd };
    // Las fechas pedidas se validan antes que nada: no dependen de la persona ni de lo que autorizó, así que no son un oráculo.
    if (pedido.inicio !== undefined || pedido.fin !== undefined) {
      const forma = tramoDeLaHistoriaAnterior(pedido, { extension: null, fechaDelCorte: '2000-01-01' });
      if (!forma.ok) throw errores.solicitudInvalida([...forma.issues]);
    }
    return this.ejecutor.leer({
      operacion: 'API-HIA-04',
      casoDeUso: DEL_PROFESIONAL,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        if (!esUuid(adviseeId) || !esAlcance(area)) throw this.ejecutor.noRevelable({ operacion: 'API-HIA-04', actorId: actor.identidadId, recurso: null }, ctx);
        const delArea: Alcance = area;
        const personaId = adviseeId.toLowerCase();
        const yo = actor.identidadId;
        // El PDP de esa área, para el par: vínculo aceptado (ni en pausa ni terminado), B2 vigente, cuentas y el A3 de la
        // persona. Su decisión queda registrada con el recurso de la historia: es la lectura que la persona ve en API-HIA-01.
        const permitida = await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-HIA-04', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, alcance: delArea, recurso: { tipo: RECURSO_DE_LA_HISTORIA_ANTERIOR, id: personaId } },
          ctx,
        );
        const componenteId = permitida.decision.alcanceDeVinculoId;
        // La autorización, con su cerrojo compartido: un retiro que empezó antes ya está confirmado cuando se lee.
        await tomarLaHistoriaAnterior(tx, personaId, 'leer');
        if (!autorizacionVigente(await versionesDelComponente(tx, componenteId))) throw noLaComparte('HISTORIA_ANTERIOR_NO_AUTORIZADA');
        const componente = await tx.alcanceDeVinculo.findUniqueOrThrow({ where: { id: componenteId }, select: { momentoDeOcurrencia: true, momentoDeRegistro: true } });
        const data = await leerHistoriaAnterior(
          tx,
          { planesDeNutricion: this.planesDeNutricion, planesDeEntrenamiento: this.planesDeEntrenamiento, ejecuciones: this.ejecuciones },
          { personaId, lectorId: yo, area: delArea, corte: inicioDe(componente), pedido },
        );
        return { data };
      },
    });
  }
}
