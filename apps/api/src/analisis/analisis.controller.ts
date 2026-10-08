import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  conteosDelPeriodo,
  cumpleFiltros,
  ordenarEntradas,
  paginarEntradas,
  PROYECCIONES_DERIVADAS,
  type Alcance,
  type DominioDeAnalisis,
  type EntradaDeLineaDeTiempo,
  type LineaDeTiempoResponse,
  type ProyeccionResponse,
} from '@be/domain';
import { decisionesDe, OperacionProtegida, PdpGuard, type SolicitudAutorizada } from '../autorizacion/pdp.guard';
import { leerFilas } from '../antropometria/evolucion.service';
import { EjecucionesDeEntrenamientoService } from '../entrenamiento/ejecuciones.service';
import { fechaLocalEn } from '../nutricion/zona';
import { conReintento, momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { actorDe, SesionGuard } from '../sesion/sesion.guard';
import { leerBusquedaDeLineaDeTiempo, leerConsultaDeLineaDeTiempo, leerConsultaDeProyeccion, type ConsultaDeLineaDeTiempo, type ConsultaDeProyeccion } from './consultas';
import { ejecucionesDelPeriodo, hayRegistrosDeOtros, registrosDeComidaDelPeriodo, versionesActivadas, versionesDeObjetivo, ZONA } from './fuentes';
import {
  entradasDeComidas,
  entradasDeObjetivos,
  entradasDeRevisiones,
  entradasDeSeguimientos,
  entradasDeSesiones,
  entradasDeTomas,
  entradasDeVersiones,
  NombresDeAutores,
} from './lectura-linea-de-tiempo';
import { DERIVACION, objetivosDeLasVersiones, proyeccionAntropometrica, proyeccionDeEntrenamiento, proyeccionNutricional } from './lectura-proyecciones';

/** El dominio de cada clave de proyección, para decidir con el PDP (las cinco sin especificación son de Entrenamiento). */
const ALCANCE_DE_LA_CLAVE: Readonly<Record<ConsultaDeProyeccion['clave'], Alcance>> = {
  NUTRITION_PRESCRIBED_VS_RECORDED: 'NUTRICION',
  TRAINING_PROGRESSION_BY_EXERCISE: 'ENTRENAMIENTO',
  ANTHROPOMETRY_LONGITUDINAL: 'ANTROPOMETRIA',
  TRAINING_VOLUME_BY_EXERCISE: 'ENTRENAMIENTO',
  TRAINING_VOLUME_BY_MUSCLE_ZONE: 'ENTRENAMIENTO',
  TRAINING_EFFECTIVE_VS_TOTAL_VOLUME: 'ENTRENAMIENTO',
  TRAINING_PERSONAL_RECORDS: 'ENTRENAMIENTO',
  TRAINING_WORK_DISTRIBUTION_BY_MUSCLE_ZONE: 'ENTRENAMIENTO',
};

const DOMINIO: Readonly<Record<Alcance, DominioDeAnalisis>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING', ANTROPOMETRIA: 'ANTHROPOMETRY' };

/**
 * El entorno profesional de seguimiento (WP-DASHBOARD-PROFESIONAL): API-DSH-04 y API-DSH-04-BUSQUEDA (línea de tiempo y
 * búsqueda en ella; DL-127) y API-PRJ-01 (proyecciones; DL-126). Igual que API-DSH-03:
 * - `SesionGuard` autentica y `PdpGuard` valida la consulta, consume el límite de lecturas protegidas y decide por
 *   alcance, registrando cada decisión. Sin ningún alcance permitido ya respondió 404, idéntico a un asesorado inexistente.
 * - Este controlador no decide: lee **solo** los alcances permitidos, en una transacción de lectura (una foto), y siempre
 *   acotado a los planes, procesos y evaluaciones del profesional que consulta. Un alcance denegado no aporta ni un dato,
 *   ni un conteo, ni una coincidencia de búsqueda (TEST-DSH-002).
 * - `partialView` es un aviso único (B10-08 §8.4).
 */
@Controller()
export class AnalisisController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ejecuciones: EjecucionesDeEntrenamientoService,
  ) {}

  // ─── API-DSH-04 ────────────────────────────────────────────────────────────────────────────
  @Get('advisees/:adviseeId/timeline')
  @UseGuards(SesionGuard, PdpGuard)
  @OperacionProtegida({ operacion: 'API-DSH-04', parametroDelTitular: 'adviseeId', validarConsulta: leerConsultaDeLineaDeTiempo })
  async lineaDeTiempo(@Param('adviseeId') _adviseeId: string, @Req() req: SolicitudAutorizada): Promise<LineaDeTiempoResponse> {
    return this.leerLineaDeTiempo(req);
  }

  /**
   * API-DSH-04-BUSQUEDA: la línea de tiempo con un texto a buscar. Es una lectura (no crea ni cambia nada, por eso 200 y
   * sin Idempotency-Key); usa POST solo para que el texto viaje en el cuerpo y nunca en una URL, que queda en historiales,
   * proxies y bitácoras (DL-127). Mismo PDP, mismos filtros, misma paginación y la búsqueda sobre todo el período.
   */
  @Post('advisees/:adviseeId/timeline/search')
  @HttpCode(200)
  @UseGuards(SesionGuard, PdpGuard)
  @OperacionProtegida({ operacion: 'API-DSH-04-BUSQUEDA', parametroDelTitular: 'adviseeId', validarConsulta: leerBusquedaDeLineaDeTiempo })
  async busquedaEnLineaDeTiempo(@Param('adviseeId') _adviseeId: string, @Req() req: SolicitudAutorizada): Promise<LineaDeTiempoResponse> {
    return this.leerLineaDeTiempo(req);
  }

  private async leerLineaDeTiempo(req: SolicitudAutorizada): Promise<LineaDeTiempoResponse> {
    const consulta = req.consultaValidada as ConsultaDeLineaDeTiempo;
    const decisiones = decisionesDe(req);
    const titularId = decisiones.titularId as string;
    const profesionalId = actorDe(req).identidadId;
    const permitidos = decisiones.porAlcance.filter((d) => d.decision.permitida).map((d) => d.alcance);
    const { desde, hasta } = consulta.periodo;

    const { entradas, generatedAt } = await conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const nombres = new NombresDeAutores(tx);
        const todas: EntradaDeLineaDeTiempo[] = [];
        if (permitidos.includes('NUTRICION')) {
          const versiones = await versionesActivadas(tx, 'NUTRICION', profesionalId, titularId);
          todas.push(...(await entradasDeVersiones(versiones, 'NUTRICION', desde, hasta, nombres)));
          todas.push(...(await entradasDeObjetivos(await versionesDeObjetivo(tx, 'NUTRICION', profesionalId, titularId), 'NUTRICION', desde, hasta, nombres)));
          todas.push(...entradasDeComidas(await registrosDeComidaDelPeriodo(tx, profesionalId, titularId, desde, hasta), titularId, versiones));
          todas.push(...(await entradasDeRevisiones(tx, 'NUTRICION', profesionalId, titularId, desde, hasta, nombres)));
        }
        if (permitidos.includes('ENTRENAMIENTO')) {
          const versiones = await versionesActivadas(tx, 'ENTRENAMIENTO', profesionalId, titularId);
          todas.push(...(await entradasDeVersiones(versiones, 'ENTRENAMIENTO', desde, hasta, nombres)));
          todas.push(...(await entradasDeObjetivos(await versionesDeObjetivo(tx, 'ENTRENAMIENTO', profesionalId, titularId), 'ENTRENAMIENTO', desde, hasta, nombres)));
          todas.push(...entradasDeSesiones(await ejecucionesDelPeriodo(tx, this.ejecuciones, profesionalId, titularId, desde, hasta), versiones));
          todas.push(...(await entradasDeRevisiones(tx, 'ENTRENAMIENTO', profesionalId, titularId, desde, hasta, nombres)));
        }
        if (permitidos.includes('ANTROPOMETRIA')) todas.push(...(await entradasDeTomas(tx, profesionalId, titularId, desde, hasta, nombres)));
        todas.push(...(await entradasDeSeguimientos(tx, permitidos, profesionalId, titularId, desde, hasta, nombres)));
        return { entradas: todas, generatedAt: (await momentoDeLaBase(tx)).toISOString() };
      }),
    );

    // Los filtros y la búsqueda recorren **todo el período** del conjunto autorizado, no solo lo cargado en pantalla.
    const coinciden = ordenarEntradas(
      entradas.filter((e) =>
        cumpleFiltros(e, {
          dominios: consulta.dominios ?? undefined,
          tipos: consulta.tipos ?? undefined,
          estados: consulta.estados ?? undefined,
          calidades: consulta.calidades ?? undefined,
          planVersionId: consulta.planVersionId ?? undefined,
          exerciseKey: consulta.exerciseKey ?? undefined,
          q: consulta.q ?? undefined,
          soloTardias: consulta.soloTardias,
        }),
      ),
    );
    const pagina = paginarEntradas(coinciden, consulta.cursor, consulta.limite);
    return {
      data: {
        period: { start: desde, end: hasta, timeZone: ZONA },
        partialView: decisiones.porAlcance.some((d) => !d.decision.permitida),
        generatedAt,
        sourceDomains: permitidos.map((a) => DOMINIO[a]),
        totalMatching: coinciden.length,
        periodCounts: conteosDelPeriodo(entradas),
        searchScope: 'WHOLE_PERIOD',
        entries: [...pagina.entradas],
      },
      page: { limit: consulta.limite, nextCursor: pagina.siguiente, hasMore: pagina.hayMas },
    };
  }

  // ─── API-PRJ-01 ────────────────────────────────────────────────────────────────────────────
  @Get('advisees/:adviseeId/projections/:projectionKey')
  @UseGuards(SesionGuard, PdpGuard)
  @OperacionProtegida({ operacion: 'API-PRJ-01', parametroDelTitular: 'adviseeId', validarConsulta: leerConsultaDeProyeccion })
  async proyeccion(@Param('adviseeId') _adviseeId: string, @Req() req: SolicitudAutorizada): Promise<ProyeccionResponse> {
    const consulta = req.consultaValidada as ConsultaDeProyeccion;
    const decisiones = decisionesDe(req);
    const titularId = decisiones.titularId as string;
    const profesionalId = actorDe(req).identidadId;
    const alcance = ALCANCE_DE_LA_CLAVE[consulta.clave];
    const permitida = decisiones.porAlcance.some((d) => d.alcance === alcance && d.decision.permitida);
    const { desde, hasta } = consulta.periodo;
    const base = { projectionKey: consulta.clave, period: { start: desde, end: hasta, timeZone: ZONA } };

    // El profesional ve al asesorado por otro alcance, pero no por el de esta clave: el dominio es legítimo de nombrar y
    // no se revela ni un dato ni un conteo (09 v0.11 §22).
    if (!permitida) {
      return { data: { ...base, partialView: true, generatedAt: new Date().toISOString(), dataState: 'NOT_AVAILABLE_TO_VIEW', reason: null, derivation: null, sourceDomains: [], result: null } };
    }
    // Las cinco claves sin especificación: el 09 exige una que BE no tiene. No se inventan datos ni una pantalla operativa.
    if (!(PROYECCIONES_DERIVADAS as readonly string[]).includes(consulta.clave)) {
      return {
        data: { ...base, partialView: false, generatedAt: new Date().toISOString(), dataState: 'INSUFFICIENT_INFORMATION', reason: 'SPECIFICATION_PENDING', derivation: null, sourceDomains: [DOMINIO[alcance]], result: null },
      };
    }

    const sourceDomains = [DOMINIO[alcance]];
    // La transacción decide la foto y lee; las series se arman después del COMMIT, con lo leído (como API-ANT-06: armar
    // adentro retenía la conexión y bajo carga agotaba el pool, EVIDENCIA/P2028).
    const leer = <T>(lectura: (tx: Prisma.TransactionClient) => Promise<T>) => conReintento(() => this.prisma.$transaction(lectura));
    const respuesta = (generatedAt: string, hay: boolean, resultado: NonNullable<ProyeccionResponse['data']['result']>, otrasFuentes = false): ProyeccionResponse => ({
      data: {
        ...base,
        // La vista parcial de una proyección habla de su área: hay datos de ese dominio que el profesional no ve.
        partialView: otrasFuentes,
        generatedAt,
        dataState: hay ? 'AVAILABLE' : 'NO_DATA',
        reason: hay ? null : 'NO_RECORDS_IN_PERIOD',
        derivation: DERIVACION[consulta.clave as keyof typeof DERIVACION],
        sourceDomains,
        result: resultado,
      },
    });

    switch (consulta.clave) {
      case 'NUTRITION_PRESCRIBED_VS_RECORDED': {
        const d = await leer(async (tx) => {
          const ahora = await momentoDeLaBase(tx);
          return {
            ahora,
            registros: await registrosDeComidaDelPeriodo(tx, profesionalId, titularId, desde, hasta),
            versiones: await versionesActivadas(tx, 'NUTRICION', profesionalId, titularId),
            objetivos: await versionesDeObjetivo(tx, 'NUTRICION', profesionalId, titularId),
            deOtros: await hayRegistrosDeOtros(tx, 'NUTRICION', profesionalId, titularId, desde, hasta),
          };
        });
        const resultado = proyeccionNutricional(consulta, { ...d, hoy: fechaLocalEn(d.ahora, ZONA) });
        return respuesta(d.ahora.toISOString(), resultado.coverage.records > 0 || resultado.coverage.annulledExcluded > 0, resultado, d.deOtros);
      }
      case 'TRAINING_PROGRESSION_BY_EXERCISE': {
        const d = await leer(async (tx) => {
          const ejecuciones = await ejecucionesDelPeriodo(tx, this.ejecuciones, profesionalId, titularId, desde, hasta);
          return {
            ahora: await momentoDeLaBase(tx),
            ejecuciones,
            versiones: await versionesActivadas(tx, 'ENTRENAMIENTO', profesionalId, titularId),
            objetivosPorVersion: await objetivosDeLasVersiones(tx, ejecuciones),
            deOtros: await hayRegistrosDeOtros(tx, 'ENTRENAMIENTO', profesionalId, titularId, desde, hasta),
          };
        });
        const resultado = proyeccionDeEntrenamiento(consulta, d);
        return respuesta(d.ahora.toISOString(), resultado.progression ? resultado.progression.series.points.length > 0 : resultado.exercises.length > 0, resultado, d.deOtros);
      }
      case 'ANTHROPOMETRY_LONGITUDINAL': {
        const d = await leer(async (tx) => ({ ahora: await momentoDeLaBase(tx), filas: await leerFilas(tx, titularId, profesionalId, desde, hasta) }));
        const { resultado, otrasFuentes } = proyeccionAntropometrica(consulta, d.filas);
        return respuesta(d.ahora.toISOString(), resultado.available.length > 0, resultado, otrasFuentes);
      }
      default:
        throw new Error(`clave sin lectura: ${consulta.clave}`);
    }
  }
}
