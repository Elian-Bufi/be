/**
 * Recuperación ante errores al responder (API-FRM-07) y corregir (API-FRM-08), por la API real y contra PostgreSQL.
 *
 * Cada caso reproduce lo que la API devuelve de verdad y lo pasa por `desenlaceDeEnvio` (el dominio que usa la APK),
 * para fijar que el mensaje que se muestra corresponde a lo que pasó, y no «el servicio no está disponible»:
 * - ya no se puede responder (respondida desde otro lado, o vínculo pausado): 422 `FORM_REQUEST_NOT_RESPONDABLE`;
 * - corrección sobre una versión vieja: 409 `VERSION_CONFLICT`, sin escribir nada;
 * - edición después de un resultado incierto: con la misma clave y otro contenido, 409 `IDEMPOTENCY_KEY_REUSED` si el
 *   primer envío **se guardó** (sin duplicar nada), y el envío nuevo se procesa si el primero no llegó;
 * - el reintento con el mismo contenido devuelve lo guardado, sin duplicar.
 */
import type { INestApplication } from '@nestjs/common';
import { crearClienteBe, desenlaceDeEnvio, VersionDePlantillaResponseSchema, type CampoDePlantilla, type Resultado } from '@be/domain';
import type { AddressInfo } from 'node:net';
import { PrismaClient } from '@prisma/client';
import type { Response } from 'supertest';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoDeEntrenamiento, type CircuitoDeEntrenamiento } from './soporte-entrenamiento';
import { pausar, versionDeVinculo } from './soporte-vinculo';

