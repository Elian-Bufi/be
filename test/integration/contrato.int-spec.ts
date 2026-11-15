/**
 * TEST-CT — el runtime no emite nada que el contrato no declare.
 * - WP-02: TEST-CT-ACC-01…05 · TEST-CT-P1-ACC-P1-03 · CON-05.
 * - WP-03: TEST-CT-REL-01…09 · TEST-CT-CON-01…04, 06…08 · TEST-CT-DSH-03 (parcial).
 * - WP-04: TEST-CT-NUT-01…21 · TEST-CT-INT-NUT-01 · la lista propia de ingestas (DL-055).
 * - WP-05: TEST-CT-ANT-01, 03, 05 a 12, la evolución propia, y MTH-01/02 con CAL-01 a 04.
 * - WP-06: TEST-CT-TRN por tramos; lo que todavía no tiene servicio figura en EN_CONSTRUCCION.
 * - WP-07: TEST-CT-FRM-01 a 08 (catálogo, Solicitud, Respuesta, rectificación).
 * - WP-08: TEST-CT-INT-NUT-02/03 y TEST-CT-INT-TRN-02/03, contra un proveedor falso local (D-H).
 * - WP-NUTRICION-RECETAS: las familias REC (DL-119), MED (DL-120) e ING (DL-121), con las rutas firmadas de MED-02 y 04.
 * - WP-ENTRENAMIENTO-SERIES: las familias SER (DL-122), TIE (DL-124) y EJE (DL-123), y MED con la imagen de un ejercicio.
 * - Precierre del 2026-10-06: EVIDENCIA_VISUAL (EVI-01 a 04, DL-125), y MED-01 con la exigencia activa, en una segunda app
 *   con el mismo observador.
 * - WP-INVITACION: la familia INV (DL-136), con la invitación vencida escrita directo en la base.
 * - WP-ACCESO-GOOGLE: la familia GOO (DL-138) contra un Google falso local, y el 503 en una segunda app sin client IDs.
 * - WP-NOTAS-DE-COORDINACION: API-CRD-01 (09 §11.6) y sus dos variantes, CRD-01-LISTA y CRD-01-PROPIA (DL-140).
 * - WP-ADMINISTRACION: la familia ADM (DL-155), con un administrador incorporado por el comando interno y su autenticador.
 * - WP-TABLERO-ALTA-GAMA: API-DSH-02, la cola de revisiones (09 v0.11 §14; DL-163 D-6; TB-14), y API-PLN-07 y API-PLE-05,
 *   descartar un borrador de plan que nunca se activó (DL-163 D-21; TB-47).
 *   Y la familia RES, lo que la persona comparte de otras áreas, el plan del otro y el pedido (DL-163 D-13, ampliada;
 *   TB-52 a TB-56).
 * - WP-USO-FINAL (UF-11): la familia MFA, el segundo factor del profesional sobre su sesión común (DL-169).
 * - WP-USO-FINAL (UF-04): API-ADM-14 y 15, la entrada de los profesionales reales y su nombre profesional (DL-169).
 * - WP-USO-FINAL (UF-03): API-ACC-P1-01 y 02 y API-ADM-18, recuperar el acceso y la recuperación asistida (DL-169).
 * - WP-USO-FINAL (UF-07): API-SOP-01, el canal de ayuda y contacto (DL-169).
 * - WP-USO-FINAL (UF-05): API-ACC-08, aceptar la versión vigente de los términos o de la privacidad (DL-169).
 * - RF-068 y RF-004: las familias INC y MET, las incidencias y los métodos de acceso de la cuenta propia (DL-172).
 * - WP-PULIDO-GRANDES (DL-173): API-TRN-25 y sus variantes LISTA y PROPIA (PG-15) y la familia NPP (PG-16).
 * Un observador registra cada respuesta real (método, ruta, status, código). Después se exige que todo par
 * (status, código) esté declarado para esa operación en `OPERACIONES`, la misma fuente que genera
 * `docs/api/openapi.json` (09v7 T21).
 */
