/**
 * API-FRM-03 · la plantilla tiene que corresponder al Alcance de la Solicitud (UC-P32, precondición 7 y E04), por la
 * API real y contra PostgreSQL.
 * - Regla: una versión de plantilla con dominio (FRM-ENTRENAMIENTO) se pide solo en su Alcance; una sin dominio
 *   (FRM-SALUD, FRM-HABITOS) es transversal a los tres (D-D; `dominio` NULL en prisma/schema.prisma).
 * - El cruce se rechaza con `422 FORM_TEMPLATE_NOT_SELECTABLE`, el código que FRM-03 ya declaraba, y no escribe nada.
 * - Privacidad: el control va después del PDP. A quien no puede pedir, el mismo 404 neutral que ante una plantilla
 *   válida o un asesorado inexistente: el cruce no revela nada.
 * FRM-03 es el único punto de entrada que crea Solicitudes (no hay otra operación ni siembra que las cree).
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const VERSION_HABITOS = '4879e539-235f-4f91-83fc-2e113c404393';
const SEIS = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const pedidoDeEntrenamiento = (scope: string) => ({ templateVersionId: VERSION_ENTRENAMIENTO, purpose: 'Contexto', scope, requestedFieldCodes: SEIS, requiredFieldCodes: SEIS.slice(0, 5) });
const pedidoDeHabitos = (scope: string) => ({ templateVersionId: VERSION_HABITOS, purpose: 'Hábitos', scope, requestedFieldCodes: ['horas_de_sueno'], requiredFieldCodes: [] });
const pedir = (pro: Parte, adviseeId: string, cuerpo: object) => conSesion(app, pro.token).post(`/api/v1/advisees/${adviseeId}/form-requests`).send(cuerpo);

/** Profesional con NUTRICION y ENTRENAMIENTO, vinculado y autorizado en los dos con el mismo asesorado. */
async function dosAlcances(): Promise<{ pro: Parte; ase: Parte }> {
  const n = ++contador;
  const pro = await prepararProfesional(app, `alc-${n}`, ['NUTRICION', 'ENTRENAMIENTO']);
  const ase = await prepararAsesorado(app, `alc-${n}`, { a3: true });
  await vinculoCompleto(app, pro, ase, 'NUTRICION');
  await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
  return { pro, ase };
}

const escrituras = async (asesoradoId: string) => ({
  solicitudes: await prisma.solicitudDeFormulario.count({ where: { asesoradoId } }),
  eventos: await prisma.eventoDeFormulario.count({ where: { tipo: 'SolicitudDeFormularioCreada', asesoradoId } }),
});

describe('API-FRM-03 · plantilla y Alcance', () => {
  it('válidos: FRM-ENTRENAMIENTO en ENTRENAMIENTO, y una plantilla transversal en NUTRICION y en ENTRENAMIENTO', async () => {
    const { pro, ase } = await dosAlcances();
    await pedir(pro, ase.id, pedidoDeEntrenamiento('ENTRENAMIENTO')).expect(201);
    await pedir(pro, ase.id, pedidoDeHabitos('NUTRICION')).expect(201);
    await pedir(pro, ase.id, pedidoDeHabitos('ENTRENAMIENTO')).expect(201);
    expect(await prisma.solicitudDeFormulario.count({ where: { asesoradoId: ase.id } })).toBe(3);
  });

  it('cruce: FRM-ENTRENAMIENTO con Alcance NUTRICION es 422 FORM_TEMPLATE_NOT_SELECTABLE y no escribe nada', async () => {
    const { pro, ase } = await dosAlcances();
    const antes = await escrituras(ase.id);
    const r = await pedir(pro, ase.id, pedidoDeEntrenamiento('NUTRICION')).expect(422);
    expect(r.body.error.code).toBe('FORM_TEMPLATE_NOT_SELECTABLE');
    expect(r.body.error.details).toBeUndefined();
    expect(await escrituras(ase.id)).toEqual(antes);
    // Con la misma clave y el Alcance corregido, se crea: el rechazo no quedó guardado.
    await pedir(pro, ase.id, pedidoDeEntrenamiento('ENTRENAMIENTO')).expect(201);
  });

  it('privacidad: sin autorización en NUTRICION, el cruce da el mismo 404 que una plantilla válida y que un asesorado inexistente', async () => {
    const n = ++contador;
    const pro = await prepararProfesional(app, `alc-${n}`, ['NUTRICION', 'ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, `alc-${n}`, { a3: true });
    await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    const cruce = await pedir(pro, ase.id, pedidoDeEntrenamiento('NUTRICION')).expect(404);
    const valida = await pedir(pro, ase.id, pedidoDeHabitos('NUTRICION')).expect(404);
    const inexistente = await pedir(pro, randomUUID(), pedidoDeEntrenamiento('NUTRICION')).expect(404);
    expect(cruce.body).toEqual(valida.body);
    expect(cruce.body).toEqual(inexistente.body);
    expect(await prisma.solicitudDeFormulario.count({ where: { asesoradoId: ase.id } })).toBe(0);
  });
});