const PLANTILLA_ENTRENAMIENTO = '67e4d0b3-cf4a-41e7-9d84-6864c5dde951';
const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const SEIS = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
let campos: CampoDePlantilla[] = [];

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const respuestas = (dias: number) => ({
  answers: [
    { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza' },
    { fieldCode: 'trn_experiencia', value: 'Caminatas' },
    { fieldCode: 'trn_dias_por_semana', value: dias },
    { fieldCode: 'trn_minutos_por_sesion', value: 45 },
    { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa' },
  ],
});

/** La respuesta HTTP tal como la vería el cliente de la APK: código e issues del ErrorEnvelope. */
const comoResultado = (r: Response): Resultado<unknown> => ({ ok: false, tipo: 'API', status: r.status, codigo: r.body.error.code, issues: r.body.error.details?.issues ?? [] });

interface Escenario {
  readonly c: CircuitoDeEntrenamiento;
  readonly formRequestId: string;
  readonly responder: string;
}
async function escenario(): Promise<Escenario> {
  const c = await circuitoDeEntrenamiento(app, `rec-${++contador}`);
  const s = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/form-requests`)
    .send({ templateVersionId: VERSION_ENTRENAMIENTO, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: SEIS, requiredFieldCodes: SEIS.slice(0, 5) })
    .expect(201);
  if (campos.length === 0) {
    const v = await conSesion(app, c.ase.token).get(`/api/v1/form-templates/${PLANTILLA_ENTRENAMIENTO}/versions/${VERSION_ENTRENAMIENTO}`).expect(200);
    campos = VersionDePlantillaResponseSchema.parse(v.body).data.sections.flatMap((x) => x.fields);
  }
  return { c, formRequestId: s.body.data.formRequestId, responder: `/api/v1/me/form-requests/${s.body.data.formRequestId}/responses` };
}
const cuantasRespuestas = (e: Escenario) => prisma.respuestaDeFormulario.count({ where: { solicitudId: e.formRequestId } });
const cuantasRectificaciones = (formResponseId: string) => prisma.rectificacionDeRespuestaDeFormulario.count({ where: { respuestaId: formResponseId } });

describe('Recuperación · ya no se puede responder', () => {
  it('respondida desde otro dispositivo: 422 FORM_REQUEST_NOT_RESPONDABLE → «ya no se puede», con cargar y volver; no hay segunda respuesta', async () => {
    const e = await escenario();
    const ase = conSesion(app, e.c.ase.token);
    await ase.post(e.responder).send(respuestas(3)).expect(201);
    const r = await ase.post(e.responder).send(respuestas(4)).expect(422);
    expect(r.body.error.code).toBe('FORM_REQUEST_NOT_RESPONDABLE');
    expect(desenlaceDeEnvio(comoResultado(r), campos, { esCorreccion: false })).toMatchObject({ tipo: 'ya-no-se-puede', acciones: ['cargar', 'volver'] });
    expect(await cuantasRespuestas(e)).toBe(1);
    // Lo que lee «Cargar lo guardado» (FRM-05): ya tiene respuesta, así que la pantalla pasa a corregir. Que el borrador no
    // se pise ni se reenvíe es de la pantalla de la APK y queda para la comprobación nativa.
    const d = await ase.get(`/api/v1/form-requests/${e.formRequestId}`).expect(200);
    expect(d.body.data.response.version).toBe('v1');
  });

  it('vínculo pausado: la misma respuesta 422 FORM_REQUEST_NOT_RESPONDABLE, sin escrituras', async () => {
    const e = await escenario();
    await pausar(app, e.c.ase.token, e.c.vinculoId, await versionDeVinculo(app, e.c.ase.token, e.c.vinculoId)).expect(200);
    const r = await conSesion(app, e.c.ase.token).post(e.responder).send(respuestas(3)).expect(422);
    expect(desenlaceDeEnvio(comoResultado(r), campos, { esCorreccion: false })?.tipo).toBe('ya-no-se-puede');
    expect(await cuantasRespuestas(e)).toBe(0);
    // Lo que lee «Cargar lo guardado»: FRM-05 sigue legible para el titular, pero sin respuesta guardada. La pantalla
    // tiene que decir eso (sinRespuestaGuardada) y no «lo guardado está arriba».
    const d = await conSesion(app, e.c.ase.token).get(`/api/v1/form-requests/${e.formRequestId}`).expect(200);
    expect(d.body.data.response).toBeNull();
  });
});

describe('Recuperación · corrección sobre una versión vieja', () => {
  it('409 VERSION_CONFLICT → «versión vieja», sin escrituras; con la versión recargada, la corrección se registra una sola vez', async () => {
    const e = await escenario();
    const ase = conSesion(app, e.c.ase.token);
    const respondida = await ase.post(e.responder).send(respuestas(3)).expect(201);
    const formResponseId = respondida.body.data.formResponseId as string;
    const rectificar = `/api/v1/me/form-responses/${formResponseId}/rectifications`;
    // Otra pantalla (u otro dispositivo) corrige primero.
    await ase.post(rectificar).send({ expectedVersion: 'v1', reason: 'Desde otro lado.', ...respuestas(4) }).expect(201);
    // Esta pantalla todavía tenía la v1.
    const r = await ase.post(rectificar).send({ expectedVersion: 'v1', reason: 'Desde acá.', ...respuestas(5) }).expect(409);
    expect(r.body.error.code).toBe('VERSION_CONFLICT');
    expect(desenlaceDeEnvio(comoResultado(r), campos, { esCorreccion: true })).toMatchObject({ tipo: 'version-vieja', acciones: ['cargar', 'volver'] });
    expect(await cuantasRectificaciones(formResponseId)).toBe(1);
    // Lo que lee «Cargar lo guardado»: FRM-05 trae la v2. La persona revisa y reenvía a mano, con la versión nueva.
    const vigente = (await ase.get(`/api/v1/form-requests/${e.formRequestId}`).expect(200)).body.data.response.version;
    expect(vigente).toBe('v2');
    await ase.post(rectificar).send({ expectedVersion: vigente, reason: 'Desde acá.', ...respuestas(5) }).expect(201);
    expect(await cuantasRectificaciones(formResponseId)).toBe(2);
  });
});

describe('Recuperación · edición después de un resultado incierto', () => {
  it('responder: el primer envío llegó y no se confirmó; con la misma clave y otro contenido, 409 IDEMPOTENCY_KEY_REUSED → «envío anterior guardado»; una sola respuesta', async () => {
    const e = await escenario();
    const ase = conSesion(app, e.c.ase.token);
    const clave = claveDeIdempotencia();
    const primero = await ase.post(e.responder, clave).send(respuestas(3)).expect(201); // la APK no recibió esto
    const editado = await ase.post(e.responder, clave).send(respuestas(4)).expect(409);
    expect(editado.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(desenlaceDeEnvio(comoResultado(editado), campos, { esCorreccion: false })).toMatchObject({ tipo: 'envio-anterior-guardado', acciones: ['cargar', 'volver'] });
    expect(await cuantasRespuestas(e)).toBe(1);
    // Sin editar, el reintento devuelve lo guardado.
    const reintento = await ase.post(e.responder, clave).send(respuestas(3)).expect(201);
    expect(reintento.body).toEqual(primero.body);
    expect(await cuantasRespuestas(e)).toBe(1);
  });

  it('corregir: la corrección llegó y no se confirmó; editada con la misma clave, 409 IDEMPOTENCY_KEY_REUSED; una sola corrección', async () => {
    const e = await escenario();
    const ase = conSesion(app, e.c.ase.token);
    const formResponseId = (await ase.post(e.responder).send(respuestas(3)).expect(201)).body.data.formResponseId as string;
    const rectificar = `/api/v1/me/form-responses/${formResponseId}/rectifications`;
    const clave = claveDeIdempotencia();
    await ase.post(rectificar, clave).send({ expectedVersion: 'v1', reason: 'Un día más.', ...respuestas(4) }).expect(201);
    const editada = await ase.post(rectificar, clave).send({ expectedVersion: 'v1', reason: 'Un día más.', ...respuestas(5) }).expect(409);
    expect(desenlaceDeEnvio(comoResultado(editada), campos, { esCorreccion: true })?.tipo).toBe('envio-anterior-guardado');
    expect(await cuantasRectificaciones(formResponseId)).toBe(1);
  });

  it('si el primer envío no llegó (fue rechazado y no quedó guardado), el envío editado con la misma clave se procesa una vez', async () => {
    const e = await escenario();
    const ase = conSesion(app, e.c.ase.token);
    const clave = claveDeIdempotencia();
    await ase.post(e.responder, clave).send(respuestas(9)).expect(422); // fuera de rango: la API no guarda el error
    await ase.post(e.responder, clave).send(respuestas(4)).expect(201);
    expect(await cuantasRespuestas(e)).toBe(1);
  });
});

/**
 * Reproducción controlada de los dos escenarios de un resultado incierto, con **el mismo cliente HTTP que usa la APK**
 * (`crearClienteBe`, de @be/domain) contra la API real. Un `fetch` envuelto hace de red:
 * - «nunca llegó»: falla antes de enviar (como sin señal o en modo avión);
 * - «llegó, pero se perdió la respuesta»: envía de verdad, el servidor guarda, y el `fetch` descarta la respuesta.
 * En los dos casos el cliente devuelve `RED` (resultado incierto) y la APK conserva la clave. Lo que cambia es qué
 * pasa al reenviar con la misma clave después de editar.
 */
describe('Recuperación · resultado incierto, reproducción controlada con el cliente de la APK', () => {
  type Red = 'normal' | 'nunca-llega' | 'se-pierde-la-respuesta';
  function clienteConRed(token: string) {
    let red: Red = 'normal';
    const puerto = (app.getHttpServer().address() as AddressInfo).port;
    const cliente = crearClienteBe({
      baseUrl: `http://127.0.0.1:${puerto}/api/v1`,
      superficie: 'APK',
      fetch: (async (url: string, init: RequestInit) => {
        if (red === 'nunca-llega') throw new TypeError('sin conexión');
        const respuesta = await fetch(url, init);
        if (red === 'se-pierde-la-respuesta') {
          await respuesta.text();
          throw new TypeError('se cortó la conexión antes de recibir la respuesta');
        }
        return respuesta;
      }) as unknown as typeof fetch,
    });
    return { cliente, poner: (r: Red) => (red = r), token };
  }

  it('nunca llegó: RED; editado y reenviado con la misma clave, se procesa una vez y no aparece «envío anterior guardado»', async () => {
    const e = await escenario();
    const { cliente, poner } = clienteConRed(e.c.ase.token);
    const clave = claveDeIdempotencia();
    poner('nunca-llega');
    const primero = await cliente.responderSolicitudDeFormulario(e.c.ase.token, e.formRequestId, respuestas(3), clave);
    expect(primero).toEqual({ ok: false, tipo: 'RED' });
    expect(await cuantasRespuestas(e)).toBe(0);
    poner('normal');
    const editado = await cliente.responderSolicitudDeFormulario(e.c.ase.token, e.formRequestId, respuestas(4), clave);
    expect(editado.ok).toBe(true);
    expect(desenlaceDeEnvio(editado, campos, { esCorreccion: false })).toBeNull();
    expect(await cuantasRespuestas(e)).toBe(1);
  });

  it('llegó y se perdió la respuesta: RED; sin editar, el reintento devuelve lo guardado; editado, 409 → «envío anterior guardado»; una sola respuesta', async () => {
    const e = await escenario();
    const { cliente, poner } = clienteConRed(e.c.ase.token);
    const clave = claveDeIdempotencia();
    poner('se-pierde-la-respuesta');
    const primero = await cliente.responderSolicitudDeFormulario(e.c.ase.token, e.formRequestId, respuestas(3), clave);
    expect(primero).toEqual({ ok: false, tipo: 'RED' });
    expect(await cuantasRespuestas(e)).toBe(1); // el servidor sí guardó
    poner('normal');
    const editado = await cliente.responderSolicitudDeFormulario(e.c.ase.token, e.formRequestId, respuestas(4), clave);
    expect(desenlaceDeEnvio(editado, campos, { esCorreccion: false })?.tipo).toBe('envio-anterior-guardado');
    const reintento = await cliente.responderSolicitudDeFormulario(e.c.ase.token, e.formRequestId, respuestas(3), clave);
    expect(reintento.ok).toBe(true);
    expect(await cuantasRespuestas(e)).toBe(1);
  });
});