import type { INestApplication } from '@nestjs/common';
import { VERSION_VIGENTE, codificarOcurrencia } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { erroresDeclarados, OPERACIONES, operacionDe } from '../../packages/domain/src/openapi';
import { incorporarAdministrador } from '../../apps/api/src/administracion/incorporacion';
import { TokensService } from '../../apps/api/src/sesion/tokens.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { VerificacionService } from '../../apps/api/src/profesional/verificacion.service';
import { adm, administradorListo, codigoQueNoVale, codigoTotp, primerFactor, profesionalPendiente } from './soporte-administracion';
import { codigoDelPaso } from './soporte-segundo-factor';
import {
  appDePrueba,
  claveDeIdempotencia,
  conSesion,
  correoSintetico,
  entornoDePrueba,
  CREDENCIAL_SINTETICA,
  cuerpoDeCierre,
  cuerpoDeRegistro,
  login,
  NOMBRE_SINTETICO,
  OTRA_CREDENCIAL_SINTETICA,
  registrar,
  registrarOk,
  tokenDe,
  transicionPorServicio,
} from './soporte-api';
import { a3Vigente, aceptar, dashboard, finalizar, pausar, prepararAsesorado, prepararProfesional, solicitar, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';
import { CATALOGO_DEMO, circuitoAntropometrico } from './soporte-antropometria';
import { randomBytes, randomUUID } from 'node:crypto';
import { huellaDeSecretoDeInvitacion } from '../../apps/api/src/vinculo/invitaciones.service';
import {
  activar,
  circuitoListoParaPlanificar,
  crearBorrador,
  cuerpoDeEvaluacion,
  cuerpoDeObjetivo,
  cuerpoDeRevision,
  estructura,
  circuitoConPlanActivo,
  patchConSesion,
  registrarComida,
  registrarLibre,
} from './soporte-nutricion';
import { ProcesoService } from '../../apps/api/src/proceso/proceso.service';
import {
  activarPlanDeEntrenamiento,
  CATALOGO_DE_EJERCICIOS,
  circuitoConPlanDeEntrenamientoActivo,
  circuitoDeEntrenamiento,
  circuitoListoParaPlanificarEntrenamiento,
  crearBorradorDeEntrenamiento,
  cuerpoDeEvaluacionDeEntrenamiento,
  cuerpoDeObjetivoDeEntrenamiento,
  estructuraDeEntrenamiento,
} from './soporte-entrenamiento';
import { levantarProveedorFalso, OFF, WGER, type ProveedorFalso } from './soporte-proveedores';
import { circuitoV2, conAgua, fri, RESPUESTAS_V2 } from './soporte-formularios-v2';
import { catalogoDePlantillas, sembrarAntecedentesDeP0, sembrarCopiaDeLaVersion, VERSION_HABITOS_V1 } from './soporte-plantillas-de-inicio';
import { googleDePrueba, idTokenDeGoogle, levantarGoogleFalso, reclamosDeGoogle, subSintetico, type GoogleFalso } from './soporte-google';
import { alimentosUsda, cuerpoDeReceta, estructuraConRecetas, FOTOS, leerContenido, RECETAS, subirBytes, subirImagen } from './soporte-recetas';
import {
  abrirBorrador,
  activar as activarLaDemo,
  asociarImagen,
  borradorDeLaDemo,
  corrida,
  cuerpoDeImagen,
  IMAGENES_DEL_PAQUETE,
  mandarEventos,
  ocurrenciaDeHoy,
  pasosDelEjemplo,
  prescripcionIdDe,
  registrarYConfirmar,
  retirarImagen,
  SESION_DEMO,
  subirImagenDeEjercicio,
  usarLaApk,
} from './soporte-por-serie';

interface Observada {
  metodo: string;
  ruta: string;
  status: number;
  codigo: string | null;
}

const observadas: Observada[] = [];
const prisma = new PrismaClient();
let app: INestApplication;
let proveedor: ProveedorFalso;
let google: GoogleFalso;

/** El observador: cada respuesta real, con su método, su ruta, su status y su código. */
function observar(a: INestApplication): void {
  a.use((req: Request, res: Response, next: NextFunction) => {
    let codigo: string | null = null;
    const json = res.json.bind(res);
    res.json = (cuerpo: unknown) => {
      codigo = (cuerpo as { error?: { code?: string } } | null)?.error?.code ?? null;
      return json(cuerpo);
    };
    res.on('finish', () => observadas.push({ metodo: req.method.toLowerCase(), ruta: req.originalUrl.split('?')[0], status: res.statusCode, codigo }));
    next();
  });
}

beforeAll(async () => {
  proveedor = await levantarProveedorFalso();
  // DL-138: un Google falso local para la familia GOO; ninguna prueba consulta a Google.
  google = await levantarGoogleFalso();
  app = await appDePrueba({ proveedores: { openFoodFactsUrl: proveedor.url, wgerUrl: proveedor.url, presupuestoMs: 1_500 }, ...googleDePrueba(google) }, observar);
});
afterAll(async () => {
  await app.close();
  await proveedor.cerrar();
  await google.cerrar();
  await prisma.$disconnect();
});

const CIERRE = '/api/v1/me/account-closure-requests';

it('TEST-CT (WP-02): se ejercitan éxitos y errores de las siete operaciones de identidad y sesiones, las tres del perfil propio (DL-009 y DL-169) y la reanudación del website (DL-147)', async () => {
  const servidor = app.getHttpServer();
  // ACC-01
  const correo = correoSintetico('contrato');
  const clave = claveDeIdempotencia();
  await registrar(app, correo, { clave }).expect(201);
  await registrar(app, correo).expect(409); // REGISTRATION_NOT_AVAILABLE
  await registrar(app, correoSintetico('contrato-otro'), { clave }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await request(servidor).post('/api/v1/registrations').send(cuerpoDeRegistro(correoSintetico('sin-key'))).expect(400);
  await request(servidor).post('/api/v1/registrations?x=1').set('Idempotency-Key', claveDeIdempotencia()).send(cuerpoDeRegistro(correoSintetico('query'))).expect(400);
  await request(servidor).post('/api/v1/registrations').set('Idempotency-Key', claveDeIdempotencia()).send({ ...cuerpoDeRegistro(correoSintetico('campo')), rol: 'X' }).expect(400);
  await request(servidor)
    .post('/api/v1/registrations')
    .set('Idempotency-Key', claveDeIdempotencia())
    .send({ ...cuerpoDeRegistro(correoSintetico('terminos')), termsAcceptance: { versionId: 'vieja' } })
    .expect(422);
  await request(servidor)
    .post('/api/v1/registrations')
    .set('Idempotency-Key', claveDeIdempotencia())
    .send({ ...cuerpoDeRegistro(correoSintetico('privacidad')), privacyAcknowledgement: { versionId: 'vieja' } })
    .expect(422);
  await request(servidor).post('/api/v1/registrations').set('Content-Type', 'application/json').set('Idempotency-Key', claveDeIdempotencia()).send('{no es json').expect(400);
  // DL-169 (UF-D1): sin el nombre, lo que un cliente anterior traduce a «actualizá la app»; en blanco, el error del campo.
  const { profile: _sinNombre, ...sinNombre } = cuerpoDeRegistro(correoSintetico('ct-sin-nombre'));
  await request(servidor).post('/api/v1/registrations').set('Idempotency-Key', claveDeIdempotencia()).send(sinNombre).expect(422); // TERMS_VERSION_NOT_ACCEPTABLE
  await request(servidor)
    .post('/api/v1/registrations')
    .set('Idempotency-Key', claveDeIdempotencia())
    .send({ ...sinNombre, profile: { displayName: '  ' } })
    .expect(422); // VALIDATION_FAILED

  // ACC-02
  await login(app, correo).expect(201);
  await login(app, correo, OTRA_CREDENCIAL_SINTETICA).expect(401);
  await request(servidor).post('/api/v1/auth/sessions').send({ method: 'GOOGLE', identifier: correo, credential: CREDENCIAL_SINTETICA }).expect(400);
  await request(servidor).post('/api/v1/auth/sessions').send({ method: 'LOCAL', identifier: correo, credential: CREDENCIAL_SINTETICA, rol: 'X' }).expect(400);

  // ACC-02-REANUDACION (DL-147): la cookie de reanudación que manda el login del website.
  const entradaWeb = await login(app, correo, CREDENCIAL_SINTETICA, 'WEB').expect(201);
  const cookieWeb = ([] as string[]).concat(entradaWeb.headers['set-cookie'] ?? []).find((c) => c.startsWith('__Secure-be-reanudacion='))?.split(';')[0] ?? '';
  await request(servidor).post('/api/v1/auth/sessions/resume').set('X-BE-Surface', 'WEB').set('Cookie', cookieWeb).expect(200);
  await request(servidor).post('/api/v1/auth/sessions/resume?x=1').set('X-BE-Surface', 'WEB').set('Cookie', cookieWeb).expect(400);
  await request(servidor).post('/api/v1/auth/sessions/resume').set('X-BE-Surface', 'WEB').expect(401); // AUTHENTICATION_REQUIRED

  // ACC-05 · CON-05 · ACC-04 · ACC-03
  const token = await tokenDe(app, correo);
  await conSesion(app, token).get('/api/v1/me').expect(200);
  await conSesion(app, token).get('/api/v1/me?x=1').expect(400);
  await request(servidor).get('/api/v1/me').expect(401);
  await conSesion(app, 'no-es-un-jwt').get('/api/v1/me').expect(401);
  // ACC-06-PROPIA · ACC-06: el nombre visible del perfil propio (DL-009 y DL-040, 2026-10-15)
  await conSesion(app, token).get('/api/v1/me/profile').expect(200);
  await conSesion(app, token).get('/api/v1/me/profile?x=1').expect(400);
  await request(servidor).get('/api/v1/me/profile').expect(401);
  // La cuenta nace con su nombre (v1, DL-169).
  await conSesion(app, token).patch('/api/v1/me/profile').send({ expectedVersion: 'v1', changes: { displayName: 'Ana Paz' } }).expect(200);
  await conSesion(app, token).patch('/api/v1/me/profile').send({ expectedVersion: 'v1', changes: { displayName: 'Otra' } }).expect(409); // VERSION_CONFLICT
  await conSesion(app, token).patch('/api/v1/me/profile').send({ expectedVersion: 'v2', changes: { displayName: '   ' } }).expect(422); // INVALID_PROFILE_DATA
  await conSesion(app, token).patch('/api/v1/me/profile').send({ expectedVersion: 'v2', changes: { displayName: null } }).expect(422); // INVALID_PROFILE_DATA (no se quita, UF-D3)
  await conSesion(app, token).patch('/api/v1/me/profile').send({ expectedVersion: 'v1', changes: { displayName: 'Ana', email: 'ana@example.invalid' } }).expect(400); // UNKNOWN_FIELD
  await conSesion(app, token).patch('/api/v1/me/profile').send({ expectedVersion: 'uno', changes: { displayName: 'Ana' } }).expect(400); // INVALID_REQUEST
  await request(servidor).patch('/api/v1/me/profile').send({ expectedVersion: 'v1', changes: { displayName: 'Ana' } }).expect(401);
  // ACC-07: lo que falta para seguir (DL-169, UF-D4).
  await conSesion(app, token).get('/api/v1/me/pending-steps').expect(200);
  await conSesion(app, token).get('/api/v1/me/pending-steps?x=1').expect(400);
  await request(servidor).get('/api/v1/me/pending-steps').expect(401);
  await conSesion(app, token).get('/api/v1/me/health-data-consent-requirement').expect(200);
  await conSesion(app, token).get('/api/v1/me/health-data-consent-requirement?x=1').expect(400);
  await request(servidor).get('/api/v1/me/health-data-consent-requirement').expect(401);
  await conSesion(app, token).delete('/api/v1/auth/sessions?x=1').expect(400);
  await conSesion(app, token).delete('/api/v1/auth/sessions').expect(204);
  await conSesion(app, token).delete('/api/v1/auth/sessions').expect(401); // SESSION_REVOKED
  await conSesion(app, token).get('/api/v1/me').expect(401); // SESSION_REVOKED
  await request(servidor).delete('/api/v1/auth/sessions').expect(401);
  const otro = await tokenDe(app, correo);
  await conSesion(app, otro).delete('/api/v1/auth/sessions/current?x=1').expect(400);
  await conSesion(app, otro).delete('/api/v1/auth/sessions/current').expect(204);
  await conSesion(app, otro).delete('/api/v1/auth/sessions/current').expect(204);
  await request(servidor).delete('/api/v1/auth/sessions/current').expect(401);
  await conSesion(app, 'no-es-un-jwt').delete('/api/v1/auth/sessions/current').expect(401);

  // ACC-P1-03
  const t = await tokenDe(app, correo);
  await request(servidor).post(CIERRE).set('Authorization', `Bearer ${t}`).send(cuerpoDeCierre()).expect(400); // sin key
  await conSesion(app, t).post(CIERRE).send(cuerpoDeCierre({ borrarTodo: true })).expect(400);
  await conSesion(app, t).post(CIERRE).send(cuerpoDeCierre({ confirmed: false })).expect(422);
  await request(servidor).post(CIERRE).set('Idempotency-Key', claveDeIdempotencia()).send(cuerpoDeCierre()).expect(401);
  const id = (await conSesion(app, t).get('/api/v1/me').expect(200)).body.data.identityId as string;
  const { version } = await prisma.controlDeSesion.findUniqueOrThrow({ where: { identidadId: id } });
  const vieja = await prisma.sesion.create({
    data: { identidadId: id, momentoDeOcurrencia: new Date(Date.now() - 11 * 60_000), expiraEn: new Date(Date.now() + 3600_000), versionDeControl: version },
  });
  const tokenViejo = app.get(TokensService).firmar({ sub: id, sid: vieja.id, tv: version }, vieja.expiraEn);
  await conSesion(app, tokenViejo).post(CIERRE).send(cuerpoDeCierre()).expect(403);
  const claveDeCierre = claveDeIdempotencia();
  await conSesion(app, t).post(CIERRE, claveDeCierre).send(cuerpoDeCierre()).expect(201);
  await conSesion(app, t).post(CIERRE, claveDeCierre).send(cuerpoDeCierre({ consequencesAcknowledgement: { versionId: VERSION_VIGENTE.TERMINOS.id } })).expect(409);
});


it('TEST-CT (WP-03): se ejercitan éxitos y errores de REL, CON y DSH-03', async () => {
  const servidor = app.getHttpServer();
  const pn = await prepararProfesional(app, 'ct', ['NUTRICION']);
  const pt = await prepararProfesional(app, 'ct-t', ['ENTRENAMIENTO']);
  const a01 = await prepararAsesorado(app, 'ct', { a3: true });
  const a02 = await prepararAsesorado(app, 'ct-2');

  // REL-01
  const clave = claveDeIdempotencia();
  const creada = await solicitar(app, pn, a01.id, 'NUTRICION', clave).expect(201);
  const solicitudId = creada.body.data.relationshipRequestId as string;
  await solicitar(app, pn, a01.id, 'NUTRICION').expect(200); // equivalente pendiente (REG-06-44)
  await solicitar(app, pn, a02.id, 'NUTRICION', clave).expect(409); // IDEMPOTENCY_KEY_REUSED
  await request(servidor).post('/api/v1/relationship-requests').set('Authorization', `Bearer ${pn.token}`).send({}).expect(400); // sin key
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a01.id }, scope: { code: 'NUTRICION' }, purpose: 'x', rol: 'PRO' }).expect(400);
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: '00000000-0000-4000-8000-000000000000' }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' }).expect(404);
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a02.id }, scope: { code: 'NUTRICION' }, purpose: '' }).expect(422); // PURPOSE_REQUIRED
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a02.id }, scope: { code: 'PSICOLOGIA' }, purpose: 'x' }).expect(422); // SCOPE_NOT_AVAILABLE
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: pn.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' }).expect(422); // COUNTERPART_NOT_ELIGIBLE
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a02.id }, scope: { code: 'NUTRICION' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' }).expect(422); // VALIDATION_FAILED
  await conSesion(app, pn.token).post('/api/v1/relationship-requests').send({ target: { type: 'ADVISEE', identityId: a02.id }, scope: { code: 'ENTRENAMIENTO' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' }).expect(422); // SCOPE_NOT_AVAILABLE: no verificado
  await request(servidor).post('/api/v1/relationship-requests').set('Idempotency-Key', claveDeIdempotencia()).send({}).expect(401);

  // REL-02
  await conSesion(app, a01.token).get('/api/v1/me/relationship-requests').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/relationship-requests?state=PENDIENTE&limit=5').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/relationship-requests?orden=asc').expect(400);
  await conSesion(app, a01.token).get('/api/v1/me/relationship-requests?cursor=basura').expect(400); // INVALID_CURSOR
  await request(servidor).get('/api/v1/me/relationship-requests').expect(401);

  // REL-03 / REL-04
  await aceptar(app, pn, solicitudId).expect(404); // el profesional no acepta por el asesorado
  await aceptar(app, a01, solicitudId, 'v9').expect(409); // VERSION_CONFLICT
  const claveDeAceptar = claveDeIdempotencia();
  const aceptada = await aceptar(app, a01, solicitudId, 'v1', claveDeAceptar).expect(200);
  const vinculoId = aceptada.body.data.relationshipId as string;
  await aceptar(app, a01, solicitudId, 'v1', claveDeAceptar).expect(200); // replay idempotente
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${solicitudId}/accept`, claveDeAceptar).send({ expectedVersion: 'v2' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await aceptar(app, a01, solicitudId, 'v2').expect(422); // ya ACEPTADA
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${solicitudId}/accept`).send({ expectedVersion: 'uno' }).expect(400);
  const paraRechazar = await solicitar(app, pt, a01.id, 'ENTRENAMIENTO').expect(201);
  const rechazoId = paraRechazar.body.data.relationshipRequestId as string;
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${rechazoId}/reject`).send({ expectedVersion: 'v7' }).expect(409);
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${rechazoId}/reject`).send({ expectedVersion: 'v1' }).expect(200);
  await conSesion(app, a01.token).post(`/api/v1/relationship-requests/${rechazoId}/reject`).send({ expectedVersion: 'v2' }).expect(422);
  await conSesion(app, pt.token).post(`/api/v1/relationship-requests/${rechazoId}/reject`).send({ expectedVersion: 'v2' }).expect(404);
  await solicitar(app, pn, a01.id, 'NUTRICION').expect(409); // RESOURCE_CONFLICT: ya hay vínculo vigente

  // REL-05 / REL-06
  await conSesion(app, pn.token).get('/api/v1/me/relationships').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/relationships?scope=NUTRICION&state=ACEPTADO').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/relationships?scope=PSICOLOGIA').expect(400);
  await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}`).expect(200);
  await conSesion(app, a02.token).get(`/api/v1/relationships/${vinculoId}`).expect(404);
  await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}?x=1`).expect(400);

  // CON-01 / CON-02 / CON-03
  await conSesion(app, pn.token).get(`/api/v1/relationships/${vinculoId}/consent-requirements`).expect(404);
  const requisitos = await conSesion(app, a01.token).get(`/api/v1/relationships/${vinculoId}/consent-requirements`).expect(200);
  const versionB2 = requisitos.body.data.consentVersion.id as string;
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: 'terminos-2026-09-demo' }).expect(409); // CONSENT_VERSION_STALE
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2, professionalId: pn.id }).expect(400);
  await conSesion(app, pn.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2 }).expect(404);
  const otorgado = await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2 }).expect(201);
  const consentId = otorgado.body.data.consentId as string;
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2 }).expect(200); // ya vigente con esa versión
  await conSesion(app, a01.token).get('/api/v1/me/consents').expect(200);
  await conSesion(app, a01.token).get('/api/v1/me/consents?state=VIGENTE').expect(400);

  // DSH-03
  await dashboard(app, pn, a01.id).expect(200);
  await conSesion(app, pn.token).get(`/api/v1/advisees/${a01.id}/dashboard?periodStart=2026-09-01T00:00:00Z&periodEnd=2026-09-30T00:00:00Z`).expect(200);
  await conSesion(app, pn.token).get(`/api/v1/advisees/${a01.id}/dashboard?periodStart=ayer`).expect(400);
  await dashboard(app, pt, a01.id).expect(404);
  await request(servidor).get(`/api/v1/advisees/${a01.id}/dashboard`).expect(401);

  // DSH-04 (cartera del profesional, DL-107): éxito con y sin filtros; query inválida y cursor inválido; sin sesión.
  await conSesion(app, pn.token).get('/api/v1/me/portfolio').expect(200);
  await conSesion(app, pn.token).get('/api/v1/me/portfolio?periodStart=2026-09-01&periodEnd=2026-09-30&domain=nutrition&kind=REVIEW_OVERDUE&limit=5').expect(200);
  await conSesion(app, pn.token).get('/api/v1/me/portfolio?periodStart=ayer').expect(400);
  await conSesion(app, pn.token).get('/api/v1/me/portfolio?cursor=%3F%3F').expect(400);
  await request(servidor).get('/api/v1/me/portfolio').expect(401);

  // DSH-02 (la cola de revisiones, DL-163 D-6; TB-14): éxito con y sin filtros; query inválida y cursor inválido; sin sesión.
  await conSesion(app, pn.token).get('/api/v1/me/review-queue').expect(200);
  await conSesion(app, pn.token).get('/api/v1/me/review-queue?domain=NUTRITION&status=ACTIVE_PLAN_WITHOUT_REVIEW&limit=5').expect(200);
  await conSesion(app, pn.token).get('/api/v1/me/review-queue?status=SCORE').expect(400); // INVALID_REQUEST
  await conSesion(app, pn.token).get('/api/v1/me/review-queue?cursor=%3F%3F').expect(400); // INVALID_CURSOR
  await request(servidor).get('/api/v1/me/review-queue').expect(401);

  // REL-07 / REL-08 / REL-09
  const v = await versionDeVinculo(app, a01.token, vinculoId);
  await pausar(app, a01.token, vinculoId, 'v99').expect(409); // VERSION_CONFLICT
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/pause`).send({ expectedVersion: v, reason: 'porque sí' }).expect(400);
  await pausar(app, a02.token, vinculoId, v).expect(404);
  await pausar(app, a01.token, vinculoId, v).expect(200);
  const vPausado = await versionDeVinculo(app, a01.token, vinculoId);
  await pausar(app, a01.token, vinculoId, vPausado).expect(422); // ya PAUSADO
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: versionB2 }).expect(422); // RELATIONSHIP_NOT_READY_FOR_CONSENT
  await conSesion(app, pn.token).post(`/api/v1/relationships/${vinculoId}/resume`).send({ expectedVersion: vPausado }).expect(403); // lo pausó el asesorado
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/resume`).send({ expectedVersion: vPausado }).expect(200);
  const vActivo = await versionDeVinculo(app, a01.token, vinculoId);
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/resume`).send({ expectedVersion: vActivo }).expect(422); // ya ACEPTADO

  // CON-04
  await conSesion(app, a02.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({}).expect(404);
  await conSesion(app, a01.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({ motivo: 'x' }).expect(400);
  await conSesion(app, a01.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({}).expect(200);
  await conSesion(app, a01.token).post(`/api/v1/me/consents/${consentId}/revoke`).send({}).expect(200); // REVOKED → REVOKED
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/finalize`).send({ expectedVersion: vActivo, reason: 'OBJETIVO_CUMPLIDO' }).expect(200);
  await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/finalize`).send({ expectedVersion: 'v99', reason: 'OBJETIVO_CUMPLIDO' }).expect(422); // FINALIZADO es terminal

  // CON-06 / CON-07 / CON-08
  await conSesion(app, a02.token).post('/api/v1/me/health-data-consents').send({ consentVersionId: 'terminos-2026-09-demo' }).expect(422); // HEALTH_DATA_CONSENT_NOT_AVAILABLE
  const claveA3 = claveDeIdempotencia();
  const a3 = await conSesion(app, a02.token).post('/api/v1/me/health-data-consents', claveA3).send({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id }).expect(201);
  await conSesion(app, a02.token).post('/api/v1/me/health-data-consents', claveA3).send({ consentVersionId: 'otra-version' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await conSesion(app, a02.token).post('/api/v1/me/health-data-consents').send({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id }).expect(409); // CONSENT_ALREADY_ACTIVE
  await conSesion(app, a02.token).get('/api/v1/me/health-data-consents').expect(200);
  await conSesion(app, a02.token).get('/api/v1/me/health-data-consents?cursor=x').expect(400);
  await conSesion(app, a01.token).post(`/api/v1/me/health-data-consents/${a3.body.data.consentId}/revoke`).send({}).expect(404);
  await conSesion(app, a02.token).post(`/api/v1/me/health-data-consents/${a3.body.data.consentId}/revoke`).send({}).expect(200);
  await conSesion(app, a02.token).post(`/api/v1/me/health-data-consents/${a3.body.data.consentId}/revoke`).send({}).expect(200);
});

it('TEST-CT (WP-04): se ejercitan éxitos y errores de NUT e INT-NUT-01', async () => {
  const c = await circuitoListoParaPlanificar(app, 'contrato');
  const pro = conSesion(app, c.pro.token);
  const ase = conSesion(app, c.ase.token);
  const ajeno = randomUUID();
  // NUT-01 a 06
  const evClave = claveDeIdempotencia();
  const ev = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`, evClave).send(cuerpoDeEvaluacion()).expect(201);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`, evClave).send({ ...cuerpoDeEvaluacion(), context: 'otro' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).send({ ...cuerpoDeEvaluacion(), occurredAt: new Date(Date.now() + 86_400_000).toISOString() }).expect(422);
  await pro.post(`/api/v1/advisees/${ajeno}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(404);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).send({ ...cuerpoDeEvaluacion(), extra: 1 }).expect(400);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations`).expect(200);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/evaluations?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/evaluations`).expect(404);
  await pro.get(`/api/v1/nutrition/evaluations/${ev.body.data.evaluationId}`).expect(200);
  await pro.get(`/api/v1/nutrition/evaluations/${ajeno}`).expect(404);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).send(cuerpoDeObjetivo(ajeno)).expect(422); // EVALUATION_NOT_COMPATIBLE
  await pro.post(`/api/v1/advisees/${ajeno}/nutrition/objectives`).send(cuerpoDeObjetivo(c.evaluationId)).expect(404);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).expect(200);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/objectives`).expect(404);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/objectives/effective`).expect(200);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/objectives/effective`).expect(404);
  // NUT-13 e INT-NUT-01
  await pro.get('/api/v1/nutrition/catalog-items?q=arroz').expect(200);
  await pro.get('/api/v1/nutrition/catalog-items?type=OTRO').expect(400);
  await ase.get('/api/v1/nutrition/catalog-items').expect(403);
  // NUT-13-BUSQUEDA (DL-130): la misma lectura con el texto en el cuerpo; un campo de más, un cursor alterado o un parámetro
  // en la URL son 400, y un asesorado no busca en el catálogo profesional.
  await pro.post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz', limit: 5 }).expect(200);
  await pro.post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz', orden: 'asc' }).expect(400); // UNKNOWN_FIELD
  await pro.post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz', cursor: 'basura' }).expect(400); // INVALID_CURSOR
  await pro.post('/api/v1/nutrition/catalog-items/search?q=arroz').send({ q: 'arroz' }).expect(400); // INVALID_REQUEST: nada en la URL
  await ase.post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz' }).expect(403);
  const nuevo = { name: 'Galleta sintética', itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 420, proteinG: 8, carbohydrateG: 70, fatG: 12 } };
  await pro.post('/api/v1/nutrition/catalog-items').send(nuevo).expect(201);
  await ase.post('/api/v1/nutrition/catalog-items').send(nuevo).expect(403);
  // NUT-07 a 12
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: ajeno }).expect(422); // OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE
  await pro.post(`/api/v1/advisees/${ajeno}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId }).expect(404);
  const b = await crearBorrador(app, c);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId }).expect(409); // RESOURCE_CONFLICT: ya hay un borrador
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/plans?state=DRAFT`).expect(200);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/plans?state=OTRO`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/plans`).expect(404);
  await pro.get(`/api/v1/nutrition/plans/${b.planId}`).expect(200);
  await pro.get(`/api/v1/nutrition/plans/${ajeno}`).expect(404);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: 'v9', changes: { dayTypes: [] } }).expect(409);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: b.version, changes: { dayTypes: [{ label: 'D', meals: [{ label: 'M', prescriptionMode: 'EXCHANGE_PORTIONS', options: [] }] }] } }).expect(422);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${ajeno}`).send({ expectedVersion: 'v1', changes: { dayTypes: [] } }).expect(404);
  const guardado = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructura(c.arroz, c.pollo) }).expect(200);
  await pro.post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: 'v1' }).expect(409);
  await pro.post(`/api/v1/nutrition/plans/${ajeno}/validate`).send({ expectedVersion: 'v1' }).expect(404);
  await pro.post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: guardado.body.data.version }).expect(200);
  await activar(app, c.pro, b.planId, 'v1').expect(409);
  await activar(app, c.pro, ajeno, 'v1').expect(404);
  const act = await activar(app, c.pro, b.planId, guardado.body.data.version).expect(200);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${b.planId}`).send({ expectedVersion: act.body.data.version, changes: { dayTypes: [] } }).expect(422); // PLAN_NOT_EDITABLE
  await pro.post(`/api/v1/nutrition/plans/${b.planId}/validate`).send({ expectedVersion: act.body.data.version }).expect(422); // PLAN_NOT_EDITABLE
  await activar(app, c.pro, b.planId, act.body.data.version).expect(422); // OPERATION_NOT_READY
  // NUT-14 a 16, lista propia y NUT-21
  const hoy = await ase.get('/api/v1/me/nutrition/today').expect(200);
  await ase.get('/api/v1/me/nutrition/today?otro=1').expect(400);
  const dia = hoy.body.data.activePlan.dayTypes[0];
  const reg = await registrarComida(app, c.ase, b.planId, dia, { gramos: 80 }).expect(201);
  await registrarComida(app, c.ase, b.planId, dia, { gramos: 80 }).expect(200);
  await registrarComida(app, c.ase, b.planId, dia, { gramos: 10 }).expect(409);
  await registrarComida(app, c.ase, ajeno, dia).expect(404);
  const invalida = await ase.post('/api/v1/me/nutrition/executions').send({
    activePlanId: b.planId,
    dayTypeId: dia.dayTypeId,
    occurredAt: new Date().toISOString(),
    recording: { origin: 'PRESCRIBED', mode: 'DISH_OPTIONS', mealId: dia.meals[0].mealId, optionId: randomUUID() },
  });
  expect(invalida.status).toBe(422);
  const libre = await registrarLibre(app, c.ase, b.planId, 'Texto libre para el contrato.').expect(201);
  await ase.get('/api/v1/me/nutrition/executions').expect(200);
  await ase.get('/api/v1/me/nutrition/executions?cursor=zz').expect(400);
  await ase.get(`/api/v1/nutrition/executions/${reg.body.data.executionId}`).expect(200);
  await ase.get(`/api/v1/nutrition/executions/${ajeno}`).expect(404);
  const estimacion = { reason: 'STRUCTURE_FREE_DESCRIPTION', structuredEstimate: { items: [{ catalogItemId: null, description: 'Texto', quantity: null }] }, estimationStatement: 'Estimación.' };
  await pro.post(`/api/v1/nutrition/executions/${libre.body.data.executionId}/corrections`).send(estimacion).expect(201);
  await pro.post(`/api/v1/nutrition/executions/${reg.body.data.executionId}/corrections`).send(estimacion).expect(422);
  await pro.post(`/api/v1/nutrition/executions/${libre.body.data.executionId}/corrections`).send({ ...estimacion, structuredEstimate: { items: [{ catalogItemId: ajeno, description: 'x', quantity: null }] } }).expect(422);
  await pro.post(`/api/v1/nutrition/executions/${ajeno}/corrections`).send(estimacion).expect(404);
  // NUT-17 a 20
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/review-context`).expect(200);
  await pro.get(`/api/v1/advisees/${c.ase.id}/nutrition/review-context?periodStart=mal`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/nutrition/review-context`).expect(404);
  const evidencia = [{ type: 'EXECUTION', id: reg.body.data.executionId as string }];
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'OTRO')).expect(422);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send({ ...cuerpoDeRevision(evidencia, 'MAINTAIN'), rationale: '' }).expect(422);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision([{ type: 'EXECUTION', id: ajeno }], 'MAINTAIN')).expect(422);
  await pro.post(`/api/v1/advisees/${ajeno}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN')).expect(404);
  const rev = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN', { nextReviewAt: '2030-01-01' })).expect(201);
  await pro.get(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}`).expect(200);
  await pro.get(`/api/v1/nutrition/reviews/${ajeno}`).expect(404);
  // NUT-19-EVIDENCIA (DL-154): la evidencia guardada, resuelta; la ajena o inexistente, el mismo 404; un parámetro de más, 400.
  await pro.get(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}/evidence`).expect(200);
  await pro.get(`/api/v1/nutrition/reviews/${ajeno}/evidence`).expect(404);
  await pro.get(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}/evidence?x=1`).expect(400);
  // NUT-19-LISTA y NUT-19-PROPIA (REV-A, DL-134): la persona lee sus revisiones; la ajena o inexistente, el mismo 404.
  await ase.get('/api/v1/me/nutrition/reviews?limit=5').expect(200);
  await ase.get('/api/v1/me/nutrition/reviews?x=1').expect(400); // INVALID_REQUEST
  await ase.get('/api/v1/me/nutrition/reviews?cursor=basura').expect(400); // INVALID_CURSOR
  await request(app.getHttpServer()).get('/api/v1/me/nutrition/reviews').expect(401);
  await ase.get(`/api/v1/me/nutrition/reviews/${rev.body.data.reviewId}`).expect(200);
  await ase.get(`/api/v1/me/nutrition/reviews/${rev.body.data.reviewId}?x=1`).expect(400);
  await pro.get(`/api/v1/me/nutrition/reviews/${rev.body.data.reviewId}`).expect(404);
  await pro.post(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}/apply`).send({ expectedVersion: 'v2' }).expect(409);
  await pro.post(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
  await pro.post(`/api/v1/nutrition/reviews/${rev.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(409);
  await pro.post(`/api/v1/nutrition/reviews/${ajeno}/apply`).send({ expectedVersion: 'v1' }).expect(404);
  // AJUSTAR con un borrador ya abierto: la continuidad no se puede aplicar (UC-I06 E02).
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: b.planId }).expect(201);
  const ajuste = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'ADJUST')).expect(201);
  await pro.post(`/api/v1/nutrition/reviews/${ajuste.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(422);
  // Revisar sin seguimiento abierto: REVIEW_NOT_ALLOWED.
  const cierre = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'FINALIZE')).expect(201);
  await pro.post(`/api/v1/nutrition/reviews/${cierre.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
  await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN')).expect(422);
  await registrarLibre(app, c.ase, b.planId, 'Después del cierre.').expect(422); // ACTIVE_PLAN_REQUIRED
});

it('TEST-CT (WP-05): se ejercitan éxitos y errores de las doce operaciones ANT', async () => {
  const c = await circuitoAntropometrico(app, prisma, 'contrato');
  const pro = conSesion(app, c.pro.token);
  const ase = conSesion(app, c.ase.token);
  const ajeno = randomUUID();
  const ayer = new Date(Date.now() - 86_400_000).toISOString();
  const medicion = (metricCode: string, value: number, unit: string) => ({ metricCode, value, unit });
  const toma = (mediciones: { metricCode: string; value: number; unit: string }[], cambios: Record<string, unknown> = {}) => ({
    occurredAt: ayer,
    specificationVersionId: c.protocoloVersionId,
    source: { type: 'DIRECT_CAPTURE' },
    directMeasurements: mediciones,
    ...cambios,
  });
  const evaluaciones = `/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`;
  const borradores = `/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`;

  // ANT-01: el catálogo es de la capacidad antropométrica; el asesorado no lo consulta.
  await pro.get('/api/v1/anthropometry/specifications?kind=PROTOCOL').expect(200);
  await pro.get('/api/v1/anthropometry/specifications?kind=OTRO').expect(400); // INVALID_REQUEST
  await pro.get('/api/v1/anthropometry/specifications?cursor=xx').expect(400); // INVALID_CURSOR
  await ase.get('/api/v1/anthropometry/specifications').expect(403); // ACTION_FORBIDDEN

  // ANT-02: la evaluación nace registrada, en un solo acto.
  const claveDirecta = claveDeIdempotencia();
  const directa = await pro.post(evaluaciones, claveDirecta).send(toma([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')])).expect(201);
  expect(directa.body.data.state).toBe('REGISTERED');
  await pro.post(evaluaciones, claveDirecta).send(toma([medicion('peso', 70, 'kg')])).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(evaluaciones).send(toma([medicion('peso', 72.5, 'kg')], { occurredAt: new Date(Date.now() + 86_400_000).toISOString() })).expect(422); // ANTHROPOMETRY_EVALUATION_INVALID
  await pro.post(evaluaciones).send(toma([medicion('peso', 72.5, 'kg')], { specificationVersionId: ajeno })).expect(422); // SPECIFICATION_REFERENCE_INVALID
  await pro.post(evaluaciones).send(toma([medicion('peso', 72.5, 'kg')], { extra: 1 })).expect(400); // UNKNOWN_FIELD
  await pro.post(`/api/v1/advisees/${ajeno}/anthropometry/evaluations`).send(toma([medicion('peso', 72.5, 'kg')])).expect(404);
  // Un método pedido que no existe, y uno que no se puede calcular con estas mediciones.
  await pro.post(evaluaciones).send(toma([medicion('peso', 72.5, 'kg')], { requestedDerivedMethods: [{ methodVersionId: ajeno }] })).expect(422); // METHOD_VERSION_NOT_SELECTABLE
  await pro
    .post(evaluaciones)
    .send(toma([medicion('peso', 72.5, 'kg')], { requestedDerivedMethods: [{ methodVersionId: CATALOGO_DEMO.metodo.v2 }] }))
    .expect(422); // CALCULATION_INPUTS_INSUFFICIENT

  // ANT-07: el borrador, en su propia colección.
  const claveDeCreacion = claveDeIdempotencia();
  const creado = await pro.post(borradores, claveDeCreacion).send(toma([medicion('peso', 72.5, 'kg')])).expect(201);
  const evaluationId = creado.body.data.evaluationId as string;
  await pro.post(borradores, claveDeCreacion).send(toma([])).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(borradores).send(toma([medicion('peso', 72.5, 'kg')], { occurredAt: new Date(Date.now() + 86_400_000).toISOString() })).expect(422);
  await pro.post(borradores).send(toma([medicion('peso', 70, 'kg')], { specificationVersionId: ajeno })).expect(422);
  await pro.post(borradores).send(toma([], { extra: 1 })).expect(400);
  await pro.post(`/api/v1/advisees/${ajeno}/anthropometry/evaluation-drafts`).send(toma([])).expect(404);

  // ANT-08, ANT-03, ANT-04 y ANT-09: cada colección lee lo suyo.
  await pro.get(borradores).expect(200);
  await pro.get(`${borradores}?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/anthropometry/evaluation-drafts`).expect(404);
  await pro.get(evaluaciones).expect(200);
  await pro.get(`${evaluaciones}?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/anthropometry/evaluations`).expect(404);
  await pro.get(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}`).expect(200);
  await pro.get(`/api/v1/anthropometry/evaluation-drafts/${ajeno}`).expect(404);
  await pro.get(`/api/v1/anthropometry/evaluations/${directa.body.data.evaluationId}`).expect(200);
  await pro.get(`/api/v1/anthropometry/evaluations/${ajeno}`).expect(404);
  // Cruzadas: un borrador por la ruta de las registradas no existe, y al revés tampoco (09v16:1718).
  await pro.get(`/api/v1/anthropometry/evaluations/${evaluationId}`).expect(404);
  await pro.get(`/api/v1/anthropometry/evaluation-drafts/${directa.body.data.evaluationId}`).expect(404);
  await pro.get(`/api/v1/anthropometry/evaluations/${directa.body.data.evaluationId}?x=1`).expect(400);

  // ANT-10: guardar reemplaza la versión de trabajo y avanza el token.
  const guardar = (cuerpo: object, id = evaluationId) => conSesion(app, c.pro.token).put(`/api/v1/anthropometry/evaluation-drafts/${id}`).send(cuerpo);
  const guardado = await guardar({ expectedVersion: creado.body.data.version, ...toma([medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]) }).expect(200);
  await guardar({ expectedVersion: 'v9', ...toma([]) }).expect(409); // VERSION_CONFLICT
  await guardar({ expectedVersion: guardado.body.data.version, ...toma([medicion('peso', 70, 'kg')], { specificationVersionId: ajeno }) }).expect(422);
  await guardar({ expectedVersion: guardado.body.data.version, ...toma([]), extra: 1 }).expect(400);
  await guardar({ expectedVersion: 'v1', ...toma([]) }, ajeno).expect(404);

  // ANT-11: el acto explícito de registro. Sin contenido registrable no procede, y REGISTRADA es terminal.
  const vacio = await pro.post(borradores).send(toma([])).expect(201);
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${vacio.body.data.evaluationId}/register`).send({ expectedVersion: vacio.body.data.version }).expect(422); // ANTHROPOMETRY_EVALUATION_INVALID
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`).send({ expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  const claveDeRegistro = claveDeIdempotencia();
  const registrada = await pro
    .post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`, claveDeRegistro)
    .send({ expectedVersion: guardado.body.data.version })
    .expect(200);
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`, claveDeRegistro).send({ expectedVersion: 'v9' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  // Ya registrada: REGISTRADA es terminal y el dueño recibe el motivo, no un 404. Esconderla no le agrega nada,
  // porque sabe que existe: la fusiona la lectura (ANT-04/ANT-09), que sí es donde el 09 exige la separación.
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`).send({ expectedVersion: registrada.body.data.version }).expect(422); // ANTHROPOMETRY_EVALUATION_NOT_EDITABLE
  await guardar({ expectedVersion: registrada.body.data.version, ...toma([]) }).expect(422);
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${ajeno}/register`).send({ expectedVersion: 'v1' }).expect(404);
  await pro.post(`/api/v1/anthropometry/evaluation-drafts/${evaluationId}/register`).send({ expectedVersion: 'v1', extra: 1 }).expect(400);

  // ANT-05: corregir va sobre la evaluación, con el objetivo declarado en el cuerpo.
  const [peso, talla] = registrada.body.data.measurements as { measurementId: string }[];
  const correcciones = `/api/v1/anthropometry/evaluations/${evaluationId}/corrections`;
  const claveDeCorreccion = claveDeIdempotencia();
  await pro.post(correcciones, claveDeCorreccion).send({ targetId: peso!.measurementId, reason: 'Se leyó mal la balanza.', magnitude: { value: 73.1, unit: 'kg' } }).expect(201);
  await pro.post(correcciones, claveDeCorreccion).send({ targetId: peso!.measurementId, reason: 'Otro motivo.', magnitude: { value: 73.2, unit: 'kg' } }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(correcciones).send({ targetId: peso!.measurementId, reason: 'Otra unidad.', magnitude: { value: 73100, unit: 'g' } }).expect(422); // UNIT_NOT_COMPATIBLE
  await pro.post(correcciones).send({ targetId: ajeno, reason: 'x', magnitude: { value: 1, unit: 'kg' } }).expect(404);
  await pro.post(`/api/v1/anthropometry/evaluations/${ajeno}/corrections`).send({ targetId: peso!.measurementId, reason: 'x', magnitude: { value: 1, unit: 'kg' } }).expect(404);
  await pro.post(correcciones).send({ targetId: peso!.measurementId, reason: 'x', magnitude: { value: 1, unit: 'kg' }, extra: 1 }).expect(400);

  // ANT-12: anular es aditivo, terminal y sin segundo efecto.
  const anulacion = (id: string) => `/api/v1/anthropometry/measurements/${id}/annulments`;
  const claveDeAnulacion = claveDeIdempotencia();
  await pro.post(anulacion(talla!.measurementId), claveDeAnulacion).send({ reason: 'Se midió con el calzado puesto.' }).expect(201);
  await pro.post(anulacion(talla!.measurementId), claveDeAnulacion).send({ reason: 'Otro motivo.' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  // Clave nueva sobre una medición ya anulada: 200 con la anulación que ya existe (WP-05 §0, opción A; DL-059).
  await pro.post(anulacion(talla!.measurementId), claveDeIdempotencia()).send({ reason: 'Otra vez.' }).expect(200);
  // Con un token viejo de la evaluación, 409: nadie anula sobre una foto que ya cambió (09v16 §24.1).
  await pro.post(anulacion(peso!.measurementId)).send({ expectedVersion: 'v9', reason: 'x' }).expect(409); // VERSION_CONFLICT
  // Corregir lo anulado no procede: la corrección cambia la vista del valor, no resucita la medición (REG-06-219).
  await pro.post(correcciones).send({ targetId: talla!.measurementId, reason: 'x', magnitude: { value: 1.8, unit: 'm' } }).expect(422); // CORRECTION_NOT_ALLOWED
  await pro.post(anulacion(ajeno)).send({ reason: 'x' }).expect(404);
  await pro.post(anulacion(peso!.measurementId)).send({ reason: 'x', extra: 1 }).expect(400);

  // ANT-06 y su variante propia: la evolución, del lado del profesional y del lado del asesorado.
  const progreso = `/api/v1/advisees/${c.ase.id}/anthropometry/progress`;
  await pro.get(progreso).expect(200);
  await pro.get(`${progreso}?periodStart=ayer`).expect(400); // INVALID_REQUEST
  await pro.get(`/api/v1/advisees/${ajeno}/anthropometry/progress`).expect(404);
  await ase.get('/api/v1/me/anthropometry/progress').expect(200);
  await ase.get('/api/v1/me/anthropometry/progress?periodEnd=nunca').expect(400);
});

it('TEST-CT (WP-05): se ejercitan éxitos y errores de MTH y CAL', async () => {
  const c = await circuitoAntropometrico(app, prisma, 'contrato-cal');
  const pro = conSesion(app, c.pro.token);
  const ase = conSesion(app, c.ase.token);
  const ajeno = randomUUID();
  const ayer = new Date(Date.now() - 86_400_000).toISOString();

  // MTH-01 y MTH-02: metadatos de la capacidad; el asesorado no los consulta.
  await pro.get('/api/v1/professional-methods').expect(200);
  await pro.get('/api/v1/professional-methods?purpose=OTRA').expect(400); // INVALID_REQUEST
  await pro.get('/api/v1/professional-methods?cursor=xx').expect(400); // INVALID_CURSOR
  await ase.get('/api/v1/professional-methods').expect(403); // ACTION_FORBIDDEN
  await pro.get(`/api/v1/professional-methods/${CATALOGO_DEMO.metodo.especificacionId}/versions/${CATALOGO_DEMO.metodo.v1}`).expect(200);
  await pro.get(`/api/v1/professional-methods/${CATALOGO_DEMO.metodo.especificacionId}/versions/${CATALOGO_DEMO.metodo.v1}?x=1`).expect(400);
  await pro.get(`/api/v1/professional-methods/${ajeno}/versions/${ajeno}`).expect(404);
  await ase.get(`/api/v1/professional-methods/${CATALOGO_DEMO.metodo.especificacionId}/versions/${CATALOGO_DEMO.metodo.v2}`).expect(403);

  // Una evaluación registrada con peso y talla, que es lo que un cálculo necesita.
  const medicion = (metricCode: string, value: number, unit: string) => ({ metricCode, value, unit });
  const creada = await pro
    .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`)
    .send({ occurredAt: ayer, specificationVersionId: c.protocoloVersionId, source: { type: 'DIRECT_CAPTURE' }, directMeasurements: [medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')] })
    .expect(201);
  const registrada = await pro
    .post(`/api/v1/anthropometry/evaluation-drafts/${creada.body.data.evaluationId}/register`)
    .send({ expectedVersion: creada.body.data.version })
    .expect(200);
  const porMetrica: Record<string, string> = {};
  for (const m of registrada.body.data.measurements as { metric: string; measurementId: string }[]) porMetrica[m.metric] = m.measurementId;
  const entradas = [
    { inputCode: 'PESO', sourceRef: porMetrica.peso as string },
    { inputCode: 'TALLA', sourceRef: porMetrica.talla as string },
  ];
  const calculos = `/api/v1/advisees/${c.ase.id}/calculations`;
  const ejecucion = (cambios: Record<string, unknown> = {}) => ({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: entradas, ...cambios });

  // CAL-01
  const claveDeCalculo = claveDeIdempotencia();
  const corrida = await pro.post(calculos, claveDeCalculo).send(ejecucion()).expect(201);
  await pro.post(calculos, claveDeCalculo).send(ejecucion({ purpose: 'NUTRITION_OBJECTIVE_SUPPORT' })).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(calculos).send(ejecucion({ methodVersionId: CATALOGO_DEMO.metodo.v1 })).expect(422); // METHOD_VERSION_NOT_SELECTABLE
  await pro.post(calculos).send(ejecucion({ inputBindings: [entradas[0]] })).expect(422); // CALCULATION_INPUTS_INSUFFICIENT
  await pro.post(calculos).send(ejecucion({ inputBindings: [{ inputCode: 'PESO', sourceRef: porMetrica.peso as string }, { inputCode: 'TALLA', sourceRef: porMetrica.peso as string }] })).expect(422);
  await pro.post(calculos).send(ejecucion({ extra: 1 })).expect(400); // UNKNOWN_FIELD
  await pro.post(calculos).send({ purpose: 'OTRA', methodVersionId: CATALOGO_DEMO.metodo.v2, inputBindings: entradas }).expect(400); // INVALID_REQUEST
  await pro.post(`/api/v1/advisees/${ajeno}/calculations`).send(ejecucion()).expect(404);

  // El asesorado no es profesional de este vínculo: el PDP decide primero y responde el 404 no revelador, no un 403.
  await ase.post(calculos).send(ejecucion()).expect(404);
  await ase.get(calculos).expect(404);

  // CAL-02 y CAL-03
  await pro.get(calculos).expect(200);
  await pro.get(`${calculos}?purpose=OTRA`).expect(400);
  await pro.get(`${calculos}?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/calculations`).expect(404);
  await pro.get(`/api/v1/calculations/${corrida.body.data.calculationRunId}`).expect(200);
  await pro.get(`/api/v1/calculations/${corrida.body.data.calculationRunId}?x=1`).expect(400);
  await ase.get(`/api/v1/calculations/${corrida.body.data.calculationRunId}`).expect(404);
  await pro.get(`/api/v1/calculations/${ajeno}`).expect(404);

  // CAL-04: adoptar es una relación con historia.
  const referencia = `/api/v1/advisees/${c.ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`;
  const claveDeAdopcion = claveDeIdempotencia();
  await pro.put(referencia, claveDeAdopcion).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null }).expect(201);
  await pro.put(referencia, claveDeAdopcion).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: 'v9' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.put(referencia).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: 'v1' }).expect(200); // ya es la referencia
  await pro.put(referencia).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null }).expect(409); // VERSION_CONFLICT
  await pro
    .put(`/api/v1/advisees/${c.ase.id}/calculation-references/NUTRITION_OBJECTIVE_SUPPORT`)
    .send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null })
    .expect(422); // CALCULATION_REFERENCE_NOT_COMPATIBLE
  await pro.put(referencia).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: 'v1', extra: 1 }).expect(400);
  await ase.put(referencia).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null }).expect(404);
  await pro.put(`/api/v1/advisees/${ajeno}/calculation-references/ANTHROPOMETRIC_SUPPORT`).send({ calculationRunId: corrida.body.data.calculationRunId, expectedVersion: null }).expect(404);
});

it('TEST-CT (WP-08): INT-NUT-02/03 e INT-TRN-02/03 — candidato, resolución, fallas del proveedor', async () => {
  const pn = await prepararProfesional(app, 'contrato-imp-nut', ['NUTRICION']);
  const pt = await prepararProfesional(app, 'contrato-imp-trn', ['ENTRENAMIENTO']);
  const ase = await prepararAsesorado(app, 'contrato-imp-ase', { a3: true });
  const nut = conSesion(app, pn.token);
  const trn = conSesion(app, pt.token);
  const NUT = '/api/v1/nutrition/catalog-import-candidates';
  const TRN = '/api/v1/training/catalog-import-candidates';
  const alimento = (codigo: string) => ({ provider: 'OPEN_FOOD_FACTS', lookup: { externalId: codigo } });
  const ejercicio = (numero: string) => ({ provider: 'WGER', lookup: { externalId: numero } });
  // INT-NUT-02
  const clave = claveDeIdempotencia();
  const creado = (await nut.post(NUT, clave).send(alimento(OFF.completo)).expect(201)).body.data;
  await nut.post(NUT, clave).send(alimento(OFF.liquido)).expect(409); // IDEMPOTENCY_KEY_REUSED
  await nut.post(NUT).send({ provider: 'OPEN_FOOD_FACTS', lookup: { externalId: 'abc' } }).expect(400);
  await nut.post(NUT).send({ ...alimento(OFF.completo), extra: 1 }).expect(400);
  await conSesion(app, ase.token).post(NUT).send(alimento(OFF.completo)).expect(403);
  await nut.post(NUT).send(alimento(OFF.inexistente)).expect(422);
  await nut.post(NUT).send(alimento(OFF.caido)).expect(503);
  // INT-NUT-03
  const incompleto = (await nut.post(NUT).send(alimento(OFF.sinComposicion)).expect(201)).body.data;
  await nut.post(`${NUT}/${incompleto.candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent: incompleto.candidate }).expect(422); // REVIEWED_CONTENT_INVALID
  const claveR = claveDeIdempotencia();
  await nut.post(`${NUT}/${creado.candidateId}/resolve`, claveR).send({ decision: 'IMPORT', reviewedContent: creado.candidate }).expect(200);
  await nut.post(`${NUT}/${creado.candidateId}/resolve`, claveR).send({ decision: 'REJECT' }).expect(409);
  await nut.post(`${NUT}/${creado.candidateId}/resolve`).send({ decision: 'REJECT' }).expect(422); // IMPORT_CANDIDATE_NOT_RESOLVABLE
  await nut.post(`${NUT}/${randomUUID()}/resolve`).send({ decision: 'REJECT' }).expect(404);
  await nut.post(`${NUT}/${creado.candidateId}/resolve`).send({ decision: 'ACCEPT' }).expect(400);
  await conSesion(app, ase.token).post(`${NUT}/${creado.candidateId}/resolve`).send({ decision: 'REJECT' }).expect(403);
  // INT-TRN-02
  const claveT = claveDeIdempotencia();
  const ej = (await trn.post(TRN, claveT).send(ejercicio(WGER.enEspanol)).expect(201)).body.data;
  await trn.post(TRN, claveT).send(ejercicio(WGER.soloEnIngles)).expect(409);
  await trn.post(TRN).send({ provider: 'WGER', lookup: { externalId: '0' } }).expect(400);
  await trn.post(TRN).send({ ...ejercicio(WGER.enEspanol), extra: 1 }).expect(400);
  await conSesion(app, ase.token).post(TRN).send(ejercicio(WGER.enEspanol)).expect(403);
  await trn.post(TRN).send(ejercicio(WGER.inexistente)).expect(422);
  await trn.post(TRN).send(ejercicio(WGER.caido)).expect(503);
  // INT-TRN-03
  await trn.post(`${TRN}/${ej.candidateId}/resolve`).send({ decision: 'IMPORT', reviewedContent: { name: null } }).expect(422);
  const claveTR = claveDeIdempotencia();
  await trn.post(`${TRN}/${ej.candidateId}/resolve`, claveTR).send({ decision: 'IMPORT', reviewedContent: { name: ej.candidate.name } }).expect(200);
  await trn.post(`${TRN}/${ej.candidateId}/resolve`, claveTR).send({ decision: 'REJECT' }).expect(409);
  await trn.post(`${TRN}/${ej.candidateId}/resolve`).send({ decision: 'REJECT' }).expect(422);
  await trn.post(`${TRN}/${randomUUID()}/resolve`).send({ decision: 'REJECT' }).expect(404);
  await trn.post(`${TRN}/${ej.candidateId}/resolve`).send({ decision: 'REJECT', reviewedContent: { name: 'x' } }).expect(400);
  await conSesion(app, ase.token).post(`${TRN}/${ej.candidateId}/resolve`).send({ decision: 'REJECT' }).expect(403);
});

/**
 * WP-06 y WP-07 se implementan por tramos, con el contrato entero publicado primero (docs/paquetes/WP-06.md §9.6;
 * docs/paquetes/WP-07.md). Las operaciones declaradas que todavía no tienen servicio figuran acá, **a la vista**, en
 * vez de relajar la exigencia de cobertura. La lista solo puede achicarse: si una operación de acá ya se ejercita, la
 * prueba falla hasta que se la saque. **Para cerrar cada paquete tiene que quedar sin sus operaciones.**
 */
const EN_CONSTRUCCION: ReadonlySet<string> = new Set<string>([]);

it('TEST-CT (WP-06, tramos 3 y 4): se ejercitan éxitos y errores de la ejecución, la corrección y la revisión', async () => {
  const c = await circuitoConPlanDeEntrenamientoActivo(app, 'contrato-ejecucion');
  const ase = conSesion(app, c.ase.token);
  const pro = conSesion(app, c.pro.token);
  const ajeno = randomUUID();
  // TRN-14 y el período
  const hoy = (await ase.get('/api/v1/me/training/today').expect(200)).body.data;
  await ase.get('/api/v1/me/training/today?dia=1').expect(400);
  // API-AGE-01 (DL-137): la agenda del día; un plan sin agenda responde con las listas vacías.
  expect((await ase.get('/api/v1/me/training/agenda').expect(200)).body.data).toMatchObject({ planState: 'AVAILABLE', startDate: null, today: [], pending: [] });
  await ase.get('/api/v1/me/training/agenda?dia=1').expect(400);
  await ase.get(`/api/v1/me/training/occurrences?periodStart=${hoy.date}&periodEnd=${hoy.date}`).expect(200);
  await ase.get('/api/v1/me/training/occurrences').expect(400);
  // API-TRN-19-LISTA (DL-096): «Tu historial» — sesiones registradas propias por período, solo con A3.
  await ase.get(`/api/v1/me/training/executions?periodStart=${hoy.date}&periodEnd=${hoy.date}`).expect(200);
  await ase.get('/api/v1/me/training/executions').expect(400);
  // TRN-15 y 16
  const [a, b] = hoy.occurrences;
  const manana = new Date(new Date(`${hoy.date}T00:00:00.000Z`).getTime() + 86_400_000).toISOString().slice(0, 10);
  const futura = codificarOcurrencia({ versionDePlanId: c.planId, sesionPlanificadaId: 'ses-a', fechaLocal: manana });
  const borrador = (await ase.put(`/api/v1/training/occurrences/${a.occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
  await ase.put(`/api/v1/training/occurrences/${a.occurrenceId}/execution-draft`).send({}).expect(200);
  await ase.put(`/api/v1/training/occurrences/${futura}/execution-draft`).send({}).expect(422); // OCCURRENCE_NOT_EXECUTABLE
  await ase.put('/api/v1/training/occurrences/occ_otra/execution-draft').send({}).expect(404);
  await ase.put(`/api/v1/training/occurrences/${a.occurrenceId}/execution-draft`).send({ extra: 1 }).expect(400);
  await ase.get(`/api/v1/training/execution-drafts/${borrador.draftId}`).expect(200);
  await pro.get(`/api/v1/training/execution-drafts/${borrador.draftId}`).expect(404);
  // TRN-17
  const ruta = `/api/v1/training/execution-drafts/${borrador.draftId}`;
  const banca = (performedExerciseVersionId: string, extra: Record<string, unknown> = {}) => ({ prescriptionId: 'rx-banca', performedExerciseVersionId, ...extra });
  const serie = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 2, perceivedExertion: null };
  await ase.patch(ruta).send({ expectedVersion: 'v9', changes: {} }).expect(409);
  await ase.patch(ruta).send({ expectedVersion: borrador.version, changes: { sessionCondition: 'SKIPPED' } }).expect(422);
  await ase.patch(ruta).send({ expectedVersion: borrador.version, changes: { granularity: 'BY_WEEK' } }).expect(422);
  await ase.patch(ruta).send({ expectedVersion: borrador.version, changes: { granularity: 'EXERCISE_OR_SESSION', exercises: [banca(CATALOGO_DE_EJERCICIOS.pressDeBanca, { sets: [serie] })] } }).expect(422);
  await ase.patch(ruta).send({ expectedVersion: borrador.version, changes: { granularity: 'SET', exercises: [{ ...banca(CATALOGO_DE_EJERCICIOS.pressDeBanca, { sets: [serie] }), prescriptionId: 'rx-otra' }] } }).expect(422);
  await ase.patch(ruta).send({ expectedVersion: borrador.version, changes: { granularity: 'SET', exercises: [banca(ajeno, { sets: [serie] })] } }).expect(422);
  await ase.patch(`/api/v1/training/execution-drafts/${ajeno}`).send({ expectedVersion: 'v1', changes: {} }).expect(404);
  // TRN-18
  await ase.post(`${ruta}/confirm`).send({ expectedVersion: borrador.version }).expect(422); // EXECUTION_DRAFT_NOT_READY
  const guardado = (await ase.patch(ruta).send({ expectedVersion: borrador.version, changes: { granularity: 'SET', sessionCondition: 'COMPLETED', exercises: [banca(CATALOGO_DE_EJERCICIOS.pressDeBanca, { sets: [serie] })] } }).expect(200)).body.data;
  await ase.post(`${ruta}/confirm`).send({ expectedVersion: 'v1' }).expect(409);
  await ase.post(`/api/v1/training/execution-drafts/${ajeno}/confirm`).send({ expectedVersion: 'v1' }).expect(404);
  const ejecucion = (await ase.post(`${ruta}/confirm`).send({ expectedVersion: guardado.version }).expect(201)).body.data;
  await ase.post(`${ruta}/confirm`).send({ expectedVersion: guardado.version }).expect(409); // EXECUTION_ALREADY_REGISTERED
  await ase.patch(ruta).send({ expectedVersion: guardado.version, changes: {} }).expect(422); // INVALID_STATE_TRANSITION
  // TRN-19 y 20
  const x = `/api/v1/training/executions/${ejecucion.executionId}`;
  await ase.get(x).expect(200);
  await pro.get(x).expect(200);
  await pro.get(`/api/v1/training/executions/${ajeno}`).expect(404);
  const registro = { granularity: 'SET', sessionCondition: 'COMPLETED', reason: null, exercises: [banca(CATALOGO_DE_EJERCICIOS.pressDeBanca, { sets: [{ ...serie, load: { value: 55, unit: 'kg' } }] })], sessionSummary: null };
  await ase.post(`${x}/corrections`).send({ reason: 'Cargué mal la carga.', correction: registro }).expect(201);
  await ase.post(`${x}/corrections`).send({ reason: 'x', correction: { ...registro, sessionCondition: 'SKIPPED' } }).expect(422);
  await ase.post(`${x}/corrections`).send({ reason: 'x', correction: { ...registro, granularity: 'BY_WEEK' } }).expect(422);
  await ase.post(`${x}/corrections`).send({ reason: 'x', correction: { ...registro, granularity: 'EXERCISE_OR_SESSION' } }).expect(422);
  await ase.post(`${x}/corrections`).send({ reason: 'x', correction: { ...registro, exercises: [] } }).expect(422);
  await ase.post(`${x}/corrections`).send({ reason: 'x', correction: { ...registro, exercises: [banca(ajeno, { sets: [serie] })] } }).expect(422);
  await ase.post(`/api/v1/training/executions/${ajeno}/corrections`).send({ reason: 'x', correction: registro }).expect(404);
  // TRN-21 a 24
  const ctx = `/api/v1/advisees/${c.ase.id}/training/review-context`;
  await pro.get(ctx).expect(200);
  await pro.get(`${ctx}?periodStart=mal`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/training/review-context`).expect(404);
  const revisiones = `/api/v1/advisees/${c.ase.id}/training/reviews`;
  const revision = (result: string, evidencia = [{ type: 'EXECUTION', id: ejecucion.executionId as string }], nextAction: Record<string, unknown> = {}) => ({
    period: { start: hoy.date, end: hoy.date, timeZone: 'America/Argentina/Buenos_Aires' },
    evidenceReferences: evidencia,
    interpretation: 'Interpretación sintética.',
    result,
    rationale: 'Fundamento sintético.',
    nextAction: { description: 'Próxima acción.', ...nextAction },
  });
  await pro.post(revisiones).send(revision('PROGRESS')).expect(422); // REVIEW_RESULT_INVALID
  await pro.post(revisiones).send({ ...revision('MAINTAIN'), rationale: '' }).expect(422); // REVIEW_COMPONENT_REQUIRED
  await pro.post(revisiones).send(revision('MAINTAIN', [{ type: 'EXECUTION', id: ajeno }])).expect(422); // REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE
  await pro.post(`/api/v1/advisees/${ajeno}/training/reviews`).send(revision('MAINTAIN')).expect(404);
  const mantener = (await pro.post(revisiones).send(revision('MAINTAIN', undefined, { nextReviewAt: '2030-01-01' })).expect(201)).body.data;
  await pro.get(`/api/v1/training/reviews/${mantener.reviewId}`).expect(200);
  await pro.get(`/api/v1/training/reviews/${ajeno}`).expect(404);
  // TRN-23-EVIDENCIA (DL-154): la evidencia guardada, resuelta; la ajena o inexistente, el mismo 404; un parámetro de más, 400.
  await pro.get(`/api/v1/training/reviews/${mantener.reviewId}/evidence`).expect(200);
  await pro.get(`/api/v1/training/reviews/${ajeno}/evidence`).expect(404);
  await pro.get(`/api/v1/training/reviews/${mantener.reviewId}/evidence?x=1`).expect(400);
  // TRN-23-LISTA y TRN-23-PROPIA (REV-A, DL-134).
  await ase.get('/api/v1/me/training/reviews?limit=5').expect(200);
  await ase.get('/api/v1/me/training/reviews?x=1').expect(400); // INVALID_REQUEST
  await ase.get('/api/v1/me/training/reviews?cursor=basura').expect(400); // INVALID_CURSOR
  await request(app.getHttpServer()).get('/api/v1/me/training/reviews').expect(401);
  await ase.get(`/api/v1/me/training/reviews/${mantener.reviewId}`).expect(200);
  await ase.get(`/api/v1/me/training/reviews/${mantener.reviewId}?x=1`).expect(400);
  await pro.get(`/api/v1/me/training/reviews/${mantener.reviewId}`).expect(404);
  const aplicar = (id: string, expectedVersion = 'v1') => pro.post(`/api/v1/training/reviews/${id}/apply`).send({ expectedVersion });
  await aplicar(mantener.reviewId, 'v2').expect(409); // VERSION_CONFLICT
  await aplicar(mantener.reviewId).expect(200);
  await aplicar(mantener.reviewId).expect(409); // REVIEW_ALREADY_APPLIED
  await aplicar(ajeno).expect(404);
  // AJUSTAR con un borrador ya abierto: la continuidad no se aplica (UC-I06 E02).
  await pro.post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(201);
  const ajuste = (await pro.post(revisiones).send(revision('ADJUST')).expect(201)).body.data;
  await aplicar(ajuste.reviewId).expect(422); // CONTINUITY_ACTION_NOT_APPLICABLE
  // Cerrar el seguimiento: ya no hay qué revisar ni dónde registrar.
  const cierre = (await pro.post(revisiones).send(revision('FINALIZE')).expect(201)).body.data;
  await aplicar(cierre.reviewId).expect(200);
  await pro.post(revisiones).send(revision('MAINTAIN')).expect(422); // REVIEW_NOT_ALLOWED
  await ase.put(`/api/v1/training/occurrences/${b.occurrenceId}/execution-draft`).send({}).expect(422); // ACTIVE_PLAN_REQUIRED
});

it('TEST-CT (WP-06, tramo 2): se ejercitan éxitos y errores del plan de entrenamiento', async () => {
  const c = await circuitoListoParaPlanificarEntrenamiento(app, 'contrato-plan');
  const pro = conSesion(app, c.pro.token);
  const ajeno = randomUUID();
  const planes = `/api/v1/advisees/${c.ase.id}/training/plans`;
  // TRN-07
  await pro.post(planes).send({ objectiveVersionId: ajeno }).expect(422); // OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE
  await pro.post(`/api/v1/advisees/${ajeno}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId }).expect(404);
  await pro.post(planes).send({ objectiveVersionId: c.objectiveVersionId, extra: 1 }).expect(400);
  const b = await crearBorradorDeEntrenamiento(app, c);
  await pro.post(planes).send({ objectiveVersionId: c.objectiveVersionId }).expect(409); // RESOURCE_CONFLICT
  // TRN-08 y 09
  await pro.get(`${planes}?state=DRAFT`).expect(200);
  await pro.get(`${planes}?state=VALIDATED`).expect(400); // no existe VALIDADO
  await pro.get(`/api/v1/advisees/${ajeno}/training/plans`).expect(404);
  await pro.get(`/api/v1/training/plans/${b.planId}`).expect(200);
  await pro.get(`/api/v1/training/plans/${ajeno}`).expect(404);
  // TRN-10
  const ruta = `/api/v1/training/plans/${b.planId}`;
  const sesion = (intensity: unknown) => ({ blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [], intensity }] }] }] });
  await pro.patch(ruta).send({ expectedVersion: 'v9', changes: { blocks: [] } }).expect(409);
  await pro.patch(ruta).send({ expectedVersion: b.version, changes: { blocks: [{ label: 'B', microcycles: [{ label: 'S', sessions: [] }], sessions: [{ label: 'A', prescriptions: [] }] }] } }).expect(422);
  await pro.patch(ruta).send({ expectedVersion: b.version, changes: sesion({ criterion: 'RPE', target: { value: 8 } }) }).expect(422);
  await pro.patch(ruta).send({ expectedVersion: b.version, changes: { blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId: ajeno, sets: [], intensity: null }] }] }] } }).expect(422);
  await pro.patch(ruta).send({ expectedVersion: b.version, objectiveVersionId: ajeno, changes: { blocks: [] } }).expect(422);
  await pro.patch(`/api/v1/training/plans/${ajeno}`).send({ expectedVersion: 'v1', changes: { blocks: [] } }).expect(404);
  const guardado = await pro.patch(ruta).send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento() }).expect(200);
  // TRN-11 y 12
  await pro.post(`${ruta}/validate`).send({ expectedVersion: 'v1' }).expect(409);
  await pro.post(`/api/v1/training/plans/${ajeno}/validate`).send({ expectedVersion: 'v1' }).expect(404);
  await pro.post(`${ruta}/validate`).send({ expectedVersion: guardado.body.data.version }).expect(200);
  await activarPlanDeEntrenamiento(app, c.pro, b.planId, 'v1').expect(409);
  await activarPlanDeEntrenamiento(app, c.pro, ajeno, 'v1').expect(404);
  const act = await activarPlanDeEntrenamiento(app, c.pro, b.planId, guardado.body.data.version).expect(200);
  await pro.patch(ruta).send({ expectedVersion: act.body.data.version, changes: { blocks: [] } }).expect(422); // PLAN_NOT_EDITABLE
  await pro.post(`${ruta}/validate`).send({ expectedVersion: act.body.data.version }).expect(422); // PLAN_NOT_EDITABLE
  await activarPlanDeEntrenamiento(app, c.pro, b.planId, act.body.data.version).expect(422); // OPERATION_NOT_READY
  // Una sucesora vacía no se activa: OPERATION_NOT_READY con sus problemas.
  const vacia = await pro.post(planes).send({ objectiveVersionId: c.objectiveVersionId }).expect(201);
  await activarPlanDeEntrenamiento(app, c.pro, vacia.body.data.planId, vacia.body.data.version).expect(422);
  // Capacidad y conflicto de vigencia.
  const conCapacidad = await prepararProfesional(app, 'contrato-cap', ['ENTRENAMIENTO']);
  await prisma.$transaction((tx) =>
    app.get(ProcesoService).configurarCapacidad(tx, {
      profesionalId: conCapacidad.id,
      capacidad: { modo: 'LIMITADA', limite: 1 },
      actorServicio: 'PRUEBA',
      procedencia: { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'CAPACIDAD', superficie: null, requestId: null },
    }),
  );
  const uno = await circuitoListoParaPlanificarEntrenamiento(app, 'contrato-cap-1', conCapacidad);
  const bu = await crearBorradorDeEntrenamiento(app, uno);
  await activarPlanDeEntrenamiento(app, conCapacidad, bu.planId, bu.version).expect(200);
  const dos = await circuitoListoParaPlanificarEntrenamiento(app, 'contrato-cap-2', conCapacidad);
  const bd = await crearBorradorDeEntrenamiento(app, dos);
  await activarPlanDeEntrenamiento(app, conCapacidad, bd.planId, bd.version).expect(422); // CAPACITY_NOT_AVAILABLE
  const rival = await circuitoListoParaPlanificarEntrenamiento(app, 'contrato-rival', undefined);
  await vinculoCompleto(app, rival.pro, uno.ase, 'ENTRENAMIENTO');
  const ev = await conSesion(app, rival.pro.token).post(`/api/v1/advisees/${uno.ase.id}/training/evaluations`).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
  const ob = await conSesion(app, rival.pro.token).post(`/api/v1/advisees/${uno.ase.id}/training/objectives`).send(cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId)).expect(201);
  const br = await conSesion(app, rival.pro.token).post(`/api/v1/advisees/${uno.ase.id}/training/plans`).send({ objectiveVersionId: ob.body.data.versionId, initialStructure: estructuraDeEntrenamiento() }).expect(201);
  await activarPlanDeEntrenamiento(app, rival.pro, br.body.data.planId, br.body.data.version).expect(409); // ACTIVE_PLAN_CONFLICT
});

it('TEST-CT (WP-06, tramo 1): se ejercitan éxitos y errores de la evaluación, el objetivo y el catálogo de entrenamiento', async () => {
  const c = await circuitoDeEntrenamiento(app, 'contrato');
  const pro = conSesion(app, c.pro.token);
  const ase = conSesion(app, c.ase.token);
  const ajeno = randomUUID();
  const ev = `/api/v1/advisees/${c.ase.id}/training/evaluations`;
  // TRN-01 a 03
  const clave = claveDeIdempotencia();
  const creada = await pro.post(ev, clave).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
  await pro.post(ev, clave).send({ ...cuerpoDeEvaluacionDeEntrenamiento(), professionalNotes: 'otra' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(ev).send({ ...cuerpoDeEvaluacionDeEntrenamiento(), occurredAt: new Date(Date.now() + 86_400_000).toISOString() }).expect(422);
  await pro.post(`/api/v1/advisees/${ajeno}/training/evaluations`).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(404);
  await pro.post(ev).send({ ...cuerpoDeEvaluacionDeEntrenamiento(), extra: 1 }).expect(400);
  await pro.get(ev).expect(200);
  await pro.get(`${ev}?cursor=xx`).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/training/evaluations`).expect(404);
  await pro.get(`/api/v1/training/evaluations/${creada.body.data.evaluationId}`).expect(200);
  await pro.get(`/api/v1/training/evaluations/${ajeno}`).expect(404);
  // TRN-04 a 06
  const ob = `/api/v1/advisees/${c.ase.id}/training/objectives`;
  await pro.post(ob).send(cuerpoDeObjetivoDeEntrenamiento(ajeno)).expect(422); // EVALUATION_NOT_COMPATIBLE
  await pro.post(`/api/v1/advisees/${ajeno}/training/objectives`).send(cuerpoDeObjetivoDeEntrenamiento(creada.body.data.evaluationId)).expect(404);
  await pro.post(ob).send(cuerpoDeObjetivoDeEntrenamiento(creada.body.data.evaluationId)).expect(201);
  await pro.get(ob).expect(200);
  await pro.get(`/api/v1/advisees/${ajeno}/training/objectives`).expect(404);
  await pro.get(`${ob}/effective`).expect(200);
  await pro.get(`/api/v1/advisees/${ajeno}/training/objectives/effective`).expect(404);
  // TRN-13 e INT-TRN-01
  await pro.get('/api/v1/training/exercises?q=press').expect(200);
  await pro.get('/api/v1/training/exercises?zona=pecho').expect(400);
  await ase.get('/api/v1/training/exercises').expect(403);
  // TRN-13-BUSQUEDA (DL-130): la misma lectura con el texto en el cuerpo.
  await pro.post('/api/v1/training/exercises/search').send({ q: 'press', limit: 5 }).expect(200);
  await pro.post('/api/v1/training/exercises/search').send({ q: 'press', zona: 'pecho' }).expect(400); // UNKNOWN_FIELD
  await pro.post('/api/v1/training/exercises/search').send({ q: 'press', cursor: 'basura' }).expect(400); // INVALID_CURSOR
  await ase.post('/api/v1/training/exercises/search').send({ q: 'press' }).expect(403);
  const ejercicio = { name: 'Ejercicio sintético del contrato', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } };
  await pro.post('/api/v1/training/exercises').send(ejercicio).expect(201);

  // TPL-01..05 (plantillas del profesional, DL-108): éxitos; nombre repetido; cuerpo inválido; filtro inválido; ajena;
  // versión esperada vencida; archivar; sin sesión; un asesorado no tiene plantillas.
  const plantilla = await pro.post('/api/v1/training/plan-templates').send({ name: 'Molde de contrato', structure: estructuraDeEntrenamiento() }).expect(201);
  const plantillaId = plantilla.body.data.templateId as string;
  await pro.post('/api/v1/training/plan-templates').send({ name: 'molde de contrato', structure: estructuraDeEntrenamiento() }).expect(409);
  await pro.post('/api/v1/training/plan-templates').send({ name: '', structure: estructuraDeEntrenamiento() }).expect(400);
  await pro.get('/api/v1/training/plan-templates').expect(200);
  await pro.get('/api/v1/training/plan-templates?state=DRAFT').expect(400);
  await pro.get(`/api/v1/training/plan-templates/${plantillaId}`).expect(200);
  await pro.get(`/api/v1/training/plan-templates/${randomUUID()}`).expect(404);
  await ase.get('/api/v1/training/plan-templates').expect(403);
  await pro.post(`/api/v1/training/plan-templates/${plantillaId}/versions`).send({ expectedVersion: 'v99', structure: estructuraDeEntrenamiento() }).expect(409);
  const segunda = await pro.post(`/api/v1/training/plan-templates/${plantillaId}/versions`).send({ expectedVersion: plantilla.body.data.version, structure: estructuraDeEntrenamiento() }).expect(201);
  await pro.patch(`/api/v1/training/plan-templates/${plantillaId}`).send({ expectedVersion: 'v99', name: 'Otro' }).expect(409);
  await pro.patch(`/api/v1/training/plan-templates/${plantillaId}`).send({ expectedVersion: segunda.body.data.version }).expect(400);
  await pro.patch(`/api/v1/training/plan-templates/${plantillaId}`).send({ expectedVersion: segunda.body.data.version, state: 'ARCHIVED' }).expect(200);
  await request(app.getHttpServer()).get('/api/v1/training/plan-templates').expect(401);

  // TPN-01..05 (plantillas de comidas, DL-108): con un circuito de nutrición.
  const nut = await circuitoListoParaPlanificar(app, 'contrato-tpn');
  const nutPro = conSesion(app, nut.pro.token);
  const tpn = await nutPro.post('/api/v1/nutrition/plan-templates').send({ name: 'Molde de comidas', structure: estructura(nut.arroz, nut.pollo) }).expect(201);
  const tpnId = tpn.body.data.templateId as string;
  await nutPro.post('/api/v1/nutrition/plan-templates').send({ name: 'molde de comidas', structure: estructura(nut.arroz, nut.pollo) }).expect(409);
  await nutPro.post('/api/v1/nutrition/plan-templates').send({ name: '', structure: estructura(nut.arroz, nut.pollo) }).expect(400);
  await nutPro.get('/api/v1/nutrition/plan-templates').expect(200);
  await nutPro.get('/api/v1/nutrition/plan-templates?state=DRAFT').expect(400);
  await nutPro.get(`/api/v1/nutrition/plan-templates/${tpnId}`).expect(200);
  await nutPro.get(`/api/v1/nutrition/plan-templates/${randomUUID()}`).expect(404);
  await conSesion(app, nut.ase.token).get('/api/v1/nutrition/plan-templates').expect(403);
  await nutPro.post(`/api/v1/nutrition/plan-templates/${tpnId}/versions`).send({ expectedVersion: 'v99', structure: estructura(nut.arroz, nut.pollo) }).expect(409);
  const tpn2 = await nutPro.post(`/api/v1/nutrition/plan-templates/${tpnId}/versions`).send({ expectedVersion: tpn.body.data.version, structure: estructura(nut.arroz, nut.pollo) }).expect(201);
  await nutPro.patch(`/api/v1/nutrition/plan-templates/${tpnId}`).send({ expectedVersion: 'v99', name: 'Otro' }).expect(409);
  await nutPro.patch(`/api/v1/nutrition/plan-templates/${tpnId}`).send({ expectedVersion: tpn2.body.data.version }).expect(400);
  await nutPro.patch(`/api/v1/nutrition/plan-templates/${tpnId}`).send({ expectedVersion: tpn2.body.data.version, state: 'ARCHIVED' }).expect(200);
  await request(app.getHttpServer()).get('/api/v1/nutrition/plan-templates').expect(401);

  // HAB-01..05 («Mis habituales» de entrenamiento, DL-109): marcar, listar y quitar un ejercicio habitual (inexistente
  // 422, estado inválido 400, asesorado 403); sesión habitual guardada, nombre repetido 409, `replaces` inexistente 404,
  // ejercicio inexistente 422, cuerpo inválido 400, límite inválido 400, versión vencida 409, renombrar, quitar, sin sesión.
  const buscado = await pro.get('/api/v1/training/exercises?q=sentadilla').expect(200);
  const ejercicioHabitualId = buscado.body.data[0].exerciseId as string;
  await pro.patch(`/api/v1/training/favorite-exercises/${ejercicioHabitualId}`).send({ state: 'MARKED' }).expect(200);
  await pro.patch(`/api/v1/training/favorite-exercises/${randomUUID()}`).send({ state: 'MARKED' }).expect(422);
  await pro.patch(`/api/v1/training/favorite-exercises/${ejercicioHabitualId}`).send({ state: 'FAVORITO' }).expect(400);
  await pro.get('/api/v1/training/favorite-exercises').expect(200);
  await ase.get('/api/v1/training/favorite-exercises').expect(403);
  const sesionHabitual = { label: 'Sesión de contrato', prescriptions: [{ exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [], intensity: null }] };
  const hab = await pro.post('/api/v1/training/session-presets').send({ name: 'Pierna de contrato', structure: sesionHabitual }).expect(201);
  const habId = hab.body.data.presetId as string;
  await pro.post('/api/v1/training/session-presets').send({ name: 'pierna de contrato', structure: sesionHabitual }).expect(409);
  await pro.post('/api/v1/training/session-presets').send({ name: 'Otra', structure: sesionHabitual, replaces: randomUUID() }).expect(404);
  await pro.post('/api/v1/training/session-presets').send({ name: 'Con ajeno', structure: { ...sesionHabitual, prescriptions: [{ exerciseVersionId: randomUUID(), sets: [], intensity: null }] } }).expect(422);
  await pro.post('/api/v1/training/session-presets').send({ name: '', structure: sesionHabitual }).expect(400);
  await pro.get('/api/v1/training/session-presets').expect(200);
  await pro.get('/api/v1/training/session-presets?limit=0').expect(400);
  await pro.patch(`/api/v1/training/session-presets/${habId}`).send({ expectedVersion: 'v99', name: 'Otro' }).expect(409);
  await pro.patch(`/api/v1/training/session-presets/${habId}`).send({ expectedVersion: hab.body.data.version }).expect(400);
  await pro.patch(`/api/v1/training/session-presets/${randomUUID()}`).send({ expectedVersion: hab.body.data.version, name: 'Otro' }).expect(404);
  const habRenombrado = await pro.patch(`/api/v1/training/session-presets/${habId}`).send({ expectedVersion: hab.body.data.version, name: 'Pierna renombrada' }).expect(200);
  await pro.patch(`/api/v1/training/session-presets/${habId}`).send({ expectedVersion: habRenombrado.body.data.version, state: 'REMOVED' }).expect(200);
  await pro.patch(`/api/v1/training/favorite-exercises/${ejercicioHabitualId}`).send({ state: 'REMOVED' }).expect(200);
  await request(app.getHttpServer()).get('/api/v1/training/session-presets').expect(401);

  // HAN-01..05 («Mis habituales» de nutrición, DL-109): lo mismo con alimentos y comidas, con el circuito de nutrición.
  await nutPro.patch(`/api/v1/nutrition/favorite-items/${nut.arroz}`).send({ state: 'MARKED' }).expect(200);
  await nutPro.patch(`/api/v1/nutrition/favorite-items/${randomUUID()}`).send({ state: 'MARKED' }).expect(422);
  await nutPro.patch(`/api/v1/nutrition/favorite-items/${nut.arroz}`).send({ state: 'FAVORITO' }).expect(400);
  await nutPro.get('/api/v1/nutrition/favorite-items').expect(200);
  await conSesion(app, nut.ase.token).get('/api/v1/nutrition/favorite-items').expect(403);
  const comidaHabitual = (estructura(nut.arroz, nut.pollo).dayTypes as Array<{ meals: unknown[] }>)[0]!.meals[0];
  const han = await nutPro.post('/api/v1/nutrition/meal-presets').send({ name: 'Almuerzo de contrato', structure: comidaHabitual }).expect(201);
  const hanId = han.body.data.presetId as string;
  await nutPro.post('/api/v1/nutrition/meal-presets').send({ name: 'almuerzo de contrato', structure: comidaHabitual }).expect(409);
  await nutPro.post('/api/v1/nutrition/meal-presets').send({ name: 'Otra', structure: comidaHabitual, replaces: randomUUID() }).expect(404);
  await nutPro.post('/api/v1/nutrition/meal-presets').send({ name: '', structure: comidaHabitual }).expect(400);
  await nutPro.get('/api/v1/nutrition/meal-presets').expect(200);
  await nutPro.get('/api/v1/nutrition/meal-presets?limit=0').expect(400);
  await nutPro.patch(`/api/v1/nutrition/meal-presets/${hanId}`).send({ expectedVersion: 'v99', name: 'Otro' }).expect(409);
  await nutPro.patch(`/api/v1/nutrition/meal-presets/${hanId}`).send({ expectedVersion: han.body.data.version }).expect(400);
  await nutPro.patch(`/api/v1/nutrition/meal-presets/${randomUUID()}`).send({ expectedVersion: han.body.data.version, name: 'Otro' }).expect(404);
  const hanRenombrado = await nutPro.patch(`/api/v1/nutrition/meal-presets/${hanId}`).send({ expectedVersion: han.body.data.version, name: 'Almuerzo renombrado' }).expect(200);
  await nutPro.patch(`/api/v1/nutrition/meal-presets/${hanId}`).send({ expectedVersion: hanRenombrado.body.data.version, state: 'REMOVED' }).expect(200);
  await nutPro.patch(`/api/v1/nutrition/favorite-items/${nut.arroz}`).send({ state: 'REMOVED' }).expect(200);
  await request(app.getHttpServer()).get('/api/v1/nutrition/meal-presets').expect(401);
  await pro.post('/api/v1/training/exercises').send({ ...ejercicio, muscleZones: [{ zoneId: 'zone_x', role: 'PRIMARY' }] }).expect(422);
  await pro.post('/api/v1/training/exercises').send({ ...ejercicio, extra: 1 }).expect(400);
  await ase.post('/api/v1/training/exercises').send(ejercicio).expect(403);
});

it('TEST-CT (WP-07): FRM-01 a 08 — catálogo, Solicitud, Respuesta y rectificación', async () => {
  const PLANTILLA_SALUD = '7aa84959-7702-4749-bf70-7fdc574db6ca';
  const VERSION_SALUD = '349161b3-b831-4df1-896f-484517393a57';
  // FRM-HABITOS v1 (P0, con un NUMBER), en una copia de prueba: desde la ronda 2.1 la del catálogo es histórica (DL-165).
  const VERSION_HABITOS = (await sembrarCopiaDeLaVersion(prisma, VERSION_HABITOS_V1, 'ct-frm')).versionId;

  const proParte = await prepararProfesional(app, 'frm', ['ENTRENAMIENTO']);
  const pro = conSesion(app, proParte.token);
  const aseParte = await prepararAsesorado(app, 'frm', { a3: true });
  const ase = conSesion(app, aseParte.token);
  await vinculoCompleto(app, proParte, aseParte, 'ENTRENAMIENTO');
  const ajenoParte = await prepararProfesional(app, 'frm-ajeno', ['ENTRENAMIENTO']);
  const ajeno = conSesion(app, ajenoParte.token);

  // FRM-01/02 — catálogo (metadatos, sin PDP)
  const lista = await pro.get('/api/v1/form-templates').expect(200);
  expect((lista.body.data as unknown[]).length).toBeGreaterThan(0);
  await pro.get('/api/v1/form-templates?status=BOGUS').expect(400);
  const version = await pro.get(`/api/v1/form-templates/${PLANTILLA_SALUD}/versions/${VERSION_SALUD}`).expect(200);
  expect(version.body.data.sections[0].fields[0].fieldCode).toBe('condiciones_declaradas');
  await pro.get(`/api/v1/form-templates/${PLANTILLA_SALUD}/versions/${randomUUID()}`).expect(404);

  // FRM-03 — crear la Solicitud
  const cuerpoDeSolicitud = {
    templateVersionId: VERSION_SALUD,
    purpose: 'Seguridad del entrenamiento',
    scope: 'ENTRENAMIENTO',
    requestedFieldCodes: ['condiciones_declaradas', 'dolor_o_lesiones'],
    requiredFieldCodes: ['condiciones_declaradas'],
  };
  const claveDeSolicitud = claveDeIdempotencia();
  const creada = await pro.post(`/api/v1/advisees/${aseParte.id}/form-requests`, claveDeSolicitud).send(cuerpoDeSolicitud).expect(201);
  const formRequestId = creada.body.data.formRequestId as string;
  expect(creada.body.data.status).toBe('PENDING');
  await pro.post(`/api/v1/advisees/${aseParte.id}/form-requests`, claveDeSolicitud).send(cuerpoDeSolicitud).expect(201); // replay idempotente
  await pro.post(`/api/v1/advisees/${aseParte.id}/form-requests`, claveDeSolicitud).send({ ...cuerpoDeSolicitud, purpose: 'Otro propósito' }).expect(409);
  await request(app.getHttpServer()).post(`/api/v1/advisees/${aseParte.id}/form-requests`).set('Authorization', `Bearer ${proParte.token}`).send(cuerpoDeSolicitud).expect(400);
  await pro.post(`/api/v1/advisees/${aseParte.id}/form-requests`).send({ ...cuerpoDeSolicitud, requiredFieldCodes: ['medicacion_relevante'] }).expect(422); // requerido fuera de lo solicitado
  await pro.post(`/api/v1/advisees/${aseParte.id}/form-requests`).send({ ...cuerpoDeSolicitud, templateVersionId: randomUUID() }).expect(422); // plantilla inexistente
  await pro.post(`/api/v1/advisees/${randomUUID()}/form-requests`).send(cuerpoDeSolicitud).expect(404); // sin vínculo

  // FRM-04 — listar del lado del profesional
  const listaDelProfesional = await pro.get(`/api/v1/advisees/${aseParte.id}/form-requests`).expect(200);
  expect((listaDelProfesional.body.data as { formRequestId: string }[]).some((s) => s.formRequestId === formRequestId)).toBe(true);
  await pro.get(`/api/v1/advisees/${randomUUID()}/form-requests`).expect(200); // vacío: no revela si el id corresponde a alguien

  // FRM-05 — detalle actor-scoped
  const detalleDelProfesional = await pro.get(`/api/v1/form-requests/${formRequestId}`).expect(200);
  expect(detalleDelProfesional.body.data.response).toBeNull();
  const detalleDelAsesorado = await ase.get(`/api/v1/form-requests/${formRequestId}`).expect(200);
  expect(detalleDelAsesorado.body.data.request.formRequestId).toBe(formRequestId);
  await ajeno.get(`/api/v1/form-requests/${formRequestId}`).expect(404);
  await pro.get(`/api/v1/form-requests/${randomUUID()}`).expect(404);

  // FRM-06 — Solicitudes propias del asesorado, con `respondable`
  const propias = await ase.get('/api/v1/me/form-requests').expect(200);
  const propia = (propias.body.data as { formRequestId: string; respondable: boolean }[]).find((s) => s.formRequestId === formRequestId);
  expect(propia?.respondable).toBe(true);

  // FRM-07 — responder
  const respuestaCuerpo = { answers: [{ fieldCode: 'condiciones_declaradas', value: 'Sin condiciones' }] };
  const respondida = await ase.post(`/api/v1/me/form-requests/${formRequestId}/responses`).send(respuestaCuerpo).expect(201);
  const formResponseId = respondida.body.data.formResponseId as string;
  expect(respondida.body.data.version).toBe('v1');
  await ase.post(`/api/v1/me/form-requests/${formRequestId}/responses`).send(respuestaCuerpo).expect(422); // ya respondida
  // Otra Solicitud, de la otra plantilla, para un valor de tipo incorrecto (NUMBER esperado, string enviado).
  const otraSolicitud = await pro
    .post(`/api/v1/advisees/${aseParte.id}/form-requests`)
    .send({ templateVersionId: VERSION_HABITOS, purpose: 'Hábitos', scope: 'ENTRENAMIENTO', requestedFieldCodes: ['horas_de_sueno'], requiredFieldCodes: ['horas_de_sueno'] })
    .expect(201);
  await ase
    .post(`/api/v1/me/form-requests/${otraSolicitud.body.data.formRequestId}/responses`)
    .send({ answers: [{ fieldCode: 'horas_de_sueno', value: 'ocho' }] })
    .expect(422);
  await pro.post(`/api/v1/me/form-requests/${formRequestId}/responses`).send(respuestaCuerpo).expect(404); // el profesional no es el titular

  // FRM-08 — rectificar
  const rectificada = await ase
    .post(`/api/v1/me/form-responses/${formResponseId}/rectifications`)
    .send({ expectedVersion: 'v1', reason: 'Corrijo un dato mal tipeado.', answers: [{ fieldCode: 'condiciones_declaradas', value: 'Asma leve' }] })
    .expect(201);
  expect(rectificada.body.data.version).toBe('v2');
  await ase
    .post(`/api/v1/me/form-responses/${formResponseId}/rectifications`)
    .send({ expectedVersion: 'v1', reason: 'Con la versión vieja.', answers: [{ fieldCode: 'condiciones_declaradas', value: 'x' }] })
    .expect(409);
  await ajeno
    .post(`/api/v1/me/form-responses/${formResponseId}/rectifications`)
    .send({ expectedVersion: 'v2', reason: 'x', answers: [{ fieldCode: 'condiciones_declaradas', value: 'x' }] })
    .expect(404);
});

it('TEST-CT (DL-164): FRI-01 a 08 — la definición V2, la bandeja, la vista, responder y rectificar en V2, y la propuesta del profesional', async () => {
  const c = await circuitoV2(app, prisma, 'ct-fri');
  const pro = fri(app, c.pro.token);
  const ase = fri(app, c.ase.token);
  const otroParte = await prepararProfesional(app, 'ct-fri-otro', ['NUTRICION']);
  await vinculoCompleto(app, otroParte, c.ase, 'NUTRICION');
  const otro = fri(app, otroParte.token);
  const oculta = RESPUESTAS_V2.map((r) => (r.fieldCode === 'ini_condiciones' ? { fieldCode: r.fieldCode, answer: { type: 'MULTI_CHOICE', options: ['hipertension'], otherText: null } } : r));

  // FRI-01 — la definición, en V2
  await ase.definicion(c.plantillaId, c.versionId).expect(200);
  await ase.definicion(c.plantillaId, randomUUID()).expect(404);
  await conSesion(app, c.ase.token).get(`/api/v1/form-templates/${c.plantillaId}/versions/${c.versionId}/definition?x=1`).expect(400);

  // FRI-02 — la bandeja
  await ase.bandeja().expect(200);
  await ase.bandeja('?status=BOGUS').expect(400); // INVALID_REQUEST
  await ase.bandeja('?cursor=basura').expect(400); // INVALID_CURSOR

  // FRI-03 — la vista, para los dos actores
  await ase.vista(c.formRequestId).expect(200);
  await pro.vista(c.formRequestId).expect(200);
  await otro.vista(c.formRequestId).expect(404);
  await conSesion(app, c.ase.token).get(`/api/v1/form-requests/${c.formRequestId}/view?x=1`).expect(400);

  // FRI-06 — cargar y reemplazar
  await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201);
  await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(409); // ya hay una pendiente
  await pro.cargar(c.formRequestId, { expectedVersion: 'v1', answers: conAgua(5) }).expect(200);
  await pro.cargar(c.formRequestId, { expectedVersion: 'v1', answers: conAgua(5) }).expect(409); // VERSION_CONFLICT
  await pro.cargar(c.formRequestId, { expectedVersion: 'v2', answers: oculta }).expect(422); // FORM_RESPONSE_INVALID (lo oculto)
  await pro.cargar(c.formRequestId, { expectedVersion: 'v2', answers: RESPUESTAS_V2, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await otro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(404);
  await request(app.getHttpServer()).put(`/api/v1/form-requests/${c.formRequestId}/proposal`).set('Authorization', `Bearer ${c.pro.token}`).send({ expectedVersion: 'v2', answers: RESPUESTAS_V2 }).expect(400); // sin Idempotency-Key

  // FRI-08 — rechazar (la persona)
  await ase.rechazar(c.formRequestId, { expectedVersion: 'v1' }).expect(409);
  await pro.rechazar(c.formRequestId, { expectedVersion: 'v2' }).expect(404); // el profesional no es el titular
  await ase.rechazar(c.formRequestId, { expectedVersion: 'v2' }).expect(200);
  await ase.rechazar(c.formRequestId, { expectedVersion: 'v2' }).expect(409);

  // FRI-07 — retirar (el profesional)
  await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201);
  await pro.retirar(c.formRequestId, { expectedVersion: 'v9' }).expect(409);
  await otro.retirar(c.formRequestId, { expectedVersion: 'v1' }).expect(404);
  await pro.retirar(c.formRequestId, { expectedVersion: 'v1' }).expect(200);
  await pro.retirar(c.formRequestId, { expectedVersion: 'v1' }).expect(409);

  // FRI-04 — responder, confirmando la propuesta
  const tercera = (await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body.data.proposalId as string;
  await ase.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(409); // hay una pendiente que no se vio
  await ase.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: { proposalId: tercera, expectedVersion: 'v7' } }).expect(409);
  await ase.responder(c.formRequestId, { answers: oculta, fromProposal: { proposalId: tercera, expectedVersion: 'v1' } }).expect(422);
  await pro.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(404); // el profesional no es el titular
  await ase.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: { proposalId: tercera, expectedVersion: 'v1' }, extra: 1 }).expect(400);
  const claveFri = claveDeIdempotencia();
  const confirmada = await ase.responder(c.formRequestId, { answers: conAgua(8), fromProposal: { proposalId: tercera, expectedVersion: 'v1' } }, claveFri).expect(201);
  await ase.responder(c.formRequestId, { answers: conAgua(8), fromProposal: { proposalId: tercera, expectedVersion: 'v1' } }, claveFri).expect(201); // replay
  await ase.responder(c.formRequestId, { answers: conAgua(9), fromProposal: { proposalId: tercera, expectedVersion: 'v1' } }, claveFri).expect(409); // IDEMPOTENCY_KEY_REUSED
  await ase.responder(c.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(422); // ya respondida
  await pro.cargar(c.formRequestId, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(422); // respondida: no hay nada que confirmar
  await request(app.getHttpServer()).post(`/api/v1/me/form-requests/${c.formRequestId}/answers`).set('Authorization', `Bearer ${c.ase.token}`).send({ answers: RESPUESTAS_V2, fromProposal: null }).expect(400); // sin Idempotency-Key

  // FRI-05 — corregir
  const formResponseIdV2 = confirmada.body.data.formResponseId as string;
  await ase.corregir(formResponseIdV2, { expectedVersion: 'v1', reason: 'Ajuste.', answers: RESPUESTAS_V2 }).expect(201);
  await ase.corregir(formResponseIdV2, { expectedVersion: 'v1', reason: 'Vieja.', answers: RESPUESTAS_V2 }).expect(409);
  await ase.corregir(formResponseIdV2, { expectedVersion: 'v2', reason: 'Mal.', answers: oculta }).expect(422);
  await otro.corregir(formResponseIdV2, { expectedVersion: 'v2', reason: 'x', answers: RESPUESTAS_V2 }).expect(404);
  await ase.corregir(formResponseIdV2, { expectedVersion: 'v2', reason: 'x', answers: RESPUESTAS_V2, extra: 1 }).expect(400);

  // Sin el A3 vigente: 403 en la vista, al responder y al corregir (otro circuito, que respondió antes). Rechazar no exige
  // el A3: descarta un dato no confirmado, y sin una pendiente es 409.
  const c2 = await circuitoV2(app, prisma, 'ct-fri-a3');
  const respondida = await fri(app, c2.ase.token).responder(c2.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(201);
  await conSesion(app, c2.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, c2.ase.token)}/revoke`).send({}).expect(200);
  await fri(app, c2.ase.token).vista(c2.formRequestId).expect(403);
  await fri(app, c2.ase.token).responder(c2.formRequestId, { answers: RESPUESTAS_V2, fromProposal: null }).expect(403);
  await fri(app, c2.ase.token).corregir(respondida.body.data.formResponseId as string, { expectedVersion: 'v1', reason: 'x', answers: RESPUESTAS_V2 }).expect(403);
  await fri(app, c2.ase.token).rechazar(c2.formRequestId, { expectedVersion: 'v1' }).expect(409);
});

it('TEST-CT (DL-165, FR-10): HBT-01 a 05 — mis hábitos, una versión nueva, compartirlos, dejar de compartirlos y lo que ve el profesional', async () => {
  const pro = await prepararProfesional(app, 'ct-hbt', ['NUTRICION']);
  const ajeno = await prepararProfesional(app, 'ct-hbt-ajeno', ['NUTRICION']);
  const ase = await prepararAsesorado(app, 'ct-hbt', { a3: true });
  await vinculoCompleto(app, pro, ase, 'NUTRICION');
  const yo = conSesion(app, ase.token);
  const servidor = app.getHttpServer();
  const habitos = [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 7, unit: 'h' } }];

  // HBT-01 — mis hábitos
  await yo.get('/api/v1/me/habits').expect(200);
  await yo.get('/api/v1/me/habits?x=1').expect(400); // INVALID_REQUEST
  await request(servidor).get('/api/v1/me/habits').expect(401);

  // HBT-02 — una versión nueva
  const clave = claveDeIdempotencia();
  await yo.post('/api/v1/me/habits', clave).send({ expectedVersion: null, answers: habitos }).expect(201);
  await yo.post('/api/v1/me/habits', clave).send({ expectedVersion: null, answers: habitos }).expect(201); // replay
  await yo.post('/api/v1/me/habits', clave).send({ expectedVersion: 'v1', answers: habitos }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await yo.post('/api/v1/me/habits').send({ expectedVersion: null, answers: habitos }).expect(409); // VERSION_CONFLICT
  await yo.post('/api/v1/me/habits').send({ expectedVersion: 'v1', answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 30, unit: 'h' } }] }).expect(422); // FORM_RESPONSE_INVALID
  await yo.post('/api/v1/me/habits').send({ expectedVersion: 'v1', answers: habitos, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await request(servidor).post('/api/v1/me/habits').set('Authorization', `Bearer ${ase.token}`).send({ expectedVersion: 'v1', answers: habitos }).expect(400); // sin Idempotency-Key

  // HBT-03 — compartirlos
  const compartir = (cambios: Record<string, unknown>) =>
    yo.put('/api/v1/me/habits/sharing').send({ expectedVersion: null, textVersionId: VERSION_VIGENTE.HABITOS_COMPARTIDOS.id, professionalIds: [pro.id], declinedProfessionalIds: [], ...cambios });
  await compartir({ textVersionId: VERSION_VIGENTE.EVIDENCIA_VISUAL.id }).expect(409); // CONSENT_VERSION_STALE
  await compartir({ professionalIds: [ajeno.id] }).expect(422); // HABITS_RECIPIENT_NOT_AVAILABLE
  await compartir({ extra: 1 }).expect(400); // UNKNOWN_FIELD
  await compartir({}).expect(200);
  await compartir({}).expect(409); // VERSION_CONFLICT: ya hay una versión

  // HBT-05 — lo que ve el profesional
  await conSesion(app, pro.token).get(`/api/v1/advisees/${ase.id}/habits`).expect(200);
  await conSesion(app, pro.token).get(`/api/v1/advisees/${ase.id}/habits?x=1`).expect(400); // INVALID_REQUEST
  await conSesion(app, ajeno.token).get(`/api/v1/advisees/${ase.id}/habits`).expect(404);

  // HBT-04 — dejar de compartirlos
  await yo.post('/api/v1/me/habits/sharing/withdrawal').send({ expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  await yo.post('/api/v1/me/habits/sharing/withdrawal').send({ expectedVersion: 'v1', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await yo.post('/api/v1/me/habits/sharing/withdrawal').send({ expectedVersion: 'v1' }).expect(200);

  // Sin el A3 vigente: 403 en lo propio (retirar no lo exige).
  await conSesion(app, ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, ase.token)}/revoke`).send({}).expect(200);
  await yo.get('/api/v1/me/habits').expect(403);
  await yo.post('/api/v1/me/habits').send({ expectedVersion: 'v1', answers: habitos }).expect(403);
  await compartir({ expectedVersion: 'v2' }).expect(403);
});

it('TEST-CT (DL-165, ronda 2.1): HBT-06 a 09 — pedir acceso, lo que sabe el profesional, los pedidos de la persona y su respuesta', async () => {
  const pro = await prepararProfesional(app, 'ct-hbt21', ['NUTRICION']);
  const otro = await prepararProfesional(app, 'ct-hbt21-otro', ['NUTRICION']);
  const ajeno = await prepararProfesional(app, 'ct-hbt21-ajeno', ['NUTRICION']);
  const ase = await prepararAsesorado(app, 'ct-hbt21', { a3: true });
  await vinculoCompleto(app, pro, ase, 'NUTRICION');
  await vinculoCompleto(app, otro, ase, 'NUTRICION');
  const yo = conSesion(app, ase.token);
  const delPro = conSesion(app, pro.token);
  const servidor = app.getHttpServer();
  const PEDIR = `/api/v1/advisees/${ase.id}/habits/access-requests`;

  // HBT-07 — lo que sabe el profesional
  await delPro.get(`/api/v1/advisees/${ase.id}/habits/status`).expect(200);
  await delPro.get(`/api/v1/advisees/${ase.id}/habits/status?x=1`).expect(400); // INVALID_REQUEST
  await conSesion(app, ajeno.token).get(`/api/v1/advisees/${ase.id}/habits/status`).expect(404);
  await request(servidor).get(`/api/v1/advisees/${ase.id}/habits/status`).expect(401);

  // HBT-06 — pedir acceso
  const clave = claveDeIdempotencia();
  const pedido = (await delPro.post(PEDIR, clave).send({ scope: 'NUTRICION' }).expect(201)).body.data as { accessRequestId: string };
  await delPro.post(PEDIR, clave).send({ scope: 'NUTRICION' }).expect(201); // replay
  await delPro.post(PEDIR, clave).send({ scope: 'ANTROPOMETRIA' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await delPro.post(PEDIR).send({ scope: 'NUTRICION' }).expect(422); // HABITS_ACCESS_REQUEST_TOO_SOON
  await delPro.post(PEDIR).send({ scope: 'OTRA' }).expect(400); // INVALID_REQUEST
  await delPro.post(PEDIR).send({ scope: 'NUTRICION', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await conSesion(app, ajeno.token).post(PEDIR).send({ scope: 'NUTRICION' }).expect(404);
  await request(servidor).post(PEDIR).set('Authorization', `Bearer ${pro.token}`).send({ scope: 'NUTRICION' }).expect(400); // sin Idempotency-Key
  const delOtro = (await conSesion(app, otro.token).post(PEDIR).send({ scope: 'NUTRICION' }).expect(201)).body.data as { accessRequestId: string };

  // HBT-08 — los pedidos que esperan
  await yo.get('/api/v1/me/habits/access-requests').expect(200);
  await yo.get('/api/v1/me/habits/access-requests?x=1').expect(400); // INVALID_REQUEST
  await request(servidor).get('/api/v1/me/habits/access-requests').expect(401);

  // HBT-09 — responder
  const responder = (id: string, cuerpo: Record<string, unknown>, c?: string) => yo.post(`/api/v1/me/habits/access-requests/${id}/answer`, c).send(cuerpo);
  const si = { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion: null, textVersionId: VERSION_VIGENTE.HABITOS_COMPARTIDOS.id } };
  await responder(pedido.accessRequestId, { ...si, sharing: null }).expect(400); // INVALID_REQUEST: «Sí» sin lo que vio
  await responder(pedido.accessRequestId, { ...si, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await responder(randomUUID(), si).expect(404);
  await responder(pedido.accessRequestId, { ...si, sharing: { ...si.sharing, textVersionId: VERSION_VIGENTE.EVIDENCIA_VISUAL.id } }).expect(409); // CONSENT_VERSION_STALE
  await responder(pedido.accessRequestId, { ...si, expectedVersion: 'v2' }).expect(409); // VERSION_CONFLICT
  const claveSi = claveDeIdempotencia();
  await responder(pedido.accessRequestId, si, claveSi).expect(200);
  await responder(pedido.accessRequestId, si, claveSi).expect(200); // replay
  await responder(pedido.accessRequestId, { ...si, answer: 'NOT_NOW', sharing: null }, claveSi).expect(409); // IDEMPOTENCY_KEY_REUSED
  await responder(delOtro.accessRequestId, { expectedVersion: 'v1', answer: 'NOT_NOW', sharing: null }).expect(200);
  await request(servidor).post(`/api/v1/me/habits/access-requests/${pedido.accessRequestId}/answer`).set('Authorization', `Bearer ${ase.token}`).send(si).expect(400); // sin Idempotency-Key
  // Ya los recibe: no hay nada que pedir.
  await delPro.post(PEDIR).send({ scope: 'NUTRICION' }).expect(422); // HABITS_ALREADY_SHARED

  // Un profesional que terminó su vínculo con un pedido esperando: decir que sí es 422.
  const fin = await prepararProfesional(app, 'ct-hbt21-fin', ['NUTRICION']);
  const vFin = await vinculoCompleto(app, fin, ase, 'NUTRICION');
  const deFin = (await conSesion(app, fin.token).post(PEDIR).send({ scope: 'NUTRICION' }).expect(201)).body.data as { accessRequestId: string };
  await finalizar(app, ase.token, vFin.vinculoId, await versionDeVinculo(app, ase.token, vFin.vinculoId)).expect(200);
  const version = (await yo.get('/api/v1/me/habits').expect(200)).body.data.sharing.version as string;
  await responder(deFin.accessRequestId, { ...si, sharing: { ...si.sharing, expectedVersion: version } }).expect(422); // HABITS_RECIPIENT_NOT_AVAILABLE

  // Sin el A3 vigente: 403 en lo propio (decir que no, no lo exige).
  await conSesion(app, ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, ase.token)}/revoke`).send({}).expect(200);
  await yo.get('/api/v1/me/habits/access-requests').expect(403);
  await responder(deFin.accessRequestId, si).expect(403);
});

it('TEST-CT (PF-02 · DL-100/101/102): «Antecedentes para entrenamiento» — FRM-02 sin propiedades nuevas, límites NUMBER en el servidor y la cita de una versión vieja es 409', async () => {
  // La v1 del catálogo: histórica desde DL-164 FI-02 (la v2, con tipos nuevos, es la vigente). FRM-02 la sigue sirviendo en P0.
  const PLANTILLA_ENTRENAMIENTO = '67e4d0b3-cf4a-41e7-9d84-6864c5dde951';
  const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
  const SEIS = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];
  // Para pedir y responder en P0 (FRM-03 ya no deja pedir la v1): una copia de prueba con el mismo contenido y sus límites.
  const copiaDeP0 = await sembrarAntecedentesDeP0(prisma, 'frm-trn');

  const proParte = await prepararProfesional(app, 'frm-trn', ['ENTRENAMIENTO']);
  const pro = conSesion(app, proParte.token);
  const aseParte = await prepararAsesorado(app, 'frm-trn', { a3: true });
  const ase = conSesion(app, aseParte.token);
  await vinculoCompleto(app, proParte, aseParte, 'ENTRENAMIENTO');

  // FRM-01: aparece al filtrar por ENTRENAMIENTO (el catálogo entero, por cursor: las pruebas siembran plantillas más
  // nuevas y una sola página puede no llegar). FRM-02: los seis campos, y **ninguna propiedad fuera del contrato** (la
  // prueba de éxitos valida el cuerpo contra el esquema estricto que usa la APK 0.11.x).
  expect((await catalogoDePlantillas(app, proParte.token, '&domain=ENTRENAMIENTO')).has('FRM-ENTRENAMIENTO')).toBe(true);
  const version = await pro.get(`/api/v1/form-templates/${PLANTILLA_ENTRENAMIENTO}/versions/${VERSION_ENTRENAMIENTO}`).expect(200);
  const campos = (version.body.data.sections as { fields: Record<string, unknown>[] }[]).flatMap((s) => s.fields);
  expect(campos.map((c) => c.fieldCode)).toEqual(SEIS);
  for (const c of campos) expect(Object.keys(c).sort()).toEqual(['category', 'dataType', 'fieldCode', 'helpText', 'label', 'unit']);
  expect(JSON.stringify(version.body)).not.toContain('numberLimits');

  const solicitud = await pro
    .post(`/api/v1/advisees/${aseParte.id}/form-requests`)
    .send({ templateVersionId: copiaDeP0.versionId, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: SEIS, requiredFieldCodes: SEIS.slice(0, 5) })
    .expect(201);
  const responder = `/api/v1/me/form-requests/${solicitud.body.data.formRequestId}/responses`;
  const respuestas = (dias: number, minutos: number) => ({
    answers: [
      { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza para subir escaleras sin cansarme' },
      { fieldCode: 'trn_experiencia', value: 'Caminatas; nada de fuerza en el último año' },
      { fieldCode: 'trn_dias_por_semana', value: dias },
      { fieldCode: 'trn_minutos_por_sesion', value: minutos },
      { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa, con mancuernas livianas' },
    ],
  });

  // DL-101: días de 1 a 7 y enteros; minutos de 1 a 600 y enteros. Todo lo demás, 422 FORM_RESPONSE_INVALID.
  for (const [dias, minutos] of [[0, 45], [9, 45], [2.5, 45], [-1, 45], [3, 0], [3, 601], [3, 45.5]] as const) {
    const r = await ase.post(responder).send(respuestas(dias, minutos)).expect(422);
    expect(r.body.error.code).toBe('FORM_RESPONSE_INVALID');
  }
  const respondida = await ase.post(responder).send(respuestas(3, 45)).expect(201);

  // La rectificación valida lo mismo (y, como el envío, reemplaza la respuesta completa: lleva los requeridos).
  const rectificar = `/api/v1/me/form-responses/${respondida.body.data.formResponseId}/rectifications`;
  await ase.post(rectificar).send({ expectedVersion: 'v1', reason: 'Tengo un día más.', ...respuestas(8, 45) }).expect(422);
  await ase.post(rectificar).send({ expectedVersion: 'v1', reason: 'Tengo un día más.', ...respuestas(4, 45) }).expect(201);

  // DL-102 (auditoría del PR 102): la cita lleva la versión que el profesional vio. Citar la v1 después de la
  // rectificación es 409 VERSION_CONFLICT, declarado en API-TRN-01; con la v2, el 201 valida contra el esquema de éxito.
  const evaluar = `/api/v1/advisees/${aseParte.id}/training/evaluations`;
  const citando = (expectedVersion: string) => ({
    ...cuerpoDeEvaluacionDeEntrenamiento(),
    formResponseReferences: [{ formResponseId: respondida.body.data.formResponseId, fieldCode: 'trn_dias_por_semana', expectedVersion }],
  });
  expect((await pro.post(evaluar).send(citando('v1')).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
  await pro.post(evaluar).send(citando('v2')).expect(201);
});

it('TEST-CT (WP-NUTRICION-RECETAS): las 18 operaciones REC, MED e ING, con éxitos y errores declarados', async () => {
  const c = await circuitoListoParaPlanificar(app, 'contrato-recetas');
  const pro = conSesion(app, c.pro.token);
  const ase = conSesion(app, c.ase.token);
  const servidor = app.getHttpServer();
  const ajeno = randomUUID();
  const alimentos = await alimentosUsda(app, c.pro);
  const cuerpo = cuerpoDeReceta(RECETAS[0]!, alimentos);

  // REC-01 · REC-07
  const claveDeReceta = claveDeIdempotencia();
  const receta = (await pro.post('/api/v1/nutrition/recipes', claveDeReceta).send(cuerpo).expect(201)).body.data;
  await pro.post('/api/v1/nutrition/recipes', claveDeReceta).send({ ...cuerpo, name: 'Otro nombre' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post('/api/v1/nutrition/recipes').send({ ...cuerpo, total: 1 }).expect(400); // UNKNOWN_FIELD: el cliente no manda totales
  await request(servidor).post('/api/v1/nutrition/recipes').set('Authorization', `Bearer ${c.pro.token}`).send(cuerpo).expect(400); // sin clave
  await pro.post('/api/v1/nutrition/recipes').send({ ...cuerpo, ingredients: [{ ...cuerpo.ingredients[0]!, catalogItemVersionId: ajeno }] }).expect(422); // CATALOG_REFERENCE_INVALID
  await ase.post('/api/v1/nutrition/recipes').send(cuerpo).expect(403);
  await request(servidor).post('/api/v1/nutrition/recipes').set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo).expect(401);
  await pro.post('/api/v1/nutrition/recipe-calculations').send({ servings: 2, ingredients: cuerpo.ingredients }).expect(200);
  await pro.post('/api/v1/nutrition/recipe-calculations').send({ servings: 2 }).expect(400);
  await pro.post('/api/v1/nutrition/recipe-calculations').send({ servings: 1, ingredients: [{ ...cuerpo.ingredients[0]!, catalogItemId: ajeno }] }).expect(422);
  await ase.post('/api/v1/nutrition/recipe-calculations').send({ servings: 1, ingredients: cuerpo.ingredients }).expect(403);
  // REC-02 · REC-03
  await pro.get('/api/v1/nutrition/recipes?limit=5').expect(200);
  await pro.get('/api/v1/nutrition/recipes?cursor=basura').expect(400); // INVALID_CURSOR
  await pro.get('/api/v1/nutrition/recipes?orden=asc').expect(400);
  await ase.get('/api/v1/nutrition/recipes').expect(403);
  await pro.get(`/api/v1/nutrition/recipes/${receta.recipeId}`).expect(200);
  await pro.get(`/api/v1/nutrition/recipes/${ajeno}`).expect(404);
  await pro.get(`/api/v1/nutrition/recipes/${receta.recipeId}?x=1`).expect(400);
  await ase.get(`/api/v1/nutrition/recipes/${receta.recipeId}`).expect(403);
  // REC-04
  const editar = (id: string, extra: Record<string, unknown>) => request(servidor).patch(`/api/v1/nutrition/recipes/${id}`).set('Authorization', `Bearer ${c.pro.token}`).set('Idempotency-Key', claveDeIdempotencia()).send({ ...cuerpo, ...extra });
  const editada = (await editar(receta.recipeId, { expectedVersion: receta.version }).expect(200)).body.data;
  await editar(receta.recipeId, { expectedVersion: receta.version }).expect(409); // VERSION_CONFLICT
  await editar(ajeno, { expectedVersion: 'v1' }).expect(404);
  await editar(receta.recipeId, { expectedVersion: editada.version, ingredients: [{ ...cuerpo.ingredients[0]!, catalogItemVersionId: ajeno }] }).expect(422);
  await editar(receta.recipeId, { expectedVersion: editada.version, extra: true }).expect(400);
  // MED-01 · MED-02
  const intencion = (cuerpoDeIntencion: Record<string, unknown>, parte = pro, clave?: string) =>
    parte.post('/api/v1/me/media/upload-intents', clave).send({ purpose: 'RECIPE_REFERENCE', contentType: 'image/png', byteSize: FOTOS[0]!.length, provenance: 'AI_GENERATED', authorship: null, ...cuerpoDeIntencion });
  const claveDeIntencion = claveDeIdempotencia();
  const subida = (await intencion({}, pro, claveDeIntencion).expect(201)).body.data;
  await intencion({ byteSize: 10 }, pro, claveDeIntencion).expect(409); // IDEMPOTENCY_KEY_REUSED
  await intencion({ contentType: 'image/gif' }).expect(422); // FILE_TYPE_NOT_ALLOWED
  await intencion({ byteSize: 10 * 1024 * 1024 + 1 }).expect(422); // FILE_SIZE_NOT_ALLOWED
  await intencion({ purpose: 'MEAL_EVIDENCE', provenance: 'AI_GENERATED' }, ase).expect(422); // VALIDATION_FAILED
  await intencion({}, ase).expect(403);
  await intencion({ extra: 1 }).expect(400);
  await request(servidor).post('/api/v1/me/media/upload-intents').set('Idempotency-Key', claveDeIdempotencia()).send({}).expect(401);
  const imagen = (await subirBytes(app, subida.uploadPath, FOTOS[0]!, 'image/png').expect(200)).body.data;
  await subirBytes(app, subida.uploadPath, FOTOS[0]!, 'image/png').expect(200); // la misma subida: el mismo medio
  await subirBytes(app, subida.uploadPath, FOTOS[1]!, 'image/png').expect(409); // INVALID_STATE_TRANSITION
  await subirBytes(app, '/media/uploads/no.es-una-ruta', FOTOS[0]!, 'image/png').expect(404);
  const otraSubida = (await intencion({}).expect(201)).body.data;
  await subirBytes(app, otraSubida.uploadPath, FOTOS[0]!, 'image/gif').expect(422); // FILE_TYPE_NOT_ALLOWED
  await subirBytes(app, otraSubida.uploadPath, Buffer.from('no es una imagen'), 'image/png').expect(422); // FILE_CONTENT_INVALID
  await subirBytes(app, otraSubida.uploadPath, Buffer.alloc(10 * 1024 * 1024 + 1, 1), 'image/png').expect(422); // FILE_SIZE_NOT_ALLOWED
  await request(servidor).put(`/api/v1${otraSubida.uploadPath}?x=1`).set('Content-Type', 'image/png').send(FOTOS[0]!).expect(400);
  // REC-05 · REC-06
  const asociada = (await pro.put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: imagen.mediaId, expectedVersion: editada.version }).expect(200)).body.data;
  await pro.put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: imagen.mediaId, expectedVersion: editada.version }).expect(409); // VERSION_CONFLICT
  await pro.put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: ajeno, expectedVersion: asociada.version }).expect(422); // MEDIA_REFERENCE_INVALID
  await pro.put(`/api/v1/nutrition/recipes/${ajeno}/image`).send({ mediaId: imagen.mediaId, expectedVersion: 'v1' }).expect(404);
  await pro.put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: imagen.mediaId, expectedVersion: asociada.version, extra: 1 }).expect(400);
  const retirar = (id: string, query: string) => request(servidor).delete(`/api/v1/nutrition/recipes/${id}/image${query}`).set('Authorization', `Bearer ${c.pro.token}`).set('Idempotency-Key', claveDeIdempotencia());
  await retirar(receta.recipeId, '').expect(400);
  await retirar(receta.recipeId, '?expectedVersion=v1').expect(409);
  await retirar(ajeno, '?expectedVersion=v1').expect(404);
  const conImagen = (await pro.put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: imagen.mediaId, expectedVersion: asociada.version }).expect(200)).body.data;
  await retirar(receta.recipeId, `?expectedVersion=${conImagen.version}`).expect(200);
  // MED-03 · MED-04
  const acceso = (await pro.get(`/api/v1/media/${imagen.mediaId}/access`).expect(200)).body.data;
  await pro.get(`/api/v1/media/${ajeno}/access`).expect(404);
  await pro.get(`/api/v1/media/${imagen.mediaId}/access?x=1`).expect(400);
  await leerContenido(app, acceso.path).expect(200);
  await leerContenido(app, '/media/content/no.es-una-ruta').expect(404);
  await leerContenido(app, `${acceso.path}?x=1`).expect(400);
  // El plan con la receta: NUT-10 la acepta como opción y la activación la congela.
  const borrador = await crearBorrador(app, c);
  const conReceta = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${borrador.planId}`)
    .send({ expectedVersion: borrador.version, changes: estructuraConRecetas([{ label: conImagen.name, recipeVersionId: conImagen.recipeVersionId }], c.pollo) })
    .expect(200);
  await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${borrador.planId}`)
    .send({ expectedVersion: conReceta.body.data.version, changes: estructuraConRecetas([{ label: 'Inexistente', recipeVersionId: ajeno }], c.pollo) })
    .expect(422); // NUTRITION_PLAN_STRUCTURE_INVALID
  await pro.post('/api/v1/nutrition/plan-templates').send({ name: 'Plantilla con receta', structure: estructuraConRecetas([{ label: 'R', recipeVersionId: conImagen.recipeVersionId }], c.pollo) }).expect(422);
  await activar(app, c.pro, borrador.planId, conReceta.body.data.version).expect(200);
  // ING-01
  const hoy = (await ase.get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
  await ase.get('/api/v1/me/nutrition/today/options?otro=1').expect(400);
  const sinA3 = await prepararAsesorado(app, 'contrato-ing-sin-a3');
  await conSesion(app, sinA3.token).get('/api/v1/me/nutrition/today/options').expect(403);
  // ING-02
  const dia = hoy.dayTypes[0].dayTypeId as string;
  const almuerzo = hoy.meals[0];
  const ahora = new Date().toISOString();
  const registro = (extra: Record<string, unknown>, clave?: string) =>
    ase.post('/api/v1/me/nutrition/meal-records', clave).send({ kind: 'PLAN_OPTION', activePlanId: borrador.planId, dayTypeId: dia, mealId: almuerzo.mealId, optionId: almuerzo.options[0].optionId, occurredAt: ahora, consumption: { status: 'UNCONFIRMED' }, observation: null, ...extra });
  const claveDeRegistro = claveDeIdempotencia();
  const registrado = (await registro({}, claveDeRegistro).expect(201)).body.data;
  await registro({}).expect(200); // equivalente
  await registro({ consumption: { status: 'PLAN_PORTIONS' } }).expect(409); // EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY
  await registro({ consumption: { status: 'PLAN_PORTIONS' } }, claveDeRegistro).expect(409); // IDEMPOTENCY_KEY_REUSED
  await registro({ activePlanId: ajeno }).expect(404);
  await registro({ optionId: ajeno }).expect(422); // NUTRITION_EXECUTION_INVALID
  await registro({ kind: 'DIFFERENT', approximateQuantity: null, mediaIds: [ajeno], description: 'x', optionId: undefined, consumption: undefined, observation: undefined, mealId: null, dayTypeId: null }).expect(422); // MEDIA_REFERENCE_INVALID
  await registro({ kind: 'DIFFERENT', approximateQuantity: null, description: null, mediaIds: [], optionId: undefined, consumption: undefined, observation: undefined, mealId: null, dayTypeId: null }).expect(400);
  // ING-03 · ING-04
  await ase.get(`/api/v1/nutrition/meal-records/${registrado.recordId}`).expect(200);
  await ase.get(`/api/v1/nutrition/meal-records/${ajeno}`).expect(404);
  await ase.get(`/api/v1/nutrition/meal-records/${registrado.recordId}?x=1`).expect(400);
  await ase.get('/api/v1/me/nutrition/meal-records?from=2026-01-01').expect(200);
  await ase.get('/api/v1/me/nutrition/meal-records?from=ayer').expect(400);
  await ase.get('/api/v1/me/nutrition/meal-records?cursor=zz').expect(400); // INVALID_CURSOR
  await conSesion(app, sinA3.token).get('/api/v1/me/nutrition/meal-records').expect(403);
  // ING-05
  const rectificar = (id: string, extra: Record<string, unknown>) => ase.post(`/api/v1/nutrition/meal-records/${id}/consumed-quantities`).send({ consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: 'v1', ...extra });
  const rectificado = (await rectificar(registrado.recordId, {}).expect(201)).body.data;
  await rectificar(registrado.recordId, {}).expect(409); // VERSION_CONFLICT
  await rectificar(registrado.recordId, { expectedVersion: rectificado.version, consumption: { status: 'REPORTED', items: [{ itemId: ajeno, quantity: null, notEaten: true }] } }).expect(422);
  await rectificar(ajeno, {}).expect(404);
  // ING-06
  const anular = (id: string, expectedVersion: string) => ase.post(`/api/v1/nutrition/meal-records/${id}/annulment`).send({ reason: null, expectedVersion });
  await anular(registrado.recordId, 'v1').expect(409); // VERSION_CONFLICT
  const anulado = (await anular(registrado.recordId, rectificado.version).expect(201)).body.data;
  await anular(registrado.recordId, anulado.version).expect(409); // INVALID_STATE_TRANSITION
  await rectificar(registrado.recordId, { expectedVersion: anulado.version }).expect(409); // INVALID_STATE_TRANSITION
  await anular(ajeno, 'v1').expect(404);
  // ING-02 después de deshacer: 201 otra vez; con un plan que ya no es el vigente, ACTIVE_PLAN_REQUIRED.
  await registro({ consumption: { status: 'PLAN_PORTIONS' } }).expect(201);
  // MED-05
  const foto = (await subirImagen(app, c.ase, FOTOS[2]!, { contentType: 'image/png', purpose: 'MEAL_EVIDENCE' })).mediaId;
  const claveDeSupresion = claveDeIdempotencia();
  const suprimir = (id: string, clave = claveDeIdempotencia()) => request(servidor).delete(`/api/v1/me/media/${id}`).set('Authorization', `Bearer ${c.ase.token}`).set('Idempotency-Key', clave);
  await suprimir(foto, claveDeSupresion).expect(200);
  await suprimir(ajeno, claveDeSupresion).expect(409); // IDEMPOTENCY_KEY_REUSED
  await suprimir(ajeno).expect(404);
  await request(servidor).delete(`/api/v1/me/media/${foto}`).set('Authorization', `Bearer ${c.ase.token}`).expect(400); // sin clave
  // ACTIVE_PLAN_REQUIRED: el profesional activa una sucesora y el pedido cita la anterior.
  const sucesora = await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: borrador.planId }).expect(201);
  await activar(app, c.pro, sucesora.body.data.planId, sucesora.body.data.version).expect(200);
  await registro({ kind: 'DIFFERENT', approximateQuantity: null, description: 'Con el plan anterior', mediaIds: [], optionId: undefined, consumption: undefined, observation: undefined, mealId: null, dayTypeId: null }).expect(422);
});

it('TEST-CT (WP-ENTRENAMIENTO-SERIES): las 9 operaciones SER, TIE y EJE, y MED con la imagen de un ejercicio, con éxitos y errores declarados', async () => {
  // El titular todavía no usó la APK que muestra los objetivos por serie: TRN-12 responde su 409 declarado (DL-122).
  const plan = await borradorDeLaDemo(app, 'contrato-series', [], { apk: false });
  const pro = conSesion(app, plan.pro.token);
  const ase = conSesion(app, plan.ase.token);
  const servidor = app.getHttpServer();
  const ajeno = randomUUID();
  const imagen = IMAGENES_DEL_PAQUETE.find((i) => i.fixtureKey === SESION_DEMO.exercises[0]!.catalogFixtureKey)!;
  const ejercicio = plan.ejercicios.get(imagen.fixtureKey)!;

  // MED-01 · MED-02 con EXERCISE_REFERENCE
  const subida = await subirImagenDeEjercicio(app, plan.pro, imagen);
  const intencion = { purpose: 'EXERCISE_REFERENCE', contentType: 'image/png', byteSize: 100, provenance: 'AI_GENERATED', authorship: 'Autoría declarada' };
  await pro.post('/api/v1/me/media/upload-intents').send({ ...intencion, authorship: null }).expect(422); // VALIDATION_FAILED
  await ase.post('/api/v1/me/media/upload-intents').send(intencion).expect(403);
  // EJE-01
  await pro.get('/api/v1/training/own-exercises').expect(200);
  await ase.get('/api/v1/training/own-exercises').expect(403);
  await request(servidor).get('/api/v1/training/own-exercises').expect(401);
  // EJE-02
  const cuerpo = cuerpoDeImagen(imagen, ejercicio.versionId, subida.mediaId, 0);
  const claveDeImagen = claveDeIdempotencia();
  await asociarImagen(app, plan.pro, ejercicio.exerciseId, cuerpo, claveDeImagen).expect(200);
  await asociarImagen(app, plan.pro, ejercicio.exerciseId, cuerpo, claveDeImagen).expect(200); // reintento
  await asociarImagen(app, plan.pro, ejercicio.exerciseId, { ...cuerpo, altText: 'Otro texto' }, claveDeImagen).expect(409); // IDEMPOTENCY_KEY_REUSED
  await asociarImagen(app, plan.pro, ejercicio.exerciseId, cuerpo).expect(409); // VERSION_CONFLICT
  await asociarImagen(app, plan.pro, ejercicio.exerciseId, { ...cuerpo, expectedImageVersion: 1, exerciseVersionId: ajeno }).expect(422); // EXERCISE_REFERENCE_INVALID
  await asociarImagen(app, plan.pro, ejercicio.exerciseId, { ...cuerpo, expectedImageVersion: 1, mediaId: ajeno }).expect(422); // MEDIA_REFERENCE_INVALID
  await asociarImagen(app, plan.pro, ajeno, cuerpo).expect(404);
  await asociarImagen(app, plan.pro, ejercicio.exerciseId, { ...cuerpo, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await asociarImagen(app, plan.ase, ejercicio.exerciseId, { ...cuerpo, expectedImageVersion: 1 }).expect(403);
  await request(servidor).put(`/api/v1/training/exercises/${ejercicio.exerciseId}/image`).set('Authorization', `Bearer ${plan.pro.token}`).send(cuerpo).expect(400); // sin clave
  // SER-01
  await pro.get(`/api/v1/training/plans/${plan.planId}/detail`).expect(200);
  await pro.get(`/api/v1/training/plans/${ajeno}/detail`).expect(404);
  await pro.get(`/api/v1/training/plans/${plan.planId}/detail?x=1`).expect(400);
  await ase.get(`/api/v1/training/plans/${plan.planId}/detail`).expect(404);
  await request(servidor).get(`/api/v1/training/plans/${plan.planId}/detail`).expect(401);
  // SER-02 y MED-03 de la imagen de un ejercicio, con el plan activado
  await activarLaDemo(app, plan).expect(409); // CLIENT_CAPABILITY_REQUIRED
  await usarLaApk(app, plan.ase);
  await activarLaDemo(app, plan).expect(200);
  const ocurrencia = await ocurrenciaDeHoy(app, plan.ase);
  await ase.get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200);
  await ase.get('/api/v1/training/occurrences/occ_no-es-una-ocurrencia/session').expect(404);
  await pro.get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(404);
  await ase.get(`/api/v1/training/occurrences/${ocurrencia}/session?x=1`).expect(400);
  await ase.get(`/api/v1/media/${subida.mediaId}/access`).expect(200);
  await conSesion(app, (await prepararProfesional(app, 'contrato-series-otro', ['ENTRENAMIENTO'])).token).get(`/api/v1/media/${subida.mediaId}/access`).expect(404);
  // TIE-01 · TIE-02 · TIE-04
  const borrador = await abrirBorrador(app, plan.ase, ocurrencia);
  const eventos = corrida(pasosDelEjemplo(prescripcionIdDe(SESION_DEMO.exercises[0]!), prescripcionIdDe(SESION_DEMO.exercises[1]!)), Date.now() - 60 * 60 * 1000, 'corrida-del-contrato');
  await mandarEventos(app, plan.ase, borrador.draftId, eventos.slice(0, 3)).expect(200);
  await ase.get('/api/v1/me/training/session-in-progress').expect(200);
  await request(servidor).get('/api/v1/me/training/session-in-progress').expect(401);
  await mandarEventos(app, plan.ase, borrador.draftId, eventos).expect(200); // los primeros son DUPLICATE
  await mandarEventos(app, plan.ase, ajeno, eventos).expect(404);
  await mandarEventos(app, plan.pro, borrador.draftId, eventos).expect(404);
  await mandarEventos(app, plan.ase, borrador.draftId, []).expect(400); // INVALID_REQUEST
  const eventosDe = (ruta: string, cuerpoDeEventos: unknown, token?: string) => {
    const r = request(servidor).post(ruta);
    return (token ? r.set('Authorization', `Bearer ${token}`) : r).send(cuerpoDeEventos as object);
  };
  await eventosDe(`/api/v1/training/execution-drafts/${borrador.draftId}/timing-events`, { events: eventos, extra: 1 }, plan.ase.token).expect(400); // UNKNOWN_FIELD
  await eventosDe(`/api/v1/training/execution-drafts/${borrador.draftId}/timing-events?x=1`, { events: eventos }, plan.ase.token).expect(400);
  await eventosDe(`/api/v1/training/execution-drafts/${borrador.draftId}/timing-events`, { events: eventos }).expect(401);
  await ase.get(`/api/v1/training/execution-drafts/${borrador.draftId}/timing`).expect(200);
  await pro.get(`/api/v1/training/execution-drafts/${borrador.draftId}/timing`).expect(404);
  await ase.get(`/api/v1/training/execution-drafts/${borrador.draftId}/timing?x=1`).expect(400);
  // TIE-03
  const { executionId } = await registrarYConfirmar(app, plan, borrador);
  await pro.get(`/api/v1/training/executions/${executionId}/timing`).expect(200);
  await ase.get(`/api/v1/training/executions/${executionId}/timing`).expect(200);
  await pro.get(`/api/v1/training/executions/${ajeno}/timing`).expect(404);
  await pro.get(`/api/v1/training/executions/${executionId}/timing?x=1`).expect(400);
  // EJE-03
  const claveDeRetiro = claveDeIdempotencia();
  await retirarImagen(app, plan.pro, ejercicio.exerciseId, '').expect(400);
  await retirarImagen(app, plan.pro, ejercicio.exerciseId, '?expectedImageVersion=5').expect(409); // VERSION_CONFLICT
  await retirarImagen(app, plan.pro, ajeno, '?expectedImageVersion=1').expect(404);
  await retirarImagen(app, plan.ase, ejercicio.exerciseId, '?expectedImageVersion=1').expect(403);
  await retirarImagen(app, plan.pro, ejercicio.exerciseId, '?expectedImageVersion=1', claveDeRetiro).expect(200);
  await retirarImagen(app, plan.pro, ejercicio.exerciseId, '?expectedImageVersion=1', claveDeRetiro).expect(200); // reintento
  await retirarImagen(app, plan.pro, ejercicio.exerciseId, '?expectedImageVersion=2', claveDeRetiro).expect(409); // IDEMPOTENCY_KEY_REUSED
  await conSesion(app, plan.pro.token).delete(`/api/v1/training/exercises/${ejercicio.exerciseId}/image?expectedImageVersion=2`).set('Idempotency-Key', claveDeIdempotencia()).send({ extra: 1 }).expect(400); // UNKNOWN_FIELD
  // Un parámetro desconocido en TIE-04 y EJE-01: 400 INVALID_REQUEST.
  await ase.get('/api/v1/me/training/session-in-progress?x=1').expect(400);
  await pro.get('/api/v1/training/own-exercises?x=1').expect(400);
  // Revocado el A3, la historia del titular (SER-02 de una sesión registrada y TIE-03) es 403; la sesión en curso no
  // ofrece ninguna (200), y dejar incompleta una corrida vuelve al PDP, que la deniega (404).
  await ase.post(`/api/v1/me/health-data-consents/${await a3Vigente(app, plan.ase.token)}/revoke`).send({}).expect(200);
  await ase.get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(403);
  await ase.get(`/api/v1/training/executions/${executionId}/timing`).expect(403);
  // REV-A (DL-134): sin A3 vigente, las revisiones propias tampoco se leen (403), como «Tu historial».
  await ase.get('/api/v1/me/training/reviews').expect(403);
  await ase.get('/api/v1/me/nutrition/reviews').expect(403);
  expect((await ase.get('/api/v1/me/training/session-in-progress').expect(200)).body.data.inProgress).toBeNull();
  const cierre = corrida([{ s: 950, evento: { type: 'SESSION_FINISHED', resolution: 'LEFT_INCOMPLETE' } }], Date.now() - 60 * 60 * 1000, 'corrida-del-contrato', eventos.length + 1);
  await mandarEventos(app, plan.ase, borrador.draftId, cierre).expect(404);
});

it('TEST-CT (WP-CATALOGO-VISUAL): ZON-01, EJE-04 y EJE-05, con éxitos y errores declarados', async () => {
  const proParte = await prepararProfesional(app, 'contrato-zonas', ['ENTRENAMIENTO']);
  const pro = conSesion(app, proParte.token);
  const ase = conSesion(app, (await prepararAsesorado(app, 'contrato-zonas', { a3: true })).token);
  const otro = conSesion(app, (await prepararProfesional(app, 'contrato-zonas-otro', ['ENTRENAMIENTO'])).token);
  const servidor = app.getHttpServer();
  // ZON-01
  await pro.get('/api/v1/training/muscle-zones').expect(200);
  await pro.get('/api/v1/training/muscle-zones?vista=ANTERIOR').expect(400); // INVALID_REQUEST
  await request(servidor).get('/api/v1/training/muscle-zones').expect(401);
  // EJE-04
  const creado = (await pro.post('/api/v1/training/exercises').send({ name: 'Ejercicio con zonas del contrato', muscleZones: [{ zoneId: 'pectoral', role: 'PRIMARY' }], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body.data;
  const ruta = `/api/v1/training/exercises/${creado.exerciseId}/muscle-zones`;
  const cuerpo = { exerciseVersionId: creado.versionId, expectedZonesVersion: 1, muscleZones: [{ zoneId: 'pectoral', role: 'PRIMARY' }, { zoneId: 'triceps', role: 'SECONDARY' }] };
  const clave = claveDeIdempotencia();
  await pro.put(ruta, clave).send(cuerpo).expect(200);
  await pro.put(ruta, clave).send(cuerpo).expect(200); // reintento
  await pro.put(ruta, clave).send({ ...cuerpo, muscleZones: [] }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.put(ruta).send(cuerpo).expect(409); // VERSION_CONFLICT
  await pro.put(ruta).send({ ...cuerpo, expectedZonesVersion: 2, exerciseVersionId: randomUUID() }).expect(422); // EXERCISE_REFERENCE_INVALID
  await pro.put(ruta).send({ ...cuerpo, expectedZonesVersion: 2, muscleZones: [{ zoneId: 'pecho', role: 'PRIMARY' }] }).expect(422); // VALIDATION_FAILED
  await pro.put(ruta).send({ ...cuerpo, expectedZonesVersion: 2, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await pro.put(`${ruta}?x=1`).send({ ...cuerpo, expectedZonesVersion: 2 }).expect(400); // INVALID_REQUEST
  await otro.put(ruta).send({ ...cuerpo, expectedZonesVersion: 2 }).expect(404);
  await ase.put(ruta).send({ ...cuerpo, expectedZonesVersion: 2 }).expect(403);
  await request(servidor).put(ruta).set('Authorization', `Bearer ${proParte.token}`).send(cuerpo).expect(400); // sin clave
  await request(servidor).put(ruta).send(cuerpo).expect(401);
  // EJE-05
  await pro.post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [creado.exerciseId, '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01'] }).expect(200);
  await pro.post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [] }).expect(400); // INVALID_REQUEST
  await pro.post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [creado.exerciseId], extra: 1 }).expect(400); // UNKNOWN_FIELD
  await ase.post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [creado.exerciseId] }).expect(403);
  await request(servidor).post('/api/v1/training/exercises/visual-sheets').send({ exerciseIds: [creado.exerciseId] }).expect(401);
});

it('TEST-CT (DL-125): EVIDENCIA_VISUAL — EVI-01 a 04, y MED-01 con la exigencia activa', async () => {
  const c = await circuitoListoParaPlanificar(app, 'contrato-ev');
  const ase = conSesion(app, c.ase.token);
  const pro = conSesion(app, c.pro.token);
  const servidor = app.getHttpServer();
  const version = VERSION_VIGENTE.EVIDENCIA_VISUAL.id;
  const requisito = `/api/v1/relationships/${c.vinculoId}/visual-evidence-requirement`;
  const actos = `/api/v1/relationships/${c.vinculoId}/visual-evidence-consents`;
  // EVI-01
  await ase.get(requisito).expect(200);
  await ase.get(`${requisito}?x=1`).expect(400);
  await pro.get(requisito).expect(404);
  await request(servidor).get(requisito).expect(401);
  // EVI-02
  const clave = claveDeIdempotencia();
  const acto = (await ase.post(actos, clave).send({ consentVersionId: version }).expect(201)).body.data;
  await ase.post(actos, clave).send({ consentVersionId: 'otra-version' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await ase.post(actos).send({ consentVersionId: version }).expect(200); // ya vigente con esa versión
  await ase.post(actos).send({ consentVersionId: 'acceso-profesional-sanitario-2026-09-demo' }).expect(409); // CONSENT_VERSION_STALE
  await ase.post(actos).send({ consentVersionId: version, professionalId: c.pro.id }).expect(400); // UNKNOWN_FIELD
  await pro.post(actos).send({ consentVersionId: version }).expect(404);
  // EVI-03
  await ase.get('/api/v1/me/visual-evidence-consents?limit=5').expect(200);
  await ase.get('/api/v1/me/visual-evidence-consents?cursor=basura').expect(400); // INVALID_CURSOR
  // EVI-04
  await pro.post(`/api/v1/me/visual-evidence-consents/${acto.consentId}/revoke`).send({}).expect(404);
  await ase.post(`/api/v1/me/visual-evidence-consents/${acto.consentId}/revoke`).send({ extra: 1 }).expect(400);
  await ase.post(`/api/v1/me/visual-evidence-consents/${acto.consentId}/revoke`).send({}).expect(200);
  // Sin B2 vigente no se registra: 422.
  await ase.post(`/api/v1/me/consents/${c.consentId}/revoke`).send({}).expect(200);
  await ase.post(actos).send({ consentVersionId: version }).expect(422); // RELATIONSHIP_NOT_READY_FOR_CONSENT
  // MED-01 con la exigencia activa: sin plan vigente, 422; con plan y sin el acto, 403 con su detalle.
  const conExigencia = await appDePrueba({ evidenciaVisualExigida: true }, observar);
  try {
    const intencion = (token: string) =>
      conSesion(conExigencia, token).post('/api/v1/me/media/upload-intents').send({ purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: 20_000, provenance: 'PERSON_PROVIDED', authorship: null });
    const sinPlan = await prepararAsesorado(conExigencia, 'contrato-ev-sin-plan', { a3: true });
    await intencion(sinPlan.token).expect(422); // ACTIVE_PLAN_REQUIRED
    const conPlan = await circuitoConPlanActivo(conExigencia, 'contrato-ev-plan');
    await intencion(conPlan.ase.token).expect(403); // VISUAL_EVIDENCE_ACT_REQUIRED
  } finally {
    await conExigencia.close();
  }
});

it('TEST-CT (WP-DASHBOARD-PROFESIONAL): DSH-04, DSH-04-BUSQUEDA, PRJ-01 y VAN-01 a 04, con éxitos y errores declarados', async () => {
  const c = await circuitoConPlanActivo(app, 'contrato-dash');
  const pro = conSesion(app, c.pro.token);
  const tercero = conSesion(app, (await prepararProfesional(app, 'contrato-dash-tercero', ['NUTRICION'])).token);
  const servidor = app.getHttpServer();
  // DSH-04: la línea de tiempo; sin vínculo, el mismo 404 que un asesorado inexistente.
  const linea = `/api/v1/advisees/${c.ase.id}/timeline`;
  await pro.get(`${linea}?limit=5`).expect(200);
  await pro.get(`${linea}?x=1`).expect(400); // INVALID_REQUEST: parámetro desconocido
  await pro.get(`${linea}?periodStart=2026-10-09&periodEnd=2026-10-01`).expect(400); // INVALID_REQUEST: período invertido
  await pro.get(`${linea}?cursor=basura`).expect(400); // INVALID_CURSOR
  await pro.get(`${linea}?q=cena`).expect(400); // INVALID_REQUEST: el texto ya no va en la URL (DL-127)
  // Extensión aditiva: el corte de una revisión (`since`) trae sus conteos; un instante mal formado es 400.
  await pro.get(`${linea}?since=2026-09-20T15:00:00.000Z&limit=5`).expect(200);
  await pro.get(`${linea}?since=ayer`).expect(400); // INVALID_REQUEST: INVALID_FILTER
  await tercero.get(linea).expect(404);
  await request(servidor).get(linea).expect(401);
  // DSH-04-BUSQUEDA: la búsqueda con el texto en el cuerpo; mismos errores que la consulta, y UNKNOWN_FIELD.
  const busqueda = `${linea}/search`;
  await pro.post(busqueda).send({ q: 'cena', limit: 5 }).expect(200);
  await pro.post(busqueda).send({ q: 'cena', since: '2026-09-20T15:00:00.000Z' }).expect(200);
  await pro.post(busqueda).send({ q: 'cena', orden: 'asc' }).expect(400); // UNKNOWN_FIELD
  await pro.post(busqueda).send({ q: '' }).expect(400); // INVALID_REQUEST: texto vacío
  await pro.post(busqueda).send({ q: 'cena', cursor: 'basura' }).expect(400); // INVALID_CURSOR
  await tercero.post(busqueda).send({ q: 'cena' }).expect(404);
  await request(servidor).post(busqueda).send({ q: 'cena' }).expect(401);
  // PRJ-01: una clave derivada, una sin especificación (200 con INSUFFICIENT_INFORMATION) y una de un alcance que este
  // profesional no tiene con el asesorado (200 con NOT_AVAILABLE_TO_VIEW).
  const proyeccion = (clave: string) => `/api/v1/advisees/${c.ase.id}/projections/${clave}`;
  await pro.get(`${proyeccion('NUTRITION_PRESCRIBED_VS_RECORDED')}?metric=ENERGY`).expect(200);
  await pro.get(proyeccion('TRAINING_PERSONAL_RECORDS')).expect(200);
  await pro.get(proyeccion('TRAINING_PROGRESSION_BY_EXERCISE')).expect(200);
  await pro.get(proyeccion('NO_EXISTE')).expect(400); // INVALID_REQUEST: clave fuera de la taxonomía
  await pro.get(`${proyeccion('NUTRITION_PRESCRIBED_VS_RECORDED')}?metric=ENERGY&setIndex=1`).expect(400); // parámetro que no aplica
  await tercero.get(proyeccion('NUTRITION_PRESCRIBED_VS_RECORDED')).expect(404);
  await request(servidor).get(proyeccion('NUTRITION_PRESCRIBED_VS_RECORDED')).expect(401);
  // VAN-01 a 04: las vistas guardadas, solo de profesionales.
  const vistas = '/api/v1/me/analysis-views';
  const configuracion = {
    schemaVersion: 1,
    metrics: [{ metricId: 'nutricion.energia', exerciseKey: null, setIndex: null, unit: null }],
    mode: 'PANELS',
    grain: 'DAY',
    period: { kind: 'LAST_DAYS', days: 30 },
    layers: { planBands: true, events: false },
    reference: { kind: 'FIRST_DAYS', days: 7 },
    comparison: null,
  };
  const indicadores = { schemaVersion: 1, metrics: [{ metricId: 'nutricion.energia', exerciseKey: null, setIndex: null, unit: null }] };
  const clave = claveDeIdempotencia();
  const vista = (await pro.post(vistas, clave).send({ usage: 'ANALYSIS', name: 'Contrato', configuration: configuracion }).expect(201)).body.data;
  await pro.post(vistas, clave).send({ usage: 'ANALYSIS', name: 'Otra', configuration: configuracion }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pro.post(vistas).send({ usage: 'ANALYSIS', name: 'Con datos', configuration: { ...configuracion, adviseeId: c.ase.id } }).expect(400); // UNKNOWN_FIELD
  await pro.post(vistas).send({ usage: 'SUMMARY_INDICATORS', name: 'Indicadores', configuration: indicadores }).expect(201);
  await pro.post(vistas).send({ usage: 'SUMMARY_INDICATORS', name: 'Otros', configuration: indicadores }).expect(409); // RESOURCE_CONFLICT
  await conSesion(app, c.ase.token).post(vistas).send({ usage: 'ANALYSIS', name: 'Mía', configuration: configuracion }).expect(403);
  await pro.get(vistas).expect(200);
  await pro.get(`${vistas}?x=1`).expect(400);
  await conSesion(app, c.ase.token).get(vistas).expect(403);
  await request(servidor).get(vistas).expect(401);
  const ruta = `${vistas}/${vista.viewId}`;
  await pro.put(ruta).send({ expectedVersion: vista.version, name: 'Contrato 2', configuration: configuracion }).expect(200);
  await pro.put(ruta).send({ expectedVersion: vista.version, name: 'Vieja', configuration: configuracion }).expect(409); // VERSION_CONFLICT
  await pro.put(ruta).send({ expectedVersion: 'v2', name: 'Indicadores', configuration: indicadores }).expect(422); // CONFIGURATION_USAGE_MISMATCH
  await tercero.put(ruta).send({ expectedVersion: 'v2', name: 'Ajena', configuration: configuracion }).expect(404);
  await tercero.delete(ruta).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
  await pro.delete(`${ruta}?x=1`).set('Idempotency-Key', claveDeIdempotencia()).expect(400);
  await pro.delete(ruta).set('Idempotency-Key', claveDeIdempotencia()).expect(204);
});

it('TEST-CT (WP-NOVEDADES-Y-AVISOS): NOV-01 a 06, con éxitos y errores declarados', async () => {
  const c = await circuitoConPlanActivo(app, 'contrato-nov');
  const ase = conSesion(app, c.ase.token);
  const pro = conSesion(app, c.pro.token);
  const servidor = app.getHttpServer();
  // NOV-01: las propias; la activación del plan ya dejó una.
  const lista = (await ase.get('/api/v1/me/news?limit=5').expect(200)).body;
  await ase.get('/api/v1/me/news?x=1').expect(400); // INVALID_REQUEST
  await ase.get('/api/v1/me/news?cursor=basura').expect(400); // INVALID_CURSOR
  await request(servidor).get('/api/v1/me/news').expect(401);
  // NOV-02: abrir una propia; la de otro es el mismo 404 que una inexistente.
  const id = lista.data[0].newsId as string;
  await ase.get(`/api/v1/me/news/${id}`).expect(200);
  await ase.get(`/api/v1/me/news/${id}?x=1`).expect(400);
  await pro.get(`/api/v1/me/news/${id}`).expect(404);
  // NOV-03 y 04: un teléfono.
  // Un teléfono nuevo en cada corrida: el contrato no depende de lo que dejó otra en la misma base.
  const telefono = randomUUID();
  const suscripcion = `/api/v1/me/push-subscriptions/${telefono}`;
  await ase.put(suscripcion).send({ expoPushToken: 'ExponentPushToken[contrato-sintetico-1]', platform: 'ANDROID' }).expect(200);
  await ase.put(suscripcion).send({ expoPushToken: 'no-es-un-token', platform: 'ANDROID' }).expect(400); // INVALID_REQUEST
  await ase.put(suscripcion).send({ expoPushToken: 'ExponentPushToken[contrato-sintetico-1]', platform: 'ANDROID', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await ase.put('/api/v1/me/push-subscriptions/no-es-un-uuid').send({ expoPushToken: 'ExponentPushToken[contrato-sintetico-1]', platform: 'ANDROID' }).expect(400);
  await ase.delete(`${suscripcion}?x=1`).expect(400);
  await ase.delete(suscripcion).expect(204);
  await ase.delete(suscripcion).expect(204);
  await request(servidor).delete(suscripcion).expect(401);
  // NOV-05 y 06: las preferencias de los recordatorios.
  const preferencias = '/api/v1/me/notification-preferences';
  await ase.get(preferencias).expect(200);
  await ase.get(`${preferencias}?x=1`).expect(400);
  await ase.put(preferencias).send({ mealLogReminder: true, trainingLogReminder: false }).expect(200);
  await ase.put(preferencias).send({ mealLogReminder: true, trainingLogReminder: false, otro: true }).expect(400); // UNKNOWN_FIELD
  await ase.put(preferencias).send({ mealLogReminder: 'sí', trainingLogReminder: false }).expect(400); // INVALID_REQUEST
  await request(servidor).put(preferencias).send({ mealLogReminder: true, trainingLogReminder: true }).expect(401);
});

it('TEST-CT (WP-INVITACION): INV-01 a 05, con éxitos y errores declarados', async () => {
  const servidor = app.getHttpServer();
  const pro = await prepararProfesional(app, 'ct-inv', ['NUTRICION']);
  const ase = await prepararAsesorado(app, 'ct-inv');
  const otra = await prepararAsesorado(app, 'ct-inv-2');
  const p = conSesion(app, pro.token);
  const a = conSesion(app, ase.token);
  const o = conSesion(app, otra.token);
  const cuerpo = { scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' };
  const crear = async () => (await p.post('/api/v1/relationship-invitations').send(cuerpo).expect(201)).body.data as { invitationId: string; token: string; code: string };
  const ver = (token: string, secreto: Record<string, unknown>) =>
    request(servidor).post('/api/v1/relationship-invitations/preview').set('Authorization', `Bearer ${token}`).send(secreto);

  // INV-01
  const clave = claveDeIdempotencia();
  const inv = (await p.post('/api/v1/relationship-invitations', clave).send(cuerpo).expect(201)).body.data as { invitationId: string; token: string; code: string };
  await p.post('/api/v1/relationship-invitations', clave).send({ scope: { code: 'NUTRICION' }, purpose: 'otra' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await p.post('/api/v1/relationship-invitations').send({ ...cuerpo, adviseeId: ase.id }).expect(400); // UNKNOWN_FIELD
  await p.post('/api/v1/relationship-invitations').send({ scope: 'NUTRICION' }).expect(400); // INVALID_REQUEST
  await p.post('/api/v1/relationship-invitations').send({ scope: { code: 'ENTRENAMIENTO' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' }).expect(422); // SCOPE_NOT_AVAILABLE
  await p.post('/api/v1/relationship-invitations').send({ scope: { code: 'NUTRICION' }, purpose: '' }).expect(422); // PURPOSE_REQUIRED
  await p.post('/api/v1/relationship-invitations').send({ scope: { code: 'NUTRICION' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' }).expect(422); // VALIDATION_FAILED
  await request(servidor).post('/api/v1/relationship-invitations').set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo).expect(401);

  // INV-02
  await p.get('/api/v1/relationship-invitations?state=PENDING&limit=5').expect(200);
  await p.get('/api/v1/relationship-invitations?x=1').expect(400); // INVALID_REQUEST
  await p.get('/api/v1/relationship-invitations?cursor=basura').expect(400); // INVALID_CURSOR
  await request(servidor).get('/api/v1/relationship-invitations').expect(401);

  // INV-04
  await ver(ase.token, { code: inv.code }).expect(200);
  await ver(ase.token, { code: 'no-es-un-codigo' }).expect(404);
  await ver(ase.token, { token: inv.token, otro: 1 }).expect(400);
  await request(servidor).post('/api/v1/relationship-invitations/preview').send({ token: inv.token }).expect(401);

  // INV-05
  await a.post('/api/v1/relationship-invitations/claim').send({ code: 'no-es-un-codigo' }).expect(404);
  await p.post('/api/v1/relationship-invitations/claim').send({ token: inv.token }).expect(422); // COUNTERPART_NOT_ELIGIBLE
  const claveDeUso = claveDeIdempotencia();
  const creada = await a.post('/api/v1/relationship-invitations/claim', claveDeUso).send({ token: inv.token }).expect(201);
  await a.post('/api/v1/relationship-invitations/claim', claveDeUso).send({ code: inv.code }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await o.post('/api/v1/relationship-invitations/claim').send({ token: inv.token }).expect(422); // INVITATION_USED
  await a.post('/api/v1/relationship-invitations/claim').send({ token: inv.token, code: inv.code }).expect(400); // INVALID_REQUEST
  await request(servidor).post('/api/v1/relationship-invitations/claim').set('Authorization', `Bearer ${ase.token}`).send({ token: inv.token }).expect(400); // sin key
  await request(servidor).post('/api/v1/relationship-invitations/claim').set('Idempotency-Key', claveDeIdempotencia()).send({ token: inv.token }).expect(401);
  // 200: la equivalente pendiente (REG-06-44).
  const segunda = await crear();
  await solicitar(app, pro, otra.id, 'NUTRICION').expect(201);
  await o.post('/api/v1/relationship-invitations/claim').send({ token: segunda.token }).expect(200);
  // 409 RESOURCE_CONFLICT: con un vínculo vigente en ese alcance, como REL-01.
  await aceptar(app, ase, creada.body.data.relationshipRequestId as string).expect(200);
  const tercera = await crear();
  await a.post('/api/v1/relationship-invitations/claim').send({ token: tercera.token }).expect(409);

  // INV-03
  const claveDeAnular = claveDeIdempotencia();
  await p.post(`/api/v1/relationship-invitations/${tercera.invitationId}/revoke`, claveDeAnular).send({}).expect(200);
  await p.post(`/api/v1/relationship-invitations/${segunda.invitationId}/revoke`, claveDeAnular).send({}).expect(409); // IDEMPOTENCY_KEY_REUSED
  await p.post(`/api/v1/relationship-invitations/${tercera.invitationId}/revoke`).send({}).expect(422); // INVITATION_REVOKED
  await p.post(`/api/v1/relationship-invitations/${inv.invitationId}/revoke`).send({}).expect(422); // INVITATION_USED
  await a.post(`/api/v1/relationship-invitations/${tercera.invitationId}/revoke`).send({}).expect(404);
  await p.post(`/api/v1/relationship-invitations/${tercera.invitationId}/revoke`).send({ motivo: 'x' }).expect(400); // UNKNOWN_FIELD
  await request(servidor).post(`/api/v1/relationship-invitations/${tercera.invitationId}/revoke`).set('Idempotency-Key', claveDeIdempotencia()).send({}).expect(401);
  await o.post('/api/v1/relationship-invitations/claim').send({ token: tercera.token }).expect(422); // INVITATION_REVOKED
  // Vencida: escrita directo en la base (la tabla solo admite agregar), con la vigencia máxima ya cumplida.
  const vencidaId = randomUUID();
  const tokenVencido = randomBytes(32).toString('base64url');
  // La misma huella con clave que guarda la API (DL-136 D-4), con el secreto de firma del entorno de prueba.
  const sha = (t: string) => huellaDeSecretoDeInvitacion(entornoDePrueba().jwtSecret, t);
  await prisma.$executeRaw`
    INSERT INTO "invitacion_de_vinculo" ("id", "profesional_id", "alcance", "finalidad", "hash_del_token", "hash_del_codigo", "procedencia", "momento_de_ocurrencia", "vence_en")
    VALUES (${vencidaId}::uuid, ${pro.id}::uuid, 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', ${sha(tokenVencido)}, ${sha(randomUUID())}, '{}'::jsonb,
            now() - interval '8 days', now() - interval '1 day')`;
  await o.post('/api/v1/relationship-invitations/claim').send({ token: tokenVencido }).expect(422); // INVITATION_EXPIRED
  await p.post(`/api/v1/relationship-invitations/${vencidaId}/revoke`).send({}).expect(422); // INVITATION_EXPIRED
});

it('TEST-CT (WP-ACCESO-GOOGLE): GOO-01 a 03 y la declaración de mayoría de edad de ACC-01, con éxitos y errores declarados (DL-138)', async () => {
  const servidor = app.getHttpServer();
  const RUTA = '/api/v1/auth/federated/google';
  const cuerpoDeAlta = (idToken: string, cambios: Record<string, unknown> = {}) => ({
    idToken,
    registrationIntent: 'ADVISEE',
    profile: { displayName: NOMBRE_SINTETICO },
    termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
    privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
    adultDeclaration: { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
    ...cambios,
  });
  const tokenGoogle = (sub: string, correo: string, cambios: Record<string, unknown> = {}) => idTokenDeGoogle(google, reclamosDeGoogle(sub, correo, cambios));
  const entrar = (a: INestApplication, idToken: string) => request(a.getHttpServer()).post(`${RUTA}/sessions`).send({ idToken });
  const vincular = (idToken: string, credential: string) => request(servidor).post(`${RUTA}/links`).send({ idToken, credential });
  const crear = (a: INestApplication, cuerpo: Record<string, unknown>) => request(a.getHttpServer()).post(`${RUTA}/registrations`).send(cuerpo);

  // ACC-01: sin la declaración (un cliente anterior) y sin marcarla.
  const { adultDeclaration: _sinDeclaracion, ...anterior } = cuerpoDeRegistro(correoSintetico('ct-mayoria'));
  await request(servidor).post('/api/v1/registrations').set('Idempotency-Key', claveDeIdempotencia()).send(anterior).expect(422); // TERMS_VERSION_NOT_ACCEPTABLE
  await request(servidor)
    .post('/api/v1/registrations')
    .set('Idempotency-Key', claveDeIdempotencia())
    .send({ ...anterior, adultDeclaration: { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: false } })
    .expect(422); // VALIDATION_FAILED

  // GOO-03
  const subNuevo = subSintetico();
  const correoNuevo = correoSintetico('ct-goo');
  const tokenNuevo = tokenGoogle(subNuevo, correoNuevo);
  await crear(app, cuerpoDeAlta(tokenNuevo)).expect(201);
  await crear(app, cuerpoDeAlta(tokenNuevo)).expect(200); // la cuenta de Google ya tiene identidad
  await crear(app, { ...cuerpoDeAlta(tokenNuevo), rol: 'X' }).expect(400); // UNKNOWN_FIELD
  await crear(app, { ...cuerpoDeAlta(tokenNuevo), idToken: '' }).expect(400); // INVALID_REQUEST
  await crear(app, cuerpoDeAlta(tokenNuevo, { adultDeclaration: undefined })).expect(422); // VALIDATION_FAILED
  await crear(app, cuerpoDeAlta(tokenGoogle(subSintetico(), correoSintetico('ct-goo-sin-nombre')), { profile: undefined })).expect(422); // TERMS_VERSION_NOT_ACCEPTABLE (DL-169)
  await crear(app, cuerpoDeAlta(tokenNuevo, { termsAcceptance: { versionId: 'vieja' } })).expect(422); // TERMS_VERSION_NOT_ACCEPTABLE
  await crear(app, cuerpoDeAlta(tokenNuevo, { privacyAcknowledgement: { versionId: 'vieja' } })).expect(422); // PRIVACY_VERSION_NOT_ACCEPTABLE
  await crear(app, cuerpoDeAlta(tokenGoogle(subSintetico(), correoSintetico('ct-goo-nv'), { email_verified: false }))).expect(422); // GOOGLE_EMAIL_NOT_VERIFIED
  await crear(app, cuerpoDeAlta(tokenGoogle(subSintetico(), correoSintetico('ct-goo-aud'), { aud: '000000000009-otraapp.apps.googleusercontent.com', azp: undefined }))).expect(401); // GOOGLE_TOKEN_INVALID
  // Un correo que ya es de otra identidad, con otra cuenta de Google: el 409 neutral del registro.
  await crear(app, cuerpoDeAlta(tokenGoogle(subSintetico(), correoNuevo))).expect(409); // REGISTRATION_NOT_AVAILABLE
  const correoLocal = correoSintetico('ct-goo-local');
  await registrarOk(app, correoLocal);
  const tokenLocal = tokenGoogle(subSintetico(), correoLocal);
  await crear(app, cuerpoDeAlta(tokenLocal)).expect(409); // GOOGLE_LINK_REQUIRED

  // GOO-01
  await entrar(app, tokenNuevo).expect(201);
  await entrar(app, tokenLocal).expect(409); // GOOGLE_LINK_REQUIRED
  await entrar(app, tokenGoogle(subSintetico(), correoSintetico('ct-goo-nadie'))).expect(404); // GOOGLE_ACCOUNT_NOT_FOUND
  await entrar(app, tokenGoogle(subSintetico(), correoSintetico('ct-goo-nv2'), { email_verified: false })).expect(422); // GOOGLE_EMAIL_NOT_VERIFIED
  await entrar(app, `${tokenNuevo.split('.').slice(0, 2).join('.')}.firmaajena`).expect(401); // GOOGLE_TOKEN_INVALID
  await request(servidor).post(`${RUTA}/sessions`).send({ idToken: tokenNuevo, otro: 1 }).expect(400); // UNKNOWN_FIELD
  await request(servidor).post(`${RUTA}/sessions?x=1`).send({ idToken: tokenNuevo }).expect(400); // INVALID_REQUEST
  const subSuspendida = subSintetico();
  const correoSuspendida = correoSintetico('ct-goo-susp');
  const suspendida = (await crear(app, cuerpoDeAlta(tokenGoogle(subSuspendida, correoSuspendida))).expect(201)).body.data.actor.identityId as string;
  await transicionPorServicio(app, suspendida, 'SuspenderCuenta');
  await entrar(app, tokenGoogle(subSuspendida, correoSuspendida)).expect(401); // INVALID_CREDENTIALS

  // GOO-02
  await vincular(tokenLocal, OTRA_CREDENCIAL_SINTETICA).expect(401); // INVALID_CREDENTIALS
  await vincular(tokenLocal, CREDENCIAL_SINTETICA).expect(201);
  await vincular(tokenGoogle(subSintetico(), correoLocal), CREDENCIAL_SINTETICA).expect(409); // GOOGLE_ACCOUNT_ALREADY_LINKED
  await vincular(tokenGoogle(subSintetico(), correoSintetico('ct-goo-nv3'), { email_verified: false }), CREDENCIAL_SINTETICA).expect(422); // GOOGLE_EMAIL_NOT_VERIFIED
  await vincular('no-es-un-token', CREDENCIAL_SINTETICA).expect(401); // GOOGLE_TOKEN_INVALID
  await request(servidor).post(`${RUTA}/links`).send({ idToken: tokenLocal }).expect(400); // INVALID_REQUEST

  // 503: una app sin GOOGLE_CLIENT_IDS, con el mismo observador.
  const sinGoogle = await appDePrueba({}, observar);
  try {
    await entrar(sinGoogle, tokenNuevo).expect(503);
    await request(sinGoogle.getHttpServer()).post(`${RUTA}/links`).send({ idToken: tokenNuevo, credential: CREDENCIAL_SINTETICA }).expect(503);
    await crear(sinGoogle, cuerpoDeAlta(tokenNuevo)).expect(503);
  } finally {
    await sinGoogle.close();
  }
});

it('TEST-CT (WP-NOTAS-DE-COORDINACION): CRD-01, CRD-01-LISTA y CRD-01-PROPIA, con éxitos y errores declarados (DL-140)', async () => {
  const servidor = app.getHttpServer();
  const c = await circuitoConPlanActivo(app, 'ct-crd');
  const ent = await prepararProfesional(app, 'ct-crd-ent', ['ENTRENAMIENTO']);
  await vinculoCompleto(app, ent, c.ase, 'ENTRENAMIENTO');
  const ajeno = await prepararProfesional(app, 'ct-crd-ajeno', ['NUTRICION']);
  const p = conSesion(app, c.pro.token);
  const ruta = `/api/v1/advisees/${c.ase.id}/coordination-notes`;
  const cuerpo = { originScope: 'NUTRICION', purpose: 'CONTEXT_FOR_YOUR_AREA', recipients: { mode: 'ALL' }, text: 'Nota sintética del contrato.' };

  // CRD-01
  const clave = claveDeIdempotencia();
  await p.post(ruta, clave).send({ ...cuerpo, references: [{ type: 'NUTRITION_PLAN_VERSION', id: c.planId }] }).expect(201);
  await p.post(ruta, clave).send({ ...cuerpo, text: 'Otra.' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await p.post(ruta).send({ ...cuerpo, adjunto: 'x' }).expect(400); // UNKNOWN_FIELD
  await p.post(ruta).send({ ...cuerpo, text: '' }).expect(400); // INVALID_REQUEST
  await p.post(`${ruta}?x=1`).send(cuerpo).expect(400); // INVALID_REQUEST
  await conSesion(app, ajeno.token).post(ruta).send(cuerpo).expect(404);
  await p.post(ruta).send({ ...cuerpo, recipients: { mode: 'ONE', identityId: ajeno.id } }).expect(422); // COORDINATION_RECIPIENT_NOT_AVAILABLE
  await p.post(ruta).send({ ...cuerpo, references: [{ type: 'NUTRITION_REVIEW', id: randomUUID() }] }).expect(422); // COORDINATION_REFERENCE_INVALID
  await request(servidor).post(ruta).set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo).expect(401);

  // CRD-01-LISTA
  await p.get(`${ruta}/recipients`).expect(200);
  await p.get(`${ruta}/recipients?x=1`).expect(400);
  await conSesion(app, ajeno.token).get(`${ruta}/recipients`).expect(404);
  await request(servidor).get(`${ruta}/recipients`).expect(401);

  // CRD-01-PROPIA
  const a = conSesion(app, c.ase.token);
  await a.get('/api/v1/me/coordination-notes?limit=5').expect(200);
  await a.get('/api/v1/me/coordination-notes?x=1').expect(400); // INVALID_REQUEST
  await a.get('/api/v1/me/coordination-notes?cursor=basura').expect(400); // INVALID_CURSOR
  await p.get('/api/v1/me/coordination-notes').expect(403); // ACTION_FORBIDDEN: sin A3 propio
  await request(servidor).get('/api/v1/me/coordination-notes').expect(401);
});

it('TEST-CT (WP-ADMINISTRACION): ADM-01 a 13, con éxitos y errores declarados (DL-155)', async () => {
  const correo = correoSintetico('ct-adm');
  await registrarOk(app, correo, 'WEB');
  const { codigo } = await incorporarAdministrador(prisma, { correo, nombre: 'Admin del contrato', fundamento: 'Prueba de contrato', operador: 'Prueba de contrato', appEnv: 'test' });
  const persona = correoSintetico('ct-adm-persona');
  await registrarOk(app, persona, 'WEB');
  const personal = await tokenDe(app, persona, 'WEB');

  // ADM-01
  const entrada = await primerFactor(app, correo).expect(201);
  const cookie = ([] as string[]).concat(entrada.headers['set-cookie'] ?? []).find((c) => c.startsWith('__Secure-be-admin-reanudacion='))?.split(';')[0] ?? '';
  await primerFactor(app, correo, OTRA_CREDENCIAL_SINTETICA).expect(401); // INVALID_CREDENTIALS
  await adm(app).post('/admin/auth/sessions').send({ identifier: correo, credential: CREDENCIAL_SINTETICA, rol: 'ADMIN' }).expect(400); // UNKNOWN_FIELD
  await adm(app).post('/admin/auth/sessions?x=1').send({ identifier: correo, credential: CREDENCIAL_SINTETICA }).expect(400); // INVALID_REQUEST

  // ADM-02: la sesión se reanuda con su cookie; desde acá se usa el token reanudado.
  const t = (await adm(app).post('/admin/auth/sessions/resume').set('Cookie', cookie).expect(200)).body.data.session.accessToken as string;
  await adm(app).post('/admin/auth/sessions/resume?x=1').set('Cookie', cookie).expect(400);
  await adm(app).post('/admin/auth/sessions/resume').expect(401); // AUTHENTICATION_REQUIRED

  // ADM-04: el estado de la sesión se lee con el primer factor; una sesión personal no es administrativa.
  await adm(app, t).get('/admin/auth/sessions/current').expect(200);
  await adm(app, t).get('/admin/auth/sessions/current?x=1').expect(400);
  await adm(app).get('/admin/auth/sessions/current').expect(401);
  await adm(app, personal).get('/admin/auth/sessions/current').expect(403); // ACTION_FORBIDDEN

  // Con solo el primer factor, nada que lea o decida: MFA_REQUIRED.
  await adm(app, t).post('/admin/professionals/query').send({}).expect(403);
  await adm(app, t).post('/admin/auth/recovery-codes').send({ credential: CREDENCIAL_SINTETICA }).expect(403);

  // ADM-07
  await adm(app, t).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: 'AAAAA-AAAAA-AAAAA-AAAAA' }).expect(422); // INCORPORATION_CODE_INVALID
  await adm(app, t).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: codigo, extra: 1 }).expect(400); // UNKNOWN_FIELD
  const secreto = (await adm(app, t).post('/admin/auth/second-factor/enrollment').send({ incorporationCode: codigo }).expect(200)).body.data.secret as string;

  // ADM-08
  await adm(app, t).post('/admin/auth/second-factor/enrollment/confirm').send({ code: codigoQueNoVale(secreto) }).expect(422); // SECOND_FACTOR_INVALID
  await adm(app, t).post('/admin/auth/second-factor/enrollment/confirm').send({ code: codigoTotp(secreto), extra: 1 }).expect(400); // UNKNOWN_FIELD
  const anteriores = (await adm(app, t).post('/admin/auth/second-factor/enrollment/confirm').send({ code: codigoTotp(secreto) }).expect(200)).body.data.recoveryCodes as string[];

  // ADM-09
  await adm(app, t).post('/admin/auth/recovery-codes').send({ credential: OTRA_CREDENCIAL_SINTETICA }).expect(401); // INVALID_CREDENTIALS
  await adm(app, t).post('/admin/auth/recovery-codes').send({ credential: CREDENCIAL_SINTETICA, extra: 1 }).expect(400); // UNKNOWN_FIELD
  const nuevos = (await adm(app, t).post('/admin/auth/recovery-codes').send({ credential: CREDENCIAL_SINTETICA }).expect(200)).body.data.recoveryCodes as string[];

  // ADM-05, en otra sesión: el código de este paso ya se usó al confirmar; vale el del siguiente.
  const otra = (await primerFactor(app, correo).expect(201)).body.data.session.accessToken as string;
  await adm(app, otra).post('/admin/auth/sessions/current/second-factor').send({ code: codigoQueNoVale(secreto) }).expect(422); // SECOND_FACTOR_INVALID
  await adm(app, otra).post('/admin/auth/sessions/current/second-factor').send({ code: '123456', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await adm(app, otra).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(secreto, 30_000) }).expect(200);

  // ADM-06, en una tercera: un código del lote anterior ya no vale; uno del nuevo, sí.
  const tercera = (await primerFactor(app, correo).expect(201)).body.data.session.accessToken as string;
  await adm(app, tercera).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: anteriores[0] }).expect(422); // SECOND_FACTOR_INVALID
  await adm(app, tercera).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: nuevos[0], extra: 1 }).expect(400); // UNKNOWN_FIELD
  await adm(app, tercera).post('/admin/auth/sessions/current/recovery-code').send({ recoveryCode: nuevos[0] }).expect(200);

  // ADM-10
  const pendiente = await profesionalPendiente(app, 'ct-adm');
  await adm(app, t).post('/admin/professionals/query').send({ text: 'Pendiente ct-adm', scope: 'NUTRICION', situation: 'PENDING_REVIEW', limit: 5 }).expect(200);
  await adm(app, t).post('/admin/professionals/query').send({ campo: 1 }).expect(400); // UNKNOWN_FIELD
  await adm(app, t).post('/admin/professionals/query').send({ cursor: 'basura' }).expect(400); // INVALID_CURSOR
  await adm(app, t).post('/admin/professionals/query?x=1').send({}).expect(400); // INVALID_REQUEST
  await adm(app).post('/admin/professionals/query').send({}).expect(401);
  await adm(app, personal).post('/admin/professionals/query').send({}).expect(403); // ACTION_FORBIDDEN

  // ADM-11
  await adm(app, t).get(`/admin/professionals/${pendiente.id}`).expect(200);
  await adm(app, t).get(`/admin/professionals/${pendiente.id}?x=1`).expect(400);
  await adm(app, t).get(`/admin/professionals/${randomUUID()}`).expect(404);

  // ADM-12
  await adm(app, t).get(`/admin/professionals/${pendiente.id}/history?limit=5&scope=NUTRICION`).expect(200);
  await adm(app, t).get(`/admin/professionals/${pendiente.id}/history?cursor=basura`).expect(400); // INVALID_CURSOR
  await adm(app, t).get(`/admin/professionals/${pendiente.id}/history?x=1`).expect(400); // INVALID_REQUEST
  await adm(app, t).get(`/admin/professionals/${randomUUID()}/history`).expect(404);

  // ADM-13
  const versionDe = async () =>
    ((await adm(app, t).get(`/admin/professionals/${pendiente.id}`).expect(200)).body.data.scopes as { scope: string; version: string }[]).find((s) => s.scope === 'NUTRICION')!.version;
  const verificar = { expectedVersion: await versionDe(), decision: 'VERIFY', rationale: 'Fundamento del contrato.' };
  const clave = claveDeIdempotencia();
  await adm(app, t).decidir(pendiente.id, 'NUTRICION', verificar, clave).expect(200);
  await adm(app, t).decidir(pendiente.id, 'NUTRICION', verificar, clave).expect(200); // la misma clave: el resultado original
  await adm(app, t).decidir(pendiente.id, 'NUTRICION', { ...verificar, rationale: 'Otro' }, clave).expect(409); // IDEMPOTENCY_KEY_REUSED
  await adm(app, t).decidir(pendiente.id, 'NUTRICION', verificar).expect(409); // VERSION_CONFLICT: la versión que se vio ya no es la del área
  const ahora = await versionDe();
  await adm(app, t).decidir(pendiente.id, 'NUTRICION', { expectedVersion: ahora, decision: 'REINSTATE', rationale: 'x' }).expect(422); // INVALID_STATE_TRANSITION
  await adm(app, t).decidir(pendiente.id, 'NUTRICION', { expectedVersion: ahora, decision: 'SUSPEND', rationale: '' }).expect(422); // RATIONALE_REQUIRED
  await adm(app, t).decidir(pendiente.id, 'NUTRICION', { expectedVersion: ahora, decision: 'SUSPEND', rationale: 'x' }).expect(422); // VALIDATION_FAILED: falta el texto
  await adm(app, t).decidir(pendiente.id, 'NUTRICION', { ...verificar, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await adm(app, t).post(`/admin/professionals/${pendiente.id}/scopes/NUTRICION/decisions`).send(verificar).expect(400); // INVALID_REQUEST: sin Idempotency-Key
  await adm(app, t).decidir(randomUUID(), 'NUTRICION', verificar).expect(404);

  // ADM-03: cerrar es idempotente.
  await adm(app, tercera).delete('/admin/auth/sessions/current').expect(204);
  await adm(app, tercera).delete('/admin/auth/sessions/current').expect(204);
  await adm(app, tercera).delete('/admin/auth/sessions/current?x=1').expect(400);
  await adm(app).delete('/admin/auth/sessions/current').expect(401); // AUTHENTICATION_REQUIRED
});

it('TEST-CT (WP-USO-FINAL, UF-11): MFA-01 a 06 — el segundo factor del profesional, con éxitos y errores declarados (DL-169)', async () => {
  const ruta = '/api/v1/me/second-factor';
  // Un profesional sin autenticador, recién entrado (como uno que incorpora Administración), y una persona.
  const correo = correoSintetico('ct-mfa');
  const id = await registrarOk(app, correo, 'WEB');
  await app.get(PrismaService).$transaction((tx) => app.get(VerificacionService).prepararProfesional(tx, id, { alcance: 'NUTRICION', tipo: 'SANITARIO', nombreVisible: 'Lic. Contrato MFA' }, new Date()));
  const t = await tokenDe(app, correo, 'WEB');
  const persona = await prepararAsesorado(app, 'ct-mfa');
  // MFA-01.
  expect((await conSesion(app, t).get(ruta).expect(200)).body.data.secondFactor.state).toBe('ENROLLMENT_REQUIRED');
  await conSesion(app, t).get(`${ruta}?x=1`).expect(400); // INVALID_REQUEST
  await request(app.getHttpServer()).get(ruta).expect(401); // AUTHENTICATION_REQUIRED
  // MFA-04 y 05: configurar.
  await conSesion(app, persona.token).post(`${ruta}/enrollment`).send({}).expect(422); // INVALID_STATE_TRANSITION: sin perfil profesional
  await conSesion(app, t).post(`${ruta}/enrollment`).send({ extra: 1 }).expect(400); // UNKNOWN_FIELD
  const secreto = (await conSesion(app, t).post(`${ruta}/enrollment`).send({}).expect(200)).body.data.secret as string;
  await conSesion(app, t).post(`${ruta}/enrollment/confirm`).send({ code: codigoQueNoVale(secreto) }).expect(422); // SECOND_FACTOR_INVALID
  await conSesion(app, t).post(`${ruta}/enrollment/confirm`).send({ code: '123456', extra: 1 }).expect(400); // UNKNOWN_FIELD
  const paso = Math.floor(Date.now() / 30_000);
  const codigos = (await conSesion(app, t).post(`${ruta}/enrollment/confirm`).send({ code: codigoDelPaso(secreto, paso) }).expect(200)).body.data.recoveryCodes as string[];
  // MFA-02: otra sesión, con el código del paso siguiente.
  const otra = await tokenDe(app, correo, 'WEB');
  await conSesion(app, otra).post(`${ruta}/verification`).send({ code: codigoQueNoVale(secreto) }).expect(422); // SECOND_FACTOR_INVALID
  await conSesion(app, otra).post(`${ruta}/verification`).send({ code: '123456', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await conSesion(app, persona.token).post(`${ruta}/verification`).send({ code: '123456' }).expect(422); // INVALID_STATE_TRANSITION
  await conSesion(app, otra).post(`${ruta}/verification`).send({ code: codigoDelPaso(secreto, paso + 1) }).expect(200);
  // MFA-03: una tercera, con un código de recuperación.
  const tercera = await tokenDe(app, correo, 'WEB');
  await conSesion(app, tercera).post(`${ruta}/recovery-code`).send({ recoveryCode: 'AAAA-AAAA-AAAA' }).expect(422); // SECOND_FACTOR_INVALID
  await conSesion(app, tercera).post(`${ruta}/recovery-code`).send({ recoveryCode: codigos[0], extra: 1 }).expect(400); // UNKNOWN_FIELD
  await conSesion(app, tercera).post(`${ruta}/recovery-code`).send({ recoveryCode: codigos[0] }).expect(200);
  // MFA-06: desde la sesión reciente y verificada; sin verificar, no.
  const sinVerificar = await tokenDe(app, correo, 'WEB');
  await conSesion(app, sinVerificar).post(`${ruta}/recovery-codes`).send({}).expect(422); // INVALID_STATE_TRANSITION
  await conSesion(app, t).post(`${ruta}/recovery-codes`).send({ extra: 1 }).expect(400); // UNKNOWN_FIELD
  expect((await conSesion(app, t).post(`${ruta}/recovery-codes`).send({}).expect(200)).body.data.recoveryCodes).toHaveLength(10);
});

it('TEST-CT (WP-USO-FINAL, UF-04): ADM-14 y ADM-15 — incorporar a un profesional y cambiar su nombre profesional, con éxitos y errores declarados (DL-169)', async () => {
  const a = await administradorListo(app, prisma, `ct-uf04-${randomUUID().slice(0, 6)}`);
  const correo = correoSintetico('ct-uf04');
  const id = await registrarOk(app, correo, 'WEB');
  const cuerpo = { email: correo, professionalName: 'Lic. Contrato Incorporada', profileType: 'HEALTH_PROFESSIONAL', license: { number: 'MN 000001', jurisdiction: 'Provincia sintética' }, scopes: ['NUTRICION'], rationale: 'Verificada en el registro sintético.' };
  const incorporar = (body: Record<string, unknown>, token = a.token) => adm(app, token).post('/admin/professionals').set('Idempotency-Key', claveDeIdempotencia()).send(body);
  // ADM-14.
  await adm(app, a.token).post('/admin/professionals').send(cuerpo).expect(400); // INVALID_REQUEST: sin Idempotency-Key
  await incorporar({ ...cuerpo, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await incorporar({ ...cuerpo, rationale: '' }).expect(422); // VALIDATION_FAILED
  await incorporar({ ...cuerpo, email: correoSintetico('ct-uf04-nadie') }).expect(404); // RESOURCE_NOT_FOUND
  const persona = await prepararAsesorado(app, 'ct-uf04');
  await incorporar(cuerpo, persona.token).expect(403); // ACTION_FORBIDDEN: una sesión común
  const sinSegundoFactor = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
  await incorporar(cuerpo, sinSegundoFactor).expect(403); // MFA_REQUIRED
  await adm(app).post('/admin/professionals').set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo).expect(401); // AUTHENTICATION_REQUIRED
  await incorporar(cuerpo).expect(201);
  // ADM-15.
  const cambiar = (body: Record<string, unknown>, profesional = id) => adm(app, a.token).post(`/admin/professionals/${profesional}/name`).set('Idempotency-Key', claveDeIdempotencia()).send(body);
  await cambiar({ professionalName: 'Lic. Contrato', expectedName: 'Otro', rationale: 'Pedido.' }).expect(409); // VERSION_CONFLICT
  await cambiar({ professionalName: '', expectedName: 'Lic. Contrato Incorporada', rationale: 'Pedido.' }).expect(422); // VALIDATION_FAILED
  await cambiar({ professionalName: 'Lic. Contrato', expectedName: 'Lic. Contrato Incorporada', rationale: 'Pedido.', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await cambiar({ professionalName: 'Lic. Contrato', expectedName: 'X', rationale: 'Pedido.' }, randomUUID()).expect(404); // RESOURCE_NOT_FOUND
  await cambiar({ professionalName: 'Lic. Contrato Renombrada', expectedName: 'Lic. Contrato Incorporada', rationale: 'Pedido por el canal.' }).expect(200);
});

it('TEST-CT (WP-USO-FINAL, UF-06): RGT-01 a 03, EXP-01, EXP-02 y su descarga, y ADM-16 y 17 — los derechos de la persona, con éxitos y errores declarados (DL-169)', async () => {
  const persona = await prepararAsesorado(app, 'ct-uf06');
  const otra = await prepararAsesorado(app, 'ct-uf06-otra');
  const yo = conSesion(app, persona.token);
  // RGT-01 a 03.
  await request(app.getHttpServer()).post('/api/v1/me/data-rights-requests').set('Authorization', `Bearer ${persona.token}`).send({ type: 'ACCESS', scope: {} }).expect(400); // INVALID_REQUEST: sin Idempotency-Key
  await yo.post('/api/v1/me/data-rights-requests').send({ type: 'ACCESS', scope: {}, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await yo.post('/api/v1/me/data-rights-requests').send({ type: 'ACCESS', scope: { note: 'x'.repeat(1001) } }).expect(422); // VALIDATION_FAILED
  const pedido = (await yo.post('/api/v1/me/data-rights-requests').send({ type: 'RECTIFICATION', scope: { note: 'Mi fecha está mal.' } }).expect(201)).body.data.requestId as string;
  await request(app.getHttpServer()).post('/api/v1/me/data-rights-requests').set('Idempotency-Key', claveDeIdempotencia()).send({ type: 'ACCESS', scope: {} }).expect(401); // AUTHENTICATION_REQUIRED
  await yo.get(`/api/v1/me/data-rights-requests/${pedido}`).expect(200);
  await conSesion(app, otra.token).get(`/api/v1/me/data-rights-requests/${pedido}`).expect(404); // RESOURCE_NOT_FOUND
  await yo.get(`/api/v1/me/data-rights-requests/${pedido}?x=1`).expect(400); // INVALID_REQUEST
  await yo.get('/api/v1/me/data-rights-requests?limit=5').expect(200);
  await yo.get('/api/v1/me/data-rights-requests?cursor=no-es-un-cursor').expect(400); // INVALID_CURSOR
  // EXP-01, EXP-02 y la descarga.
  await yo.post('/api/v1/me/exports').send({ scope: { domains: [], period: null } }).expect(422); // VALIDATION_FAILED
  await yo.post('/api/v1/me/exports').send({ scope: { domains: ['NUTRITION'], period: null }, extra: 1 }).expect(400); // UNKNOWN_FIELD
  const exportacion = (await yo.post('/api/v1/me/exports').send({ scope: { domains: ['NUTRITION', 'TRAINING'], period: null } }).expect(201)).body.data.exportId as string;
  const ruta = (await yo.get(`/api/v1/me/exports/${exportacion}`).expect(200)).body.data.download.path as string;
  await conSesion(app, otra.token).get(`/api/v1/me/exports/${exportacion}`).expect(404); // RESOURCE_NOT_FOUND
  await yo.get(`/api/v1/me/exports/${exportacion}?x=1`).expect(400); // INVALID_REQUEST
  await request(app.getHttpServer()).get(`/api/v1${ruta}`).expect(200);
  await request(app.getHttpServer()).get('/api/v1/exports/content/no.vale').expect(404); // RESOURCE_NOT_FOUND
  await request(app.getHttpServer()).get(`/api/v1${ruta}?x=1`).expect(400); // INVALID_REQUEST
  // ADM-16 y ADM-17.
  const a = await administradorListo(app, prisma, `ct-uf06-${randomUUID().slice(0, 6)}`);
  await adm(app, a.token).post('/admin/data-rights-requests/query').send({ state: 'RECEIVED' }).expect(200);
  await adm(app, a.token).post('/admin/data-rights-requests/query').send({ extra: 1 }).expect(400); // UNKNOWN_FIELD
  await adm(app, a.token).post('/admin/data-rights-requests/query').send({ cursor: '###' }).expect(400); // INVALID_CURSOR
  await adm(app, persona.token).post('/admin/data-rights-requests/query').send({}).expect(403); // ACTION_FORBIDDEN
  const resolver = (id: string, cuerpo: Record<string, unknown>) => adm(app, a.token).post(`/admin/data-rights-requests/${id}/resolution`).set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo);
  await resolver(pedido, { outcome: 'RESOLVED', response: 'Corregida.', rationale: '' }).expect(422); // VALIDATION_FAILED
  await resolver(randomUUID(), { outcome: 'RESOLVED', response: 'Corregida.', rationale: 'Pedido por el canal.' }).expect(404); // RESOURCE_NOT_FOUND
  await resolver(pedido, { outcome: 'RESOLVED', response: 'Corregida.', rationale: 'Pedido por el canal.', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await resolver(pedido, { outcome: 'RESOLVED', response: 'Corregida.', rationale: 'Pedido por el canal.' }).expect(200);
  await resolver(pedido, { outcome: 'REJECTED', response: 'Otra vez.', rationale: 'Otra vez.' }).expect(422); // INVALID_STATE_TRANSITION
});

it('TEST-CT (WP-USO-FINAL, UF-03): ACC-P1-01 y 02 y ADM-18 — recuperar el acceso, con éxitos y errores declarados (DL-169)', async () => {
  const servidor = app.getHttpServer();
  const persona = correoSintetico('ct-uf03');
  await registrarOk(app, persona, 'WEB');
  const pedir = (cuerpo: Record<string, unknown>) => request(servidor).post('/api/v1/auth/recovery-requests').send(cuerpo);
  const completar = (id: string, cuerpo: Record<string, unknown>) => request(servidor).post(`/api/v1/auth/recovery-requests/${id}/complete`).send(cuerpo);
  // ACC-P1-01: sin proveedor de correo (como en test), 202 con la entrega asistida.
  const pedido = (await pedir({ identifier: persona }).expect(202)).body.data.recoveryId as string;
  await pedir({ identifier: persona, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await pedir({ identifier: 'sin-arroba' }).expect(422); // VALIDATION_FAILED
  await request(servidor).post('/api/v1/auth/recovery-requests?x=1').send({ identifier: persona }).expect(400); // INVALID_REQUEST
  // ADM-18: el código de la recuperación asistida.
  const a = await administradorListo(app, prisma, `ct-uf03-${randomUUID().slice(0, 6)}`);
  const asistida = (cuerpo: Record<string, unknown>) => adm(app, a.token).post('/admin/access-recoveries').send(cuerpo);
  await asistida({ email: persona, rationale: '' }).expect(422); // VALIDATION_FAILED
  await asistida({ email: correoSintetico('ct-uf03-nadie'), rationale: 'Pedido por el canal.' }).expect(404); // RESOURCE_NOT_FOUND
  await asistida({ email: persona, rationale: 'Pedido por el canal.', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await adm(app).post('/admin/access-recoveries').send({ email: persona, rationale: 'Pedido por el canal.' }).expect(401); // AUTHENTICATION_REQUIRED
  const sinSegundo = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
  await adm(app, sinSegundo).post('/admin/access-recoveries').send({ email: persona, rationale: 'Pedido por el canal.' }).expect(403); // MFA_REQUIRED
  const codigo = (await asistida({ email: persona, rationale: 'Escribió desde el correo de la cuenta.' }).expect(201)).body.data.code as string;
  // ACC-P1-02.
  await completar(pedido, { proof: codigo, newCredential: 'corta' }).expect(422); // VALIDATION_FAILED
  await completar(pedido, { proof: codigo, newCredential: OTRA_CREDENCIAL_SINTETICA, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await completar(randomUUID(), { proof: codigo, newCredential: OTRA_CREDENCIAL_SINTETICA }).expect(422); // RECOVERY_CODE_INVALID
  await completar(pedido, { proof: codigo, newCredential: OTRA_CREDENCIAL_SINTETICA }).expect(204);
});

it('TEST-CT (WP-USO-FINAL, UF-11): ADM-19 — Administración restablece el segundo factor de un profesional (DL-169, UF-T56)', async () => {
  const pro = await prepararProfesional(app, 'ct-uf11-rsf', ['NUTRICION']);
  const persona = correoSintetico('ct-uf11-rsf-persona');
  await registrarOk(app, persona, 'WEB');
  const a = await administradorListo(app, prisma, `ct-uf11-${randomUUID().slice(0, 6)}`);
  const restablecer = (token: string | undefined, cuerpo: Record<string, unknown>) => adm(app, token).post('/admin/professional-second-factor-resets').send(cuerpo);
  const fundamento = 'Escribió desde el correo de la cuenta (sintético).';
  await restablecer(a.token, { email: pro.correo, rationale: fundamento }).expect(200);
  await restablecer(a.token, { email: persona, rationale: fundamento }).expect(422); // VALIDATION_FAILED (no es profesional)
  await restablecer(a.token, { email: correoSintetico('ct-uf11-nadie'), rationale: fundamento }).expect(404); // RESOURCE_NOT_FOUND
  await restablecer(a.token, { email: pro.correo, rationale: fundamento, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await restablecer(undefined, { email: pro.correo, rationale: fundamento }).expect(401); // AUTHENTICATION_REQUIRED
  const sinSegundo = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
  await restablecer(sinSegundo, { email: pro.correo, rationale: fundamento }).expect(403); // MFA_REQUIRED
});

it('TEST-CT (WP-USO-FINAL, UF-05): ACC-09 — el texto de una versión publicada, sin sesión (DL-169, UF-T57)', async () => {
  await request(app.getHttpServer()).get(`/api/v1/legal-texts/${VERSION_VIGENTE.TERMINOS.id}`).expect(200);
  await request(app.getHttpServer()).get('/api/v1/legal-texts/terminos-que-no-existe').expect(404); // RESOURCE_NOT_FOUND
  await request(app.getHttpServer()).get(`/api/v1/legal-texts/${VERSION_VIGENTE.TERMINOS.id}?x=1`).expect(400); // INVALID_REQUEST
});

it('TEST-CT (WP-USO-FINAL, UF-07): SOP-01 — el canal de ayuda y contacto, sin sesión (DL-169)', async () => {
  await request(app.getHttpServer()).get('/api/v1/support/contact').expect(200);
  await request(app.getHttpServer()).get('/api/v1/support/contact?x=1').expect(400); // INVALID_REQUEST
});

it('TEST-CT (RF-068): INC-01 a 05 — avisar un problema, verlo y gestionarlo en Administración, con éxitos y errores declarados (DL-172)', async () => {
  const persona = await prepararAsesorado(app, 'ct-inc');
  const yo = conSesion(app, persona.token);
  // INC-01 y 02.
  await request(app.getHttpServer()).post('/api/v1/incidents').set('Authorization', `Bearer ${persona.token}`).send({ category: 'ACCESS', description: 'x' }).expect(400); // INVALID_REQUEST: sin Idempotency-Key
  await yo.post('/api/v1/incidents').send({ category: 'ACCESS', description: 'x', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await yo.post('/api/v1/incidents').send({ category: 'ACCESS', description: ' ' }).expect(422); // VALIDATION_FAILED
  const clave = claveDeIdempotencia();
  const id = (await yo.post('/api/v1/incidents', clave).send({ category: 'ACCESS', description: 'Sintético: no entra.' }).expect(201)).body.data.incidentId as string;
  await yo.post('/api/v1/incidents', clave).send({ category: 'ACCESS', description: 'Otra cosa.' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await request(app.getHttpServer()).post('/api/v1/incidents').set('Idempotency-Key', claveDeIdempotencia()).send({ category: 'ACCESS', description: 'x' }).expect(401); // AUTHENTICATION_REQUIRED
  await yo.get('/api/v1/me/incidents?limit=5').expect(200);
  await yo.get('/api/v1/me/incidents?cursor=no-es-un-cursor').expect(400); // INVALID_CURSOR
  // INC-03 a 05.
  const a = await administradorListo(app, prisma, `ct-inc-${randomUUID().slice(0, 6)}`);
  await adm(app, a.token).post('/admin/incidents/query').send({ states: ['OPEN'] }).expect(200);
  await adm(app, a.token).post('/admin/incidents/query').send({ extra: 1 }).expect(400); // UNKNOWN_FIELD
  await adm(app, a.token).post('/admin/incidents/query').send({ cursor: '###' }).expect(400); // INVALID_CURSOR
  await adm(app, persona.token).post('/admin/incidents/query').send({}).expect(403); // ACTION_FORBIDDEN
  await adm(app, a.token).get(`/admin/incidents/${id}`).expect(200);
  await adm(app, a.token).get(`/admin/incidents/${randomUUID()}`).expect(404); // RESOURCE_NOT_FOUND
  await adm(app, a.token).get(`/admin/incidents/${id}?x=1`).expect(400); // INVALID_REQUEST
  const cambiar = (incidencia: string, cuerpo: Record<string, unknown>) => adm(app, a.token).post(`/admin/incidents/${incidencia}/updates`).set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo);
  await cambiar(id, { state: 'RESOLVED', reason: 'Listo.', expectedVersion: 'v0' }).expect(422); // VALIDATION_FAILED: sin respuesta
  await cambiar(id, { state: 'OPEN', reason: 'Nada.', expectedVersion: 'v0' }).expect(422); // INVALID_STATE_TRANSITION
  await cambiar(id, { state: 'IN_PROGRESS', reason: 'Lo veo.', expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  await cambiar(randomUUID(), { state: 'IN_PROGRESS', reason: 'Lo veo.', expectedVersion: 'v0' }).expect(404); // RESOURCE_NOT_FOUND
  await cambiar(id, { state: 'IN_PROGRESS', reason: 'Lo veo.', expectedVersion: 'v0', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await cambiar(id, { state: 'IN_PROGRESS', reason: 'Lo veo.', expectedVersion: 'v0' }).expect(200);
});

it('TEST-CT (RF-004): MET-01 a 03 — los métodos de acceso de la cuenta propia, con éxitos y errores declarados (DL-172)', async () => {
  const correo = correoSintetico('ct-met');
  await registrarOk(app, correo);
  const token = await tokenDe(app, correo);
  const yo = conSesion(app, token);
  const tokenGoogle = (sub: string, c: string, cambios: Record<string, unknown> = {}) => idTokenDeGoogle(google, reclamosDeGoogle(sub, c, cambios));
  // MET-01.
  await yo.get('/api/v1/me/access-methods').expect(200);
  await yo.get('/api/v1/me/access-methods?x=1').expect(400); // INVALID_REQUEST
  await request(app.getHttpServer()).get('/api/v1/me/access-methods').expect(401); // AUTHENTICATION_REQUIRED
  // MET-02.
  const sub = subSintetico();
  const vincular = (cuerpo: Record<string, unknown>) => yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', credential: CREDENCIAL_SINTETICA, ...cuerpo });
  await vincular({ idToken: tokenGoogle(sub, correo), extra: 1 }).expect(400); // UNKNOWN_FIELD
  await vincular({ idToken: 'no-es-un-token' }).expect(401); // GOOGLE_TOKEN_INVALID
  await vincular({ idToken: tokenGoogle(sub, correo, { email_verified: false }) }).expect(422); // GOOGLE_EMAIL_NOT_VERIFIED
  await vincular({ idToken: tokenGoogle(sub, correo), credential: OTRA_CREDENCIAL_SINTETICA }).expect(422); // VALIDATION_FAILED
  await vincular({ idToken: tokenGoogle(sub, correoSintetico('ct-met-otro')) }).expect(409); // GOOGLE_EMAIL_MISMATCH
  const metodos = (await vincular({ idToken: tokenGoogle(sub, correo) }).expect(201)).body.data.methods as { methodId: string; type: string }[];
  await vincular({ idToken: tokenGoogle(sub, correo) }).expect(200);
  await vincular({ idToken: tokenGoogle(subSintetico(), correo) }).expect(409); // GOOGLE_ACCOUNT_ALREADY_LINKED
  const pro = await prepararProfesional(app, 'ct-met-pro', ['NUTRICION']);
  await conSesion(app, await tokenDe(app, pro.correo, 'WEB')).post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken: tokenGoogle(subSintetico(), pro.correo), credential: CREDENCIAL_SINTETICA }).expect(403); // MFA_REQUIRED
  // MET-03.
  const deGoogle = metodos.find((m) => m.type === 'GOOGLE')!.methodId;
  const contrasena = metodos.find((m) => m.type === 'PASSWORD')!.methodId;
  await yo.delete(`/api/v1/me/access-methods/${contrasena}`).expect(422); // VALIDATION_FAILED: la contraseña no se retira
  await yo.delete(`/api/v1/me/access-methods/${randomUUID()}`).expect(404); // RESOURCE_NOT_FOUND
  await yo.delete(`/api/v1/me/access-methods/${deGoogle}?x=1`).expect(400); // INVALID_REQUEST
  await yo.delete(`/api/v1/me/access-methods/${deGoogle}`).expect(200);
  await vincular({ idToken: tokenGoogle(subSintetico(), correo) }).expect(409); // GOOGLE_ACCOUNT_REPLACEMENT_NOT_AVAILABLE
  // GOO-01 y 03 con una cuenta de Google desvinculada y sin una contraseña de ese correo: 409 GOOGLE_ACCOUNT_UNLINKED.
  const otroCorreo = correoSintetico('ct-met-unlinked');
  const subOtro = subSintetico();
  const otra = correoSintetico('ct-met-otra');
  await registrarOk(app, otra);
  const deOtra = conSesion(app, await tokenDe(app, otra));
  const suyos = (await deOtra.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken: tokenGoogle(subOtro, otroCorreo), credential: CREDENCIAL_SINTETICA, confirmDifferentEmail: true }).expect(201)).body.data.methods as {
    methodId: string;
    type: string;
  }[];
  await deOtra.delete(`/api/v1/me/access-methods/${suyos.find((m) => m.type === 'GOOGLE')!.methodId}`).expect(200);
  await request(app.getHttpServer()).post('/api/v1/auth/federated/google/sessions').send({ idToken: tokenGoogle(subOtro, otroCorreo) }).expect(409); // GOOGLE_ACCOUNT_UNLINKED
  await request(app.getHttpServer())
    .post('/api/v1/auth/federated/google/registrations')
    .send({
      idToken: tokenGoogle(subOtro, otroCorreo),
      registrationIntent: 'ADVISEE',
      profile: { displayName: NOMBRE_SINTETICO },
      termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      adultDeclaration: { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
    })
    .expect(409); // GOOGLE_ACCOUNT_UNLINKED
  // Una cuenta que entra solo con Google no desvincula su único método.
  const soloGoogle = await request(app.getHttpServer())
    .post('/api/v1/auth/federated/google/registrations')
    .send({
      idToken: tokenGoogle(subSintetico(), correoSintetico('ct-met-solo')),
      registrationIntent: 'ADVISEE',
      profile: { displayName: NOMBRE_SINTETICO },
      termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      adultDeclaration: { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
    })
    .expect(201);
  const delSolo = conSesion(app, soloGoogle.body.data.session.accessToken as string);
  const unico = (await delSolo.get('/api/v1/me/access-methods').expect(200)).body.data.methods[0].methodId as string;
  await delSolo.delete(`/api/v1/me/access-methods/${unico}`).expect(409); // LAST_ACCESS_METHOD
});

it('TEST-CT (WP-USO-FINAL, UF-05): ACC-08 — aceptar la versión vigente de los términos o de la privacidad (DL-169)', async () => {
  const persona = correoSintetico('ct-uf05');
  await registrarOk(app, persona, 'WEB');
  const yo = conSesion(app, await tokenDe(app, persona, 'WEB'));
  await yo.post('/api/v1/me/legal-acceptances').send({ text: 'TERMS', versionId: VERSION_VIGENTE.TERMINOS.id }).expect(200); // ya aceptada
  await yo.post('/api/v1/me/legal-acceptances').send({ text: 'TERMS', versionId: 'terminos-que-no-existe' }).expect(422); // TERMS_VERSION_NOT_ACCEPTABLE
  await yo.post('/api/v1/me/legal-acceptances').send({ text: 'PRIVACY', versionId: VERSION_VIGENTE.TERMINOS.id }).expect(422); // PRIVACY_VERSION_NOT_ACCEPTABLE
  await yo.post('/api/v1/me/legal-acceptances').send({ text: 'TERMS', versionId: VERSION_VIGENTE.TERMINOS.id, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await request(app.getHttpServer()).post('/api/v1/me/legal-acceptances').send({ text: 'TERMS', versionId: VERSION_VIGENTE.TERMINOS.id }).expect(401); // AUTHENTICATION_REQUIRED
});

it('TEST-CT (WP-TABLERO-ALTA-GAMA, TB-47): PLN-07 y PLE-05 — descartar un borrador, con éxitos y errores declarados (DL-163 D-21)', async () => {
  const servidor = app.getHttpServer();
  const ajeno = randomUUID();
  const sinClave = (token: string, ruta: string) => request(servidor).post(ruta).set('Authorization', `Bearer ${token}`);

  // PLN-07
  const n = await circuitoListoParaPlanificar(app, 'contrato-descarte');
  const pn = conSesion(app, n.pro.token);
  const bn = await crearBorrador(app, n);
  const pln = (id: string) => `/api/v1/nutrition/plans/${id}/discard`;
  await pn.post(pln(bn.planId)).send({ expectedVersion: bn.version, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await sinClave(n.pro.token, pln(bn.planId)).send({ expectedVersion: bn.version }).expect(400); // INVALID_REQUEST: sin Idempotency-Key
  await request(servidor).post(pln(bn.planId)).send({ expectedVersion: bn.version }).expect(401);
  await pn.post(pln(bn.planId)).send({ expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  await pn.post(pln(ajeno)).send({ expectedVersion: 'v1' }).expect(404);
  const claveN = claveDeIdempotencia();
  await pn.post(pln(bn.planId), claveN).send({ expectedVersion: bn.version }).expect(200);
  await pn.post(pln(bn.planId), claveN).send({ expectedVersion: 'v9' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pn.post(pln(bn.planId)).send({ expectedVersion: 'v2' }).expect(404); // ya descartado
  const an = await crearBorrador(app, n);
  const actN = await activar(app, n.pro, an.planId, an.version).expect(200);
  await pn.post(pln(an.planId)).send({ expectedVersion: actN.body.data.version }).expect(422); // PLAN_NOT_EDITABLE

  // PLE-05
  const e = await circuitoListoParaPlanificarEntrenamiento(app, 'contrato-descarte');
  const pe = conSesion(app, e.pro.token);
  const be = await crearBorradorDeEntrenamiento(app, e);
  const ple = (id: string) => `/api/v1/training/plans/${id}/discard`;
  await pe.post(ple(be.planId)).send({ expectedVersion: be.version, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await sinClave(e.pro.token, ple(be.planId)).send({ expectedVersion: be.version }).expect(400); // INVALID_REQUEST: sin Idempotency-Key
  await request(servidor).post(ple(be.planId)).send({ expectedVersion: be.version }).expect(401);
  await pe.post(ple(be.planId)).send({ expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  await pe.post(ple(ajeno)).send({ expectedVersion: 'v1' }).expect(404);
  const claveE = claveDeIdempotencia();
  await pe.post(ple(be.planId), claveE).send({ expectedVersion: be.version }).expect(200);
  await pe.post(ple(be.planId), claveE).send({ expectedVersion: 'v9' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pe.post(ple(be.planId)).send({ expectedVersion: 'v2' }).expect(404); // ya descartado
  const ae = await crearBorradorDeEntrenamiento(app, e);
  const actE = await activarPlanDeEntrenamiento(app, e.pro, ae.planId, ae.version).expect(200);
  await pe.post(ple(ae.planId)).send({ expectedVersion: actE.body.data.version }).expect(422); // PLAN_NOT_EDITABLE
});

it('TEST-CT (WP-TABLERO-ALTA-GAMA, TB-52 a TB-56): RES-01 a 04 y 06 a 10 — lo de otras áreas, el plan del otro y el pedido (DL-163 D-13, ampliada)', async () => {
  const c = await circuitoConPlanActivo(app, 'ct-res');
  const ent = await prepararProfesional(app, 'ct-res-ent', ['ENTRENAMIENTO']);
  const ajeno = await prepararProfesional(app, 'ct-res-ajeno', ['ENTRENAMIENTO']);
  await vinculoCompleto(app, ent, c.ase, 'ENTRENAMIENTO');
  const yo = conSesion(app, c.ase.token);
  const delEnt = conSesion(app, ent.token);
  const servidor = app.getHttpServer();
  const PLAN = VERSION_VIGENTE.RESUMENES_Y_PLAN_COMPARTIDOS.id;
  const AMBOS = { summary: VERSION_VIGENTE.RESUMENES_COMPARTIDOS.id, summaryAndPlan: PLAN };
  const OTRAS = `/api/v1/advisees/${c.ase.id}/shared-summaries`;
  const PEDIR = `${OTRAS}/access-requests`;
  const pedido = { scope: 'ENTRENAMIENTO', area: 'NUTRICION' };

  // RES-01 — lo que comparto
  await yo.get('/api/v1/me/summary-sharing').expect(200);
  await yo.get('/api/v1/me/summary-sharing?x=1').expect(400); // INVALID_REQUEST
  await request(servidor).get('/api/v1/me/summary-sharing').expect(401);

  // RES-04 — las otras áreas, para el profesional
  await delEnt.get(OTRAS).expect(200);
  await delEnt.get(`${OTRAS}?x=1`).expect(400); // INVALID_REQUEST
  await conSesion(app, ajeno.token).get(OTRAS).expect(404);

  // RES-08 — pedir ver el plan
  const clave = claveDeIdempotencia();
  const creado = (await delEnt.post(PEDIR, clave).send(pedido).expect(201)).body.data as { accessRequestId: string };
  await delEnt.post(PEDIR, clave).send(pedido).expect(201); // replay
  await delEnt.post(PEDIR, clave).send({ scope: 'NUTRICION', area: 'ENTRENAMIENTO' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await delEnt.post(PEDIR).send(pedido).expect(422); // PLAN_ACCESS_REQUEST_TOO_SOON
  await delEnt.post(PEDIR).send({ scope: 'ENTRENAMIENTO', area: 'ANTROPOMETRIA' }).expect(400); // INVALID_REQUEST
  await delEnt.post(PEDIR).send({ ...pedido, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await conSesion(app, ajeno.token).post(PEDIR).send(pedido).expect(404);
  await request(servidor).post(PEDIR).set('Authorization', `Bearer ${ent.token}`).send(pedido).expect(400); // sin Idempotency-Key
  const solo = await circuitoDeEntrenamiento(app, 'ct-res-solo');
  await conSesion(app, solo.pro.token).post(`/api/v1/advisees/${solo.ase.id}/shared-summaries/access-requests`).send(pedido).expect(422); // PLAN_ACCESS_NOT_REQUESTABLE

  // RES-09 — los pedidos que esperan
  await yo.get('/api/v1/me/summary-sharing/access-requests').expect(200);
  await yo.get('/api/v1/me/summary-sharing/access-requests?x=1').expect(400); // INVALID_REQUEST
  await request(servidor).get('/api/v1/me/summary-sharing/access-requests').expect(401);

  // RES-10 — responder
  const responder = (id: string, cuerpo: Record<string, unknown>, k?: string) => yo.post(`/api/v1/me/summary-sharing/access-requests/${id}/answer`, k).send(cuerpo);
  const si = { expectedVersion: 'v1', answer: 'SHARE', sharing: { expectedVersion: null, textVersionId: PLAN } };
  await responder(creado.accessRequestId, { ...si, sharing: null }).expect(400); // INVALID_REQUEST
  await responder(creado.accessRequestId, { ...si, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await responder(randomUUID(), si).expect(404);
  await responder(creado.accessRequestId, { ...si, sharing: { ...si.sharing, textVersionId: VERSION_VIGENTE.HABITOS_COMPARTIDOS.id } }).expect(409); // CONSENT_VERSION_STALE
  await responder(creado.accessRequestId, { ...si, expectedVersion: 'v2' }).expect(409); // VERSION_CONFLICT
  const claveSi = claveDeIdempotencia();
  await responder(creado.accessRequestId, si, claveSi).expect(200);
  await responder(creado.accessRequestId, si, claveSi).expect(200); // replay
  await responder(creado.accessRequestId, { ...si, answer: 'NOT_NOW', sharing: null }, claveSi).expect(409); // IDEMPOTENCY_KEY_REUSED
  await request(servidor).post(`/api/v1/me/summary-sharing/access-requests/${creado.accessRequestId}/answer`).set('Authorization', `Bearer ${c.ase.token}`).send(si).expect(400); // sin Idempotency-Key
  await delEnt.post(PEDIR).send(pedido).expect(422); // PLAN_ALREADY_SHARED

  // RES-06 — el plan del otro
  await delEnt.get(`${OTRAS}/NUTRICION/plan`).expect(200);
  await delEnt.get(`${OTRAS}/NUTRICION/plan?x=1`).expect(400); // INVALID_REQUEST
  await delEnt.get(`${OTRAS}/OTRA/plan`).expect(404);
  await conSesion(app, ajeno.token).get(`${OTRAS}/NUTRICION/plan`).expect(404);
  await request(servidor).get(`${OTRAS}/NUTRICION/plan`).expect(401);

  // RES-07 — con quién se comparte lo de mi área
  await conSesion(app, c.pro.token).get(`${OTRAS}/outgoing`).expect(200);
  await conSesion(app, c.pro.token).get(`${OTRAS}/outgoing?x=1`).expect(400); // INVALID_REQUEST
  await conSesion(app, ajeno.token).get(`${OTRAS}/outgoing`).expect(404);

  // RES-02 — compartir, o cambiar con quiénes y en qué nivel
  const compartir = (cambios: Record<string, unknown>, k?: string) =>
    yo.put('/api/v1/me/summary-sharing', k).send({ expectedVersion: 'v1', acceptedTexts: AMBOS, grants: [{ professionalId: ent.id, area: 'NUTRICION', level: 'SUMMARY' }], ...cambios });
  await compartir({ grants: [{ professionalId: ajeno.id, area: 'NUTRICION', level: 'SUMMARY' }] }).expect(422); // SUMMARY_RECIPIENT_NOT_AVAILABLE
  await compartir({ grants: [{ professionalId: ent.id, area: 'ANTROPOMETRIA', level: 'SUMMARY_AND_PLAN' }] }).expect(400); // INVALID_REQUEST
  await compartir({ extra: 1 }).expect(400); // UNKNOWN_FIELD
  await compartir({ expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  await compartir({ acceptedTexts: { summary: VERSION_VIGENTE.HABITOS_COMPARTIDOS.id, summaryAndPlan: null } }).expect(409); // CONSENT_VERSION_STALE
  await request(servidor).put('/api/v1/me/summary-sharing').set('Authorization', `Bearer ${c.ase.token}`).send({ expectedVersion: 'v1', acceptedTexts: AMBOS, grants: [] }).expect(400); // sin Idempotency-Key
  await compartir({}).expect(200); // bajar a «resumen»: v2
  await compartir({ expectedVersion: 'v2', grants: [{ professionalId: ent.id, area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' }], acceptedTexts: { summary: null, summaryAndPlan: null } }).expect(422); // SHARING_TEXT_REQUIRED
  const claveDos = claveDeIdempotencia();
  await compartir({ expectedVersion: 'v2', grants: [{ professionalId: ent.id, area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' }] }, claveDos).expect(200); // v3
  await compartir({ expectedVersion: 'v2' }, claveDos).expect(409); // IDEMPOTENCY_KEY_REUSED

  // RES-03 — dejar de compartir
  await yo.post('/api/v1/me/summary-sharing/withdrawal').send({ expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  await yo.post('/api/v1/me/summary-sharing/withdrawal').send({ expectedVersion: 'v3', extra: 1 }).expect(400); // UNKNOWN_FIELD
  await yo.post('/api/v1/me/summary-sharing/withdrawal').send({ expectedVersion: 'v3' }).expect(200);

  // Sin el A3 vigente: 403 en lo propio (retirar y bajar no lo exigen).
  await conSesion(app, c.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, c.ase.token)}/revoke`).send({}).expect(200);
  await yo.get('/api/v1/me/summary-sharing').expect(403);
  await yo.get('/api/v1/me/summary-sharing/access-requests').expect(403);
  await compartir({ expectedVersion: 'v4' }).expect(403); // ampliar, después de retirar
});

it('TEST-CT (WP-EDITORES-PROFESIONAL): FZA-01 a 03, HAB-06 a 08, HAN-06 a 08 y PLN-01, con éxitos y errores declarados (DL-167 y DL-171)', async () => {
  const servidor = app.getHttpServer();
  const ajeno = randomUUID();
  const sinClave = (token: string, ruta: string) => request(servidor).post(ruta).set('Authorization', `Bearer ${token}`);
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  // FZA-01 a 03 (ED-72): la serie observada.
  const e = await circuitoDeEntrenamiento(app, 'ct-fuerza');
  const pe = conSesion(app, e.pro.token);
  const tercero = conSesion(app, (await prepararProfesional(app, 'ct-fuerza-tercero', ['ENTRENAMIENTO'])).token);
  const observadas = `/api/v1/advisees/${e.ase.id}/training/observed-sets`;
  const serie = { exerciseId: 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7', localDate: hoy, timeZone: 'America/Argentina/Buenos_Aires', load: { value: 85, unit: 'kg' }, completedRepetitions: 5, rir: 1 };
  const clave = claveDeIdempotencia();
  const creada = await pe.post(observadas, clave).send(serie).expect(201);
  await pe.post(observadas, clave).send({ ...serie, rir: 2 }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pe.post(observadas).send({ ...serie, rir: 3 }).expect(422); // STRENGTH_OBSERVATION_NOT_ESTIMABLE
  await pe.post(observadas).send({ ...serie, localDate: '2999-01-01' }).expect(422); // VALIDATION_FAILED
  await pe.post(observadas).send({ ...serie, extra: 1 }).expect(400); // UNKNOWN_FIELD
  await sinClave(e.pro.token, observadas).send(serie).expect(400); // INVALID_REQUEST: sin Idempotency-Key
  await request(servidor).post(observadas).send(serie).expect(401);
  await tercero.post(observadas).send(serie).expect(404);
  await pe.get(observadas).expect(200);
  await pe.get(`${observadas}?exerciseId=no`).expect(400);
  await tercero.get(observadas).expect(404);
  await request(servidor).get(observadas).expect(401);
  const sucesoras = (id: string) => `/api/v1/training/observed-sets/${id}/successors`;
  const id = creada.body.data.observationId as string;
  const corregir = { action: 'CORRECT', expectedVersion: 'v1', reason: 'Eran 4.', observation: { ...serie, completedRepetitions: 4, exerciseId: undefined } };
  await pe.post(sucesoras(id)).send({ ...corregir, expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  await pe.post(sucesoras(id)).send({ ...corregir, observation: { ...corregir.observation, rir: null } }).expect(422);
  await pe.post(sucesoras(id)).send({ action: 'BORRAR', expectedVersion: 'v1', reason: 'x' }).expect(400);
  await sinClave(e.pro.token, sucesoras(id)).send(corregir).expect(400);
  await request(servidor).post(sucesoras(id)).send(corregir).expect(401);
  await pe.post(sucesoras(ajeno)).send(corregir).expect(404);
  const claveS = claveDeIdempotencia();
  const nueva = await pe.post(sucesoras(id), claveS).send(corregir).expect(201);
  await pe.post(sucesoras(id), claveS).send({ ...corregir, reason: 'Otro motivo' }).expect(409); // IDEMPOTENCY_KEY_REUSED
  await pe.post(sucesoras(nueva.body.data.observation.observationId)).send({ action: 'VOID', expectedVersion: 'v2', reason: 'No era de esta persona.' }).expect(201);

  // HAB-06 a 08 (ED-13): la prescripción habitual.
  const fuerza = { sets: [{ repetitions: { value: 3 }, rir: 1 }], intensity: { criterion: 'RIR', target: { value: 1 } } };
  const prescripciones = '/api/v1/training/prescription-presets';
  const guardada = await pe.post(prescripciones).send({ name: 'Fuerza de contrato', prescription: fuerza }).expect(201);
  await pe.post(prescripciones).send({ name: 'fuerza de contrato', prescription: fuerza }).expect(409); // PRESET_NAME_TAKEN
  await pe.post(prescripciones).send({ name: 'Otra', prescription: fuerza, replaces: ajeno, expectedVersion: 'v1' }).expect(404);
  await pe.post(prescripciones).send({ name: 'Fuerza de contrato', prescription: fuerza, replaces: guardada.body.data.presetId, expectedVersion: 'v9' }).expect(409); // VERSION_CONFLICT
  await pe.post(prescripciones).send({ name: 'RPE', prescription: { ...fuerza, intensity: { criterion: 'RPE', target: { value: 8 } } } }).expect(422);
  await pe.post(prescripciones).send({ name: 'Con carga', prescription: { ...fuerza, sets: [{ repetitions: { value: 3 }, suggestedLoad: { value: 100, unit: 'kg' } }] } }).expect(400);
  await sinClave(e.pro.token, prescripciones).send({ name: 'Sin clave', prescription: fuerza }).expect(400);
  await request(servidor).post(prescripciones).send({ name: 'x', prescription: fuerza }).expect(401);
  await conSesion(app, e.ase.token).post(prescripciones).send({ name: 'x', prescription: fuerza }).expect(403);
  await pe.get(prescripciones).expect(200);
  await pe.get(`${prescripciones}?x=1`).expect(400);
  await request(servidor).get(prescripciones).expect(401);
  await conSesion(app, e.ase.token).get(prescripciones).expect(403);
  const unaPrescripcion = `${prescripciones}/${guardada.body.data.presetId}`;
  await pe.patch(unaPrescripcion).send({ expectedVersion: 'v9', name: 'Otro' }).expect(409);
  await pe.patch(unaPrescripcion).send({ expectedVersion: 'v1' }).expect(400);
  await pe.patch(`${prescripciones}/${ajeno}`).send({ expectedVersion: 'v1', name: 'Otro' }).expect(404);
  await request(servidor).patch(unaPrescripcion).send({ expectedVersion: 'v1', name: 'Otro' }).expect(401);
  await conSesion(app, e.ase.token).patch(unaPrescripcion).send({ expectedVersion: 'v1', name: 'Otro' }).expect(403);
  await pe.patch(unaPrescripcion).send({ expectedVersion: 'v1', state: 'REMOVED' }).expect(200);

  // HAN-06 a 08 (ED-13): el reparto habitual, en gramos por día.
  const n = await circuitoListoParaPlanificar(app, 'ct-repartos');
  const pn = conSesion(app, n.pro.token);
  const reparto = { protein: { value: 140, unit: 'g/day' }, carbohydrate: { value: 250, unit: 'g/day' }, fat: { value: 70, unit: 'g/day' } };
  const repartos = '/api/v1/nutrition/macro-presets';
  const guardado = await pn.post(repartos).send({ name: 'Reparto de contrato', distribution: reparto }).expect(201);
  await pn.post(repartos).send({ name: 'reparto de contrato', distribution: reparto }).expect(409);
  await pn.post(repartos).send({ name: 'Otro', distribution: reparto, replaces: ajeno, expectedVersion: 'v1' }).expect(404);
  await pn.post(repartos).send({ name: 'Reparto de contrato', distribution: reparto, replaces: guardado.body.data.presetId, expectedVersion: 'v9' }).expect(409);
  await pn.post(repartos).send({ name: 'En proporción', distribution: { ...reparto, fat: { value: 30, unit: 'energy_share' } } }).expect(400);
  await sinClave(n.pro.token, repartos).send({ name: 'Sin clave', distribution: reparto }).expect(400);
  await request(servidor).post(repartos).send({ name: 'x', distribution: reparto }).expect(401);
  await conSesion(app, n.ase.token).post(repartos).send({ name: 'x', distribution: reparto }).expect(403);
  await pn.get(repartos).expect(200);
  await pn.get(`${repartos}?x=1`).expect(400);
  await request(servidor).get(repartos).expect(401);
  await conSesion(app, n.ase.token).get(repartos).expect(403);
  const unReparto = `${repartos}/${guardado.body.data.presetId}`;
  await pn.patch(unReparto).send({ expectedVersion: 'v9', name: 'Otro' }).expect(409);
  await pn.patch(unReparto).send({ expectedVersion: 'v1' }).expect(400);
  await pn.patch(`${repartos}/${ajeno}`).send({ expectedVersion: 'v1', name: 'Otro' }).expect(404);
  await request(servidor).patch(unReparto).send({ expectedVersion: 'v1', name: 'Otro' }).expect(401);
  await conSesion(app, n.ase.token).patch(unReparto).send({ expectedVersion: 'v1', name: 'Otro' }).expect(403);
  await pn.patch(unReparto).send({ expectedVersion: 'v1', state: 'REMOVED' }).expect(200);

  // PLN-01: los totales del plan, del profesional del plan.
  const b = await crearBorrador(app, n);
  const totales = (planId: string) => `/api/v1/nutrition/plans/${planId}/option-estimates`;
  await pn.get(totales(b.planId)).expect(200);
  await pn.get(`${totales(b.planId)}?x=1`).expect(400);
  await pn.get(totales(ajeno)).expect(404);
  await conSesion(app, n.ase.token).get(totales(b.planId)).expect(404);
  await request(servidor).get(totales(b.planId)).expect(401);

  // PLN-02 y 03: los rangos de macronutrientes, con el peso a mano (este profesional no tiene Antropometría).
  const rangos = (planId: string) => `/api/v1/nutrition/plans/${planId}/ranges`;
  const dayTypeId = (b.body.dayTypes as { dayTypeId: string }[])[0]!.dayTypeId;
  const conRangos = { expectedRevision: 0, bodyWeight: { source: 'MANUAL', valueKg: 70, measuredOn: hoy }, dayTypes: [{ dayTypeId, day: { protein: { unit: 'g_per_kg', min: 1.6, max: 2 } }, meals: [] }] };
  await pn.get(rangos(b.planId)).expect(200);
  await pn.get(`${rangos(b.planId)}?x=1`).expect(400);
  await pn.get(rangos(ajeno)).expect(404);
  await conSesion(app, n.ase.token).get(rangos(b.planId)).expect(404);
  await request(servidor).get(rangos(b.planId)).expect(401);
  await pn.put(rangos(b.planId)).send(conRangos).expect(200);
  await pn.put(rangos(b.planId)).send(conRangos).expect(409);
  await pn.put(rangos(b.planId)).send({ ...conRangos, expectedRevision: 1, bodyWeight: { source: 'RECORDED', measurementId: ajeno } }).expect(422);
  await pn.put(rangos(b.planId)).send({ ...conRangos, extra: 1 }).expect(400);
  await pn.put(rangos(ajeno)).send(conRangos).expect(404);
  await request(servidor).put(rangos(b.planId)).send(conRangos).expect(401);
});

it('TEST-CT (WP-PULIDO-GRANDES, DL-173): la nota para tu profe (TRN-25, LISTA y PROPIA) y las notas propias del profesional (NPP-01 a 03)', async () => {
  const servidor = app.getHttpServer();
  const ajeno = randomUUID();
  // PG-15: una sesión registrada por la persona.
  const c = await circuitoConPlanDeEntrenamientoActivo(app, 'contrato-notas');
  const ase = conSesion(app, c.ase.token);
  const pro = conSesion(app, c.pro.token);
  const hoy = (await ase.get('/api/v1/me/training/today').expect(200)).body.data;
  const borrador = (await ase.put(`/api/v1/training/occurrences/${hoy.occurrences[0].occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
  const serie = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 2, perceivedExertion: null };
  const guardado = (
    await ase
      .patch(`/api/v1/training/execution-drafts/${borrador.draftId}`)
      .send({ expectedVersion: borrador.version, changes: { granularity: 'SET', exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie] }], sessionCondition: 'COMPLETED' } })
      .expect(200)
  ).body.data;
  const executionId = (await ase.post(`/api/v1/training/execution-drafts/${borrador.draftId}/confirm`).send({ expectedVersion: guardado.version }).expect(201)).body.data.executionId as string;
  // TRN-25
  const notas = `/api/v1/training/executions/${executionId}/notes`;
  const clave = claveDeIdempotencia();
  await ase.post(notas, clave).send({ text: 'Algo me molestó.' }).expect(201);
  await ase.post(notas, clave).send({ text: 'Otra cosa' }).expect(409);
  await ase.post(notas).send({ text: 'x'.repeat(281) }).expect(400);
  await ase.post(notas).send({ text: 'ok', extra: 1 }).expect(400);
  await pro.post(notas).send({ text: 'Por ella' }).expect(404);
  await ase.post(`/api/v1/training/executions/${ajeno}/notes`).send({ text: 'Nada' }).expect(404);
  await request(servidor).post(notas).set('Idempotency-Key', claveDeIdempotencia()).send({ text: 'Sin sesión' }).expect(401);
  for (let i = 0; i < 19; i++) await ase.post(notas).send({ text: `Nota ${i}` }).expect(201);
  await ase.post(notas).send({ text: 'La 21' }).expect(422);
  // TRN-25-PROPIA
  await ase.get(`/api/v1/me/training/executions/${executionId}/notes`).expect(200);
  await ase.get(`/api/v1/me/training/executions/${executionId}/notes?x=1`).expect(400);
  await ase.get(`/api/v1/me/training/executions/${ajeno}/notes`).expect(404);
  await request(servidor).get(`/api/v1/me/training/executions/${executionId}/notes`).expect(401);
  // TRN-25-LISTA
  const delPeriodo = `/api/v1/advisees/${c.ase.id}/training/execution-notes`;
  await pro.get(`${delPeriodo}?periodStart=${hoy.date}&periodEnd=${hoy.date}`).expect(200);
  await pro.get(delPeriodo).expect(400);
  await pro.get(`/api/v1/advisees/${ajeno}/training/execution-notes?periodStart=${hoy.date}&periodEnd=${hoy.date}`).expect(404);
  await request(servidor).get(`${delPeriodo}?periodStart=${hoy.date}&periodEnd=${hoy.date}`).expect(401);
  // PG-16: NPP-01
  const propias = `/api/v1/advisees/${c.ase.id}/professional-notes`;
  const claveDeLaNota = claveDeIdempotencia();
  const nota = (await pro.post(propias, claveDeLaNota).send({ text: 'Le molesta la rodilla' }).expect(201)).body.data;
  await pro.post(propias, claveDeLaNota).send({ text: 'Otra' }).expect(409);
  await pro.post(propias).send({ text: 'x'.repeat(1001) }).expect(400);
  await pro.post(propias).send({ text: 'x', anchor: { type: 'EXERCISE', exerciseId: ajeno } }).expect(422);
  await pro.post(`/api/v1/advisees/${ajeno}/professional-notes`).send({ text: 'x' }).expect(404);
  await request(servidor).post(propias).set('Idempotency-Key', claveDeIdempotencia()).send({ text: 'x' }).expect(401);
  // NPP-02
  await pro.get(propias).expect(200);
  await pro.get(`${propias}?x=1`).expect(400);
  await ase.get(propias).expect(404);
  await request(servidor).get(propias).expect(401);
  // NPP-03
  const archivo = `/api/v1/professional-notes/${nota.noteId}/archive`;
  const claveDelArchivo = claveDeIdempotencia();
  await pro.post(archivo, claveDelArchivo).send({}).expect(200);
  await pro.post(archivo, claveDelArchivo).send({ extra: 1 }).expect(400);
  await pro.post(archivo).send({}).expect(200);
  await ase.post(archivo).send({}).expect(404);
  await pro.post(`/api/v1/professional-notes/${ajeno}/archive`).send({}).expect(404);
  await request(servidor).post(archivo).set('Idempotency-Key', claveDeIdempotencia()).send({}).expect(401);
});

it('TEST-CT: todo (status, código) observado está declarado para su operación; los éxitos coinciden con el contrato', () => {
  const noDeclaradas: string[] = [];
  const porOperacion = new Map<string, Set<string>>();
  for (const o of observadas) {
    const op = operacionDe(o.metodo, o.ruta);
    if (!op) {
      noDeclaradas.push(`${o.metodo.toUpperCase()} ${o.ruta} (operación fuera del contrato)`);
      continue;
    }
    const vistos = porOperacion.get(op.id) ?? new Set<string>();
    vistos.add(`${o.status}${o.codigo ? ` ${o.codigo}` : ''}`);
    porOperacion.set(op.id, vistos);
    if (o.status < 400) {
      if (!op.exitos.some((e) => e.status === o.status)) noDeclaradas.push(`${op.id}: éxito ${o.status} (declarados ${op.exitos.map((e) => e.status).join(', ')})`);
      continue;
    }
    const declarados = erroresDeclarados(op.id)[String(o.status)] ?? [];
    if (!o.codigo || !declarados.includes(o.codigo)) noDeclaradas.push(`${op.id}: ${o.status} ${o.codigo ?? '(sin ErrorEnvelope)'}`);
  }
  process.stdout.write(`${JSON.stringify({ prueba: 'TEST-CT', observadas: Object.fromEntries([...porOperacion].map(([k, v]) => [k, [...v].sort()])) })}\n`);
  expect(noDeclaradas).toEqual([]);
  expect([...porOperacion.keys()].filter((id) => EN_CONSTRUCCION.has(id))).toEqual([]);
  expect([...porOperacion.keys()].sort()).toEqual(OPERACIONES.map((o) => o.id).filter((id) => !EN_CONSTRUCCION.has(id)).sort());
});
