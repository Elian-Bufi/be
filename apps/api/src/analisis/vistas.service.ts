import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  ConfiguracionDeAnalisisSchema,
  ConfiguracionDeIndicadoresSchema,
  CrearVistaRequestSchema,
  CuerpoVacioSchema,
  ReemplazarVistaRequestSchema,
  type VistaDeAnalisis,
} from '@be/domain';
import type { Prisma, VistaDeAnalisis as FilaDeVista } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { token } from '../vinculo/lectura';
import { EjecutorDeVistas } from './ejecutor';

type Tx = Prisma.TransactionClient;

const RECURSO = 'VistaDeAnalisis';
const CASO_DE_USO = 'UC-P24';
/** Un tope generoso: las vistas son atajos de consulta, no un archivo. */
const MAXIMO_DE_VISTAS = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const USO_DB = { ANALYSIS: 'ANALISIS', SUMMARY_INDICATORS: 'INDICADORES_DEL_RESUMEN' } as const;

function vistaApi(f: FilaDeVista): VistaDeAnalisis {
  const comun = { viewId: f.id, name: f.nombre, version: token(f.version), createdAt: f.momentoDeRegistro.toISOString(), updatedAt: f.momentoDeActualizacion.toISOString() };
  // La configuración se guardó validada; se vuelve a validar al leer, por si el esquema cambió de versión.
  return f.uso === 'ANALISIS'
    ? { ...comun, usage: 'ANALYSIS', configuration: ConfiguracionDeAnalisisSchema.parse(f.configuracion) }
    : { ...comun, usage: 'SUMMARY_INDICATORS', configuration: ConfiguracionDeIndicadoresSchema.parse(f.configuracion) };
}

const yaHayIndicadores = () =>
  new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'Ya tenés una configuración de indicadores del Resumen: editala en lugar de crear otra.');

/**
 * DL-128 — Las vistas de análisis guardadas del profesional (API-VAN-01 a 04).
 * - **Solo configuración.** El cuerpo se valida con el esquema estricto del dominio: identificadores de métrica,
 *   ejercicio, serie y unidad, modo, grano, período y capas. No hay campo donde guardar un valor, un nombre de asesorado
 *   ni una nota clínica, y la vista no se ata a un asesorado: se aplica a quien se esté mirando.
 * - **No concede acceso.** Abrir una vista vuelve a pedir los datos a API-PRJ-01 y API-DSH-04, que deciden con el PDP en
 *   ese momento: una vista guardada con un alcance que después se revocó no muestra nada de ese alcance.
 * - **Propia.** Solo un profesional verificado y habilitado en algún alcance. Una vista de otro profesional responde el
 *   mismo 404 que una inexistente.
 * - **Concurrencia:** `expectedVersion` al reemplazar (409 VERSION_CONFLICT). Crear y borrar exigen Idempotency-Key.
 */
@Injectable()
export class VistasDeAnalisisService {
  constructor(private readonly ejecutor: EjecutorDeVistas) {}

