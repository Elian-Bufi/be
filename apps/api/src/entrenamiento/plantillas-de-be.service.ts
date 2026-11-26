import { Injectable } from '@nestjs/common';
import { plantillaDeBeParaLaApi, type ListaDePlantillasDeBeResponse } from '@be/domain';
import type { ContextoDeSolicitud } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeEntrenamiento } from './ejecutor';
import { catalogoDeLasPlantillasDeBe, decisionesSobreLasPlantillasDeBe, estadoVigente, plantillasDeBeVigentes } from './plantillas-de-be';
import { exigirProfesionalDeEntrenamiento } from './profesional-de-entrenamiento';

/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-01 y ET3-02) · API-TPB-01: las Plantillas de BE que se ofrecen, para
 * cualquier profesional con Entrenamiento habilitado (como el Recetario de BE para los de Nutrición). No tiene persona: la
 * autorización es ser profesional de Entrenamiento (lo demás, 403). La lectura queda auditada por el ejecutor. Aplicar una
 * es API-TPB-02, en el servicio de planes (crea el borrador de la persona).
 */
@Injectable()
export class PlantillasDeBeService {
  constructor(private readonly ejecutor: EjecutorDeEntrenamiento) {}

  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<ListaDePlantillasDeBeResponse> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-TPB-01',
      casoDeUso: 'UC-P15',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirProfesionalDeEntrenamiento(tx, actor.identidadId);
        const vigentes = plantillasDeBeVigentes();
        const [catalogo, decisiones] = await Promise.all([catalogoDeLasPlantillasDeBe(tx, vigentes), decisionesSobreLasPlantillasDeBe(tx)]);
        return { data: vigentes.filter((p) => estadoVigente(decisiones, p.clave) === 'PUBLISHED').map((p) => plantillaDeBeParaLaApi(p, catalogo, 'PUBLISHED')) };
      },
    });
  }
}
