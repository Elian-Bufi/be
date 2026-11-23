import { CodigoDeError } from '@be/domain';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import type { AuditoriaService } from '../plataforma/auditoria.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { recorridoApi, RecorridosService } from './recorridos.service';

/**
 * TEST-GUI-011 a 015 (WP-RECORRIDOS-GUIADOS, DL-195) · el servicio de los recorridos guiados, sin base: una base falsa
 * en memoria con varias identidades, para comprobar que cada usuario lee y marca solo lo suyo. Lo que pasa contra
 * PostgreSQL (la migración, la forma del identificador, la auditoría real y dos usuarios por HTTP) está en
 * test/integration/recorridos-guiados.int-spec.ts.
 */

const YO = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';
const actor = (identidadId: string) => ({ identidadId, sesionId: 'sesion', momentoDeAutenticacion: new Date(), expiraEn: new Date() }) as unknown as ActorAutenticado;
const CTX = { requestId: null, momentoDeRecepcion: new Date(), superficie: 'WEB', direccionIp: null, agenteDeUsuario: null } as unknown as ContextoDeSolicitud;

interface Fila {
  identidadId: string;
  recorrido: string;
  estado: 'VISTO' | 'OMITIDO';
  procedencia: unknown;
  momentoDeActualizacion: Date;
}

function armar(inicial: Fila[] = []) {
  const filas = [...inicial];
  const auditadas: { operacion: string; actorId: string; sujetoId: string; recursoId: string }[] = [];
  const escrituras: unknown[] = [];
  const tabla = {
    findMany: jest.fn(async ({ where }: { where: { identidadId: string } }) => filas.filter((f) => f.identidadId === where.identidadId)),
    findUnique: jest.fn(async ({ where }: { where: { identidadId_recorrido: { identidadId: string; recorrido: string } } }) => {
      const k = where.identidadId_recorrido;
      return filas.find((f) => f.identidadId === k.identidadId && f.recorrido === k.recorrido) ?? null;
    }),
    upsert: jest.fn(async (args: { where: { identidadId_recorrido: { identidadId: string; recorrido: string } }; create: Fila; update: Partial<Fila> }) => {
      escrituras.push(args);
      const k = args.where.identidadId_recorrido;
      const i = filas.findIndex((f) => f.identidadId === k.identidadId && f.recorrido === k.recorrido);
      if (i >= 0) filas[i] = { ...filas[i]!, ...args.update };
      else filas.push({ ...args.create, momentoDeActualizacion: new Date('2026-11-23T12:00:00.000Z') });
      return i >= 0 ? filas[i]! : filas[filas.length - 1]!;
    }),
  };
  const prisma = { recorridoGuiadoVisto: tabla, $transaction: async (fn: (tx: unknown) => unknown) => fn({ recorridoGuiadoVisto: tabla }) } as unknown as PrismaService;
  const auditoria = { registrar: jest.fn(async (e: (typeof auditadas)[number]) => void auditadas.push(e)) } as unknown as AuditoriaService;
  return { servicio: new RecorridosService(prisma, auditoria), filas, auditadas, escrituras, tabla };
}

const fila = (identidadId: string, recorrido: string, estado: Fila['estado']): Fila => ({ identidadId, recorrido, estado, procedencia: {}, momentoDeActualizacion: new Date('2026-11-20T10:00:00.000Z') });

describe('RecorridosService (API-RGU-01 y 02)', () => {
  it('TEST-GUI-011 · cada usuario lee solo lo suyo, y un recorrido que BE ya no tiene no se devuelve', async () => {
    const { servicio, tabla } = armar([fila(YO, 'training-plan-editor', 'OMITIDO'), fila(OTRO, 'nutrition-plan-editor', 'VISTO'), fila(YO, 'un-recorrido-viejo', 'VISTO')]);
    const mio = await servicio.listar(actor(YO));
    expect(mio.data).toEqual([{ tourId: 'training-plan-editor', state: 'SKIPPED', updatedAt: '2026-11-20T10:00:00.000Z' }]);
    expect(tabla.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { identidadId: YO } }));
    expect((await servicio.listar(actor(OTRO))).data.map((x) => x.tourId)).toEqual(['nutrition-plan-editor']);
  });

  it('TEST-GUI-012 · marcar escribe con la identidad de la sesión, y no toca lo del otro', async () => {
    const { servicio, filas, auditadas } = armar([fila(OTRO, 'training-plan-editor', 'VISTO')]);
    const r = await servicio.marcar(actor(YO), 'training-plan-editor', { state: 'SKIPPED' }, CTX);
    expect(r.data).toMatchObject({ tourId: 'training-plan-editor', state: 'SKIPPED' });
    expect(filas.filter((f) => f.identidadId === YO)).toHaveLength(1);
    expect(filas.find((f) => f.identidadId === OTRO)!.estado).toBe('VISTO');
    expect(auditadas).toEqual([expect.objectContaining({ operacion: 'API-RGU-02', actorId: YO, sujetoId: YO, recursoId: 'training-plan-editor' })]);
  });

  it('TEST-GUI-013 · repetir con el mismo estado no escribe ni audita; con el otro, lo reemplaza', async () => {
    const { servicio, escrituras, auditadas } = armar([fila(YO, 'nutrition-plan-editor', 'OMITIDO')]);
    await servicio.marcar(actor(YO), 'nutrition-plan-editor', { state: 'SKIPPED' }, CTX);
    expect(escrituras).toHaveLength(0);
    expect(auditadas).toHaveLength(0);
    const r = await servicio.marcar(actor(YO), 'nutrition-plan-editor', { state: 'SEEN' }, CTX);
    expect(r.data.state).toBe('SEEN');
    expect(escrituras).toHaveLength(1);
    expect(auditadas).toHaveLength(1);
  });

  it('TEST-GUI-014 · un recorrido que no existe es 404, sin leer ni escribir nada', async () => {
    const { servicio, tabla } = armar();
    await expect(servicio.marcar(actor(YO), 'otro-recorrido', { state: 'SEEN' }, CTX)).rejects.toMatchObject({ status: 404, code: CodigoDeError.RESOURCE_NOT_FOUND });
    expect(tabla.findUnique).not.toHaveBeenCalled();
    expect(tabla.upsert).not.toHaveBeenCalled();
  });

  it('TEST-GUI-015 · un cuerpo con otro estado o con otra identidad adentro es 400: la identidad sale solo de la sesión', async () => {
    const { servicio, tabla } = armar();
    for (const cuerpo of [{ state: 'DONE' }, { state: 'SEEN', identityId: OTRO }, null, 'SEEN']) {
      const e = await servicio.marcar(actor(YO), 'training-plan-editor', cuerpo, CTX).catch((x: unknown) => x);
      expect(e).toBeInstanceOf(ErrorDeApi);
      expect((e as ErrorDeApi).status).toBe(400);
    }
    expect(tabla.upsert).not.toHaveBeenCalled();
  });

  it('recorridoApi traduce los estados de la base a los de la API', () => {
    const momentoDeActualizacion = new Date('2026-11-23T00:00:00.000Z');
    expect(recorridoApi({ recorrido: 'training-plan-editor', estado: 'VISTO', momentoDeActualizacion })).toEqual({ tourId: 'training-plan-editor', state: 'SEEN', updatedAt: '2026-11-23T00:00:00.000Z' });
    expect(recorridoApi({ recorrido: 'training-plan-editor', estado: 'OMITIDO', momentoDeActualizacion })!.state).toBe('SKIPPED');
  });
});