  // ─── API-VAN-01 ────────────────────────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<{ data: VistaDeAnalisis[] }> {
    return this.ejecutor.leer({
      operacion: 'API-VAN-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirProfesional(tx, actor.identidadId);
        const filas = await tx.vistaDeAnalisis.findMany({ where: { profesionalId: actor.identidadId }, orderBy: [{ momentoDeActualizacion: 'desc' }, { id: 'desc' }], take: MAXIMO_DE_VISTAS });
        return { data: filas.map(vistaApi) };
      },
    });
  }

  // ─── API-VAN-02 ────────────────────────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-VAN-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearVistaRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesional(tx, actor.identidadId);
        if ((await tx.vistaDeAnalisis.count({ where: { profesionalId: actor.identidadId } })) >= MAXIMO_DE_VISTAS) {
          throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, `Llegaste al máximo de ${MAXIMO_DE_VISTAS} vistas guardadas: borrá alguna para guardar otra.`, {
            issues: [{ code: 'TOO_MANY_VIEWS', path: 'usage' }],
          });
        }
        const momento = await momentoDeLaBase(tx);
        const creada = await sinDuplicar(
          tx.vistaDeAnalisis.create({
            data: {
              profesionalId: actor.identidadId,
              nombre: pedido.name,
              uso: USO_DB[pedido.usage],
              configuracion: pedido.configuration as unknown as Prisma.InputJsonValue,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              momentoDeRegistro: momento,
              momentoDeActualizacion: momento,
            },
          }),
          yaHayIndicadores,
        );
        return { estadoHttp: 201, cuerpo: { data: vistaApi(creada) }, sujetoId: null, recurso: { tipo: RECURSO, id: creada.id } };
      },
    });
  }

  // ─── API-VAN-03 ────────────────────────────────────────────────────────────────────────────
  reemplazar(actor: ActorAutenticado, viewId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: viewId };
    return this.ejecutor.escribir({
      operacion: 'API-VAN-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: ReemplazarVistaRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesional(tx, actor.identidadId);
        const fila = await propia(tx, actor.identidadId, viewId);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        // La configuración tiene que ser la del uso de la vista: una de «Analizar» no se convierte en indicadores.
        const valida = (fila.uso === 'ANALISIS' ? ConfiguracionDeAnalisisSchema : ConfiguracionDeIndicadoresSchema).safeParse(pedido.configuration);
        if (!valida.success) {
          throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'La configuración no corresponde al uso de esta vista.', { issues: [{ code: 'CONFIGURATION_USAGE_MISMATCH', path: 'configuration' }] });
        }
        const momento = await momentoDeLaBase(tx);
        // Condicionada a la versión leída: si otra escritura avanzó en el medio, no se pisa.
        const r = await tx.vistaDeAnalisis.updateMany({
          where: { id: fila.id, version: fila.version },
          data: {
            nombre: pedido.name,
            configuracion: valida.data as unknown as Prisma.InputJsonValue,
            version: fila.version + 1,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeActualizacion: momento,
          },
        });
        if (r.count !== 1) throw errores.conflictoDeVersion();
        const actualizada = await tx.vistaDeAnalisis.findUniqueOrThrow({ where: { id: fila.id } });
        return { estadoHttp: 200, cuerpo: { data: vistaApi(actualizada) }, sujetoId: null, recurso: { tipo: RECURSO, id: fila.id } };
      },
    });
  }

  // ─── API-VAN-04 ────────────────────────────────────────────────────────────────────────────
  borrar(actor: ActorAutenticado, viewId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: viewId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-VAN-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo: cuerpo ?? {},
      huellaExtra: { viewId },
      efecto: async (tx) => {
        await exigirProfesional(tx, actor.identidadId);
        const fila = await propia(tx, actor.identidadId, viewId);
        await tx.vistaDeAnalisis.delete({ where: { id: fila.id } });
        // El ejecutor espera 200 o 201; el controlador responde 204 sin cuerpo (también al reintentar con la misma clave).
        return { estadoHttp: 200, cuerpo: null, sujetoId: null, recurso: { tipo: RECURSO, id: fila.id } };
      },
    });
  }
}

/** Solo un profesional verificado y habilitado en algún alcance guarda vistas. Otro actor: 403. */
async function exigirProfesional(tx: Tx, identidadId: string): Promise<void> {
  const [fila] = await tx.$queryRaw<{ ok: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "verificacion_profesional" vp
        JOIN "habilitacion" h ON h."identidad_id" = vp."identidad_id" AND h."alcance" = vp."alcance" AND h."estado" = 'CONCEDIDA'
       WHERE vp."identidad_id" = ${identidadId}::uuid AND vp."estado" = 'VERIFICADO') AS "ok"`;
  if (fila?.ok !== true) throw errores.accionNoPermitida();
}

/** La vista del profesional, o el 404 neutral: una ajena no se distingue de una inexistente. */
async function propia(tx: Tx, profesionalId: string, viewId: string): Promise<FilaDeVista> {
  const fila = UUID.test(viewId) ? await tx.vistaDeAnalisis.findUnique({ where: { id: viewId } }) : null;
  if (!fila || fila.profesionalId !== profesionalId) throw errores.recursoNoEncontrado();
  return fila;
}

