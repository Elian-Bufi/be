/**
 * DL-152 · lo que leen las APK publicadas que importan hoy, contra la API de hoy y PostgreSQL real.
 *
 * Cada APK valida las respuestas con esquemas estrictos: un campo nuevo, un valor nuevo de una enumeración o un `null`
 * donde no lo había, en una respuesta que lee una APK instalada, hacen fallar esa pantalla en el teléfono («respuesta no
 * reconocida»). Esta prueba pide cada operación que llama cada APK congelada en `packages/domain/fixtures/lecturas-de-la-apk/`
 * (hoy la estable 0.13.2 y la 0.17.0-candidata.3), como la pide esa APK, y lee la respuesta real con el esquema de esa APK
 * (`soporte-lecturas-de-la-apk.ts`). Al final exige haber leído todas: una APK congelada nueva no pasa hasta que cada
 * lectura suya tenga escenario.
 *
 * Lo que se arma alrededor (los profesionales, los vínculos, los planes, las revisiones) va por la API de hoy, como en el
 * resto de las pruebas: lo que se prueba es lo que pide y lee la APK. Las respuestas se leen con datos de verdad, también
 * en las ramas más cargadas de cada esquema: una opción de receta con su imagen, un plan con objetivos por serie y la imagen
 * del ejercicio, eventos de tiempo, una revisión que cambia el objetivo, una respuesta de formulario rectificada.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { appDePrueba, conSesion, correoSintetico, CREDENCIAL_SINTETICA, OTRA_CREDENCIAL_SINTETICA, registrarOk } from './soporte-api';
import { circuitoAntropometrico } from './soporte-antropometria';
import { CATALOGO_DE_EJERCICIOS, circuitoConPlanDeEntrenamientoActivo } from './soporte-entrenamiento';
import { CLIENTE_APK, googleDePrueba, idTokenDeGoogle, levantarGoogleFalso, reclamosDeGoogle, subSintetico, type GoogleFalso } from './soporte-google';
import { LaApk, VERSIONES } from './soporte-lecturas-de-la-apk';
import { activar as activarPlanNutricional, circuitoConPlanActivo, circuitoListoParaPlanificar, crearBorrador, cuerpoDeObjetivo, cuerpoDeRevision, patchConSesion, registrarComida } from './soporte-nutricion';
import {
  activar as activarLaDemo,
  asociarImagen,
  borradorDeLaDemo,
  corrida,
  cuerpoDeImagen,
  IMAGENES_DEL_PAQUETE,
  pasosDelEjemplo,
  prescripcionIdDe,
  SESION_DEMO,
  SESION_ID,
  subirImagenDeEjercicio,
} from './soporte-por-serie';
import { alimentosUsda, crearReceta, cuerpoDeReceta, estructuraConRecetas, FOTOS, RECETAS, subirImagen } from './soporte-recetas';
import { prepararAsesorado, prepararProfesional, solicitar, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let google: GoogleFalso;
let contador = 0;
const etiqueta = (nombre: string): string => `${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  // DL-138: un Google falso local, para la familia GOO que lee la candidata; ninguna prueba consulta a Google.
  google = await levantarGoogleFalso();
  app = await appDePrueba(googleDePrueba(google));
}, 120_000);
afterAll(async () => {
  await app?.close();
  await google?.cerrar();
  await prisma.$disconnect();
});

const ZONA = 'America/Argentina/Buenos_Aires';
const restarDias = (fecha: string, dias: number): string => new Date(Date.parse(`${fecha}T12:00:00.000Z`) - dias * 86_400_000).toISOString().slice(0, 10);
/** Una foto sintética de una comida, en JPEG, como la que manda la APK desde la cámara. */
const fotoDeUnaComida = () => sharp({ create: { width: 320, height: 240, channels: 3, background: { r: 200, g: 120, b: 40 } } }).jpeg().toBuffer();

/** Las plantillas de formularios sembradas por la migración (las mismas de `contrato.int-spec.ts` y `formularios-alcance`). */
const VERSION_SALUD = '349161b3-b831-4df1-896f-484517393a57';
const VERSION_ANTECEDENTES = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const CAMPOS_DE_ANTECEDENTES = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];

/**
 * Lo que una APK lee pero hoy no puede recibir una respuesta exitosa, por una decisión registrada. De eso se lee el
 * rechazo, con el sobre de error de esa APK.
 * - 0.13.2 · API-ACC-01: desde DL-138 (D-10), una APK sin la casilla de mayoría de edad no crea cuentas. Recibe el 422
 *   TERMS_VERSION_NOT_ACCEPTABLE, que traduce a «Los textos cambiaron. Actualizá la app para continuar.».
 */
const SOLO_EL_RECHAZO: Readonly<Record<string, readonly string[]>> = { '0.13.2': ['API-ACC-01'] };

describe.each(VERSIONES)('DL-152 · la APK %s, contra la API de hoy', (version) => {
  const apk = new LaApk(version, () => app);
  /** La etiqueta de las cuentas sintéticas: el versionCode, corto, para que los correos no se acerquen a 64 caracteres. */
  const corta = `apk${apk.congelado.apk.versionCode}`;
  /** Un `it` que corre solo si esta APK llama la operación (si no, queda como omitido en el informe). */
  const siLee = (operacion: string) => (apk.lee(operacion) ? it : it.skip);

  // ─── La cuenta ─────────────────────────────────────────────────────────────────────────────────

  it('la cuenta: el alta, la sesión, el A3, el perfil y el cierre (ACC-01 a 05, ACC-06, ACC-P1-03, CON-05 a 08)', async () => {
    const t = apk.textos;
    const correo = correoSintetico(etiqueta(`${corta}-cuenta`));
    const alta = {
      registrationIntent: 'ADVISEE',
      identity: { localIdentifier: correo, localCredential: CREDENCIAL_SINTETICA },
      termsAcceptance: { versionId: t.TERMINOS },
      privacyAcknowledgement: { versionId: t.PRIVACIDAD_INFO },
    };
    if (apk.mandaElCampo('API-ACC-01', 'adultDeclaration')) {
      await apk.pide('API-ACC-01', { cuerpo: { ...alta, adultDeclaration: { versionId: t.MAYORIA_DE_EDAD, declared: true } }, status: 201 });
    } else {
      // DL-138 D-10: el rechazo decidido, en la forma que esta APK reconoce. La cuenta se crea como hoy, para seguir.
      const rechazo = await apk.pide('API-ACC-01', { cuerpo: alta, status: 422 });
      expect(rechazo.body.error.code).toBe('TERMS_VERSION_NOT_ACCEPTABLE');
      await registrarOk(app, correo, 'APK');
    }
    const entrar = async (): Promise<string> =>
      (await apk.pide('API-ACC-02', { cuerpo: { method: 'LOCAL', identifier: correo, credential: CREDENCIAL_SINTETICA }, status: 201 })).body.data.session.accessToken as string;
    // La contraseña equivocada: el rechazo neutral, en la forma que la APK reconoce.
    await apk.pide('API-ACC-02', { cuerpo: { method: 'LOCAL', identifier: correo, credential: OTRA_CREDENCIAL_SINTETICA }, status: 401 });
    const token = await entrar();
    await apk.pide('API-ACC-05', { token });

    // El A3: el requisito, el otorgamiento con la versión que mostró, el historial y la revocación.
    const requisito = await apk.pide('API-CON-05', { token });
    const a3 = await apk.pide('API-CON-06', { token, cuerpo: { consentVersionId: requisito.body.data.consentVersion.id }, status: 201 });
    await apk.pide('API-CON-05', { token });
    await apk.pide('API-CON-07', { token });
    await apk.pide('API-CON-08', { token, params: { consentId: a3.body.data.consentId }, cuerpo: {} });
    await apk.pide('API-CON-07', { token });

    if (apk.lee('API-ACC-06-PROPIA')) {
      const perfil = await apk.pide('API-ACC-06-PROPIA', { token });
      await apk.pide('API-ACC-06', { token, cuerpo: { expectedVersion: perfil.body.data.version, changes: { displayName: 'Persona de la APK' } } });
      await apk.pide('API-ACC-06-PROPIA', { token });
    }

    // Cerrar todas las sesiones (ACC-04) y la actual (ACC-03), sin cuerpo; la sesión cerrada, el 401 que la APK reconoce.
    await apk.pide('API-ACC-04', { token, status: 204 });
    await apk.pide('API-ACC-05', { token, status: 401 });
    await apk.pide('API-ACC-03', { token: await entrar(), status: 204 });
    // El cierre de la cuenta, con la versión de las consecuencias del commit de la APK. Al final: la cuenta queda cerrándose.
    await apk.pide('API-ACC-P1-03', { token: await entrar(), cuerpo: { consequencesAcknowledgement: { versionId: t.CONSECUENCIAS_DE_CIERRE }, confirmed: true }, status: 201 });
    expect(apk.rechazos()).toEqual([]);
  });

  // ─── El vínculo y los consentimientos ─────────────────────────────────────────────────────────

  it('el vínculo: las solicitudes, aceptar y rechazar, el B2, la evidencia visual, pausar, reanudar y finalizar, y la invitación (REL-02 a 09, CON-01 a 04, EVI-01 a 04, INV-04 y 05)', async () => {
    const e = etiqueta(`${corta}-rel`);
    const pn = await prepararProfesional(app, e, ['NUTRICION']);
    const pt = await prepararProfesional(app, `${e}-t`, ['ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, e, { a3: true });
    const token = ase.token;
    const paraAceptar = (await solicitar(app, pn, ase.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
    const paraRechazar = (await solicitar(app, pt, ase.id, 'ENTRENAMIENTO').expect(201)).body.data.relationshipRequestId as string;

    const pendientes = (await apk.pide('API-REL-02', { token, consulta: { state: 'PENDIENTE' } })).body.data as { relationshipRequestId: string; version: string }[];
    const versionMostrada = (id: string) => pendientes.find((s) => s.relationshipRequestId === id)!.version;
    await apk.pide('API-REL-02', { token });
    // Aceptar con una versión vieja: el 409, en la forma que la APK reconoce.
    await apk.pide('API-REL-03', { token, params: { requestId: paraAceptar }, cuerpo: { expectedVersion: 'v9' }, status: 409 });
    const aceptada = await apk.pide('API-REL-03', { token, params: { requestId: paraAceptar }, cuerpo: { expectedVersion: versionMostrada(paraAceptar) }, status: 200 });
    const vinculoId = aceptada.body.data.relationshipId as string;
    await apk.pide('API-REL-04', { token, params: { requestId: paraRechazar }, cuerpo: { expectedVersion: versionMostrada(paraRechazar) }, status: 200 });
    await apk.pide('API-REL-05', { token });
    await apk.pide('API-REL-05', { token, consulta: { state: 'ACEPTADO' } });
    const versionDelVinculo = async () => (await apk.pide('API-REL-06', { token, params: { relationshipId: vinculoId } })).body.data.version as string;
    await versionDelVinculo();

    // El B2: el requisito y el otorgamiento con la versión que mostró.
    const requisitos = await apk.pide('API-CON-01', { token, params: { relationshipId: vinculoId } });
    const b2 = await apk.pide('API-CON-02', { token, params: { relationshipId: vinculoId }, cuerpo: { consentVersionId: requisitos.body.data.consentVersion.id }, status: 201 });
    await apk.pide('API-CON-03', { token });

    if (apk.lee('API-EVI-01')) {
      // La evidencia visual (DL-125): el requisito, el acto con la versión que mostró, la lista y la revocación.
      const evidencia = await apk.pide('API-EVI-01', { token, params: { relationshipId: vinculoId } });
      const acto = await apk.pide('API-EVI-02', { token, params: { relationshipId: vinculoId }, cuerpo: { consentVersionId: evidencia.body.data.consentVersion.id }, status: 201 });
      await apk.pide('API-EVI-03', { token });
      await apk.pide('API-EVI-01', { token, params: { relationshipId: vinculoId } });
      await apk.pide('API-EVI-04', { token, params: { consentId: acto.body.data.consentId }, cuerpo: {} });
      await apk.pide('API-EVI-03', { token });
    }

    // Pausar, reanudar, revocar el B2 y finalizar, cada paso con la versión que mostró.
    await apk.pide('API-REL-07', { token, params: { relationshipId: vinculoId }, cuerpo: { expectedVersion: await versionDelVinculo(), reason: 'DISPONIBILIDAD' } });
    await apk.pide('API-REL-08', { token, params: { relationshipId: vinculoId }, cuerpo: { expectedVersion: await versionDelVinculo() } });
    await apk.pide('API-CON-04', { token, params: { consentId: b2.body.data.consentId }, cuerpo: {} });
    await apk.pide('API-CON-03', { token });
    await apk.pide('API-REL-09', { token, params: { relationshipId: vinculoId }, cuerpo: { expectedVersion: await versionDelVinculo(), reason: 'OBJETIVO_CUMPLIDO' } });
    await apk.pide('API-REL-06', { token, params: { relationshipId: vinculoId } });

    if (apk.lee('API-INV-04')) {
      // La invitación (DL-136): quien la recibe la ve y la usa; la solicitud que nace se acepta como cualquier otra.
      const invitacion = (await conSesion(app, pn.token).post('/api/v1/relationship-invitations').send({ scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' }).expect(201)).body.data as { token: string; code: string };
      const invitada = await prepararAsesorado(app, `${e}-inv`);
      await apk.pide('API-INV-04', { token: invitada.token, cuerpo: { code: invitacion.code } });
      await apk.pide('API-INV-04', { token: invitada.token, cuerpo: { code: 'no-es-un-codigo' }, status: 404 });
      await apk.pide('API-INV-05', { token: invitada.token, cuerpo: { token: invitacion.token }, status: 201 });
      // Otra invitación a quien ya tiene la solicitud pendiente: la equivalente (200), que la APK lee con el mismo esquema.
      const otra = (await conSesion(app, pn.token).post('/api/v1/relationship-invitations').send({ scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' }).expect(201)).body.data as { token: string };
      await apk.pide('API-INV-05', { token: invitada.token, cuerpo: { token: otra.token }, status: 200 });
      await apk.pide('API-REL-02', { token: invitada.token, consulta: { state: 'PENDIENTE' } });
    }
    expect(apk.rechazos()).toEqual([]);
  });

  // ─── Nutrición ─────────────────────────────────────────────────────────────────────────────────

  it('la nutrición: «Hoy» con una opción de receta e imagen, registrar, el historial, las comidas v2, las fotos y las revisiones (NUT-14 a 16, ING-01 a 06, MED-01 a 05, NUT-19)', async () => {
    // Un plan con un almuerzo de receta, con su imagen, y una cena a mano (D10: «Hoy» de las APK no trae la receta).
    const c = await circuitoListoParaPlanificar(app, etiqueta(`${corta}-nut`));
    const alimentos = await alimentosUsda(app, c.pro);
    const receta = (await crearReceta(app, c.pro, cuerpoDeReceta(RECETAS[0]!, alimentos)).expect(201)).body.data;
    const imagen = await subirImagen(app, c.pro, FOTOS[0]!);
    const conImagen = (await conSesion(app, c.pro.token).put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: imagen.mediaId, expectedVersion: receta.version }).expect(200)).body.data;
    const borrador = await crearBorrador(app, c);
    const guardado = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${borrador.planId}`)
      .send({ expectedVersion: borrador.version, changes: estructuraConRecetas([{ label: conImagen.name as string, recipeVersionId: conImagen.recipeVersionId as string }], c.pollo) })
      .expect(200);
    await activarPlanNutricional(app, c.pro, borrador.planId, guardado.body.data.version).expect(200);
    const planId = borrador.planId;
    const token = c.ase.token;

    const hoy = await apk.pide('API-NUT-14', { token });
    const dia = hoy.body.data.activePlan.dayTypes[0];
    await apk.pide('API-NUT-14', { token, consulta: { dayTypeId: dia.dayTypeId } });
    const [almuerzo, cena] = dia.meals;

    let ejecucionId: string;
    if (apk.lee('API-NUT-15')) {
      // Registrar la cena del plan con lo que comió, el reintento con la misma clave y una comida fuera del plan.
      const clave = `apk-${randomUUID()}`;
      const cuerpo = {
        activePlanId: planId,
        dayTypeId: dia.dayTypeId,
        occurredAt: new Date().toISOString(),
        recording: { origin: 'PRESCRIBED', mode: 'DISH_OPTIONS', mealId: cena.mealId, optionId: cena.options[0].optionId, consumedItems: [{ itemId: cena.options[0].items[0].itemId, quantity: { value: 120, unit: 'g' } }] },
      };
      const registrada = await apk.pide('API-NUT-15', { token, cuerpo, clave, status: 201 });
      // El reintento del mismo intento (la misma clave) devuelve lo guardado; otro intento igual, la equivalente (200).
      await apk.pide('API-NUT-15', { token, cuerpo, clave, status: 201 });
      await apk.pide('API-NUT-15', { token, cuerpo, status: 200 });
      ejecucionId = registrada.body.data.executionId as string;
      await apk.pide('API-NUT-15', { token, cuerpo: { activePlanId: planId, occurredAt: new Date().toISOString(), recording: { origin: 'OUTSIDE_PRESCRIPTION', mode: 'FREE_DESCRIPTION', description: 'Una fruta a media tarde.' } }, status: 201 });
    } else {
      // Esta APK registra con la familia ING; la ingesta de la cena, que lee en el historial, se arma con la API de hoy.
      ejecucionId = (await registrarComida(app, c.ase, planId, dia, { comida: 1, gramos: 120 }).expect(201)).body.data.executionId as string;
    }
    await apk.pide('API-NUT-16-LISTA', { token });
    await apk.pide('API-NUT-16-LISTA', { token, consulta: { limit: '1' } });
    await apk.pide('API-NUT-16', { token, params: { executionId: ejecucionId } });

    if (apk.lee('API-ING-01')) {
      // Las comidas v2 (DL-121): «Comí esta opción» de la receta, completar las cantidades y deshacer.
      const opciones = (await apk.pide('API-ING-01', { token })).body.data;
      const deReceta = opciones.meals.find((m: { mealId: string }) => m.mealId === almuerzo.mealId);
      expect(deReceta.options[0].recipe).not.toBeNull();
      expect(deReceta.options[0].image).not.toBeNull();
      const registro = await apk.pide('API-ING-02', {
        token,
        cuerpo: { kind: 'PLAN_OPTION', activePlanId: planId, dayTypeId: opciones.dayTypes[0].dayTypeId, mealId: deReceta.mealId, optionId: deReceta.options[0].optionId, occurredAt: new Date().toISOString(), consumption: { status: 'UNCONFIRMED' }, observation: null },
        status: 201,
      });
      const registroId = registro.body.data.recordId as string;
      await apk.pide('API-ING-01', { token });
      await apk.pide('API-ING-03', { token, params: { recordId: registroId } });
      const completada = await apk.pide('API-ING-05', { token, params: { recordId: registroId }, cuerpo: { consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: registro.body.data.version }, status: 201 });
      await apk.pide('API-ING-06', { token, params: { recordId: registroId }, cuerpo: { reason: 'Me equivoqué de opción', expectedVersion: completada.body.data.version }, status: 201 });

      // Una comida diferente con su foto (DL-120): la intención, la subida a la ruta firmada, el registro y el acceso.
      const foto = await fotoDeUnaComida();
      const intencion = await apk.pide('API-MED-01', { token, cuerpo: { purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: foto.length, provenance: 'PERSON_PROVIDED', authorship: null }, status: 201 });
      const medioId = intencion.body.data.mediaId as string;
      await apk.pide('API-MED-02', { rutaFirmada: intencion.body.data.uploadPath as string, bytes: { contenido: foto, tipo: 'image/jpeg' }, status: 200 });
      const diferente = await apk.pide('API-ING-02', {
        token,
        cuerpo: { kind: 'DIFFERENT', activePlanId: planId, dayTypeId: null, mealId: null, occurredAt: new Date().toISOString(), description: 'Una tarta de verdura', approximateQuantity: null, mediaIds: [medioId] },
        status: 201,
      });
      await apk.pide('API-ING-03', { token, params: { recordId: diferente.body.data.recordId as string } });
      await apk.pide('API-ING-04', { token });
      await apk.pide('API-MED-03', { token, params: { mediaId: medioId } });
      // Suprimir una foto propia que no quedó en ningún registro (API-MED-05).
      const otra = await fotoDeUnaComida();
      const otraIntencion = await apk.pide('API-MED-01', { token, cuerpo: { purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: otra.length, provenance: 'PERSON_PROVIDED', authorship: null }, status: 201 });
      await apk.pide('API-MED-02', { rutaFirmada: otraIntencion.body.data.uploadPath as string, bytes: { contenido: otra, tipo: 'image/jpeg' }, status: 200 });
      await apk.pide('API-MED-05', { token, params: { mediaId: otraIntencion.body.data.mediaId as string }, status: 200 });
    }

    if (apk.lee('API-NUT-19-LISTA')) {
      // REV-A (DL-134): las revisiones que el profesional registró sobre la persona, una con el objetivo nuevo.
      const evidencia = [{ type: 'EXECUTION', id: ejecucionId }];
      const revisiones = `/api/v1/advisees/${c.ase.id}/nutrition/reviews`;
      const mantener = (await conSesion(app, c.pro.token).post(revisiones).send(cuerpoDeRevision(evidencia, 'MAINTAIN', { nextReviewAt: '2030-01-01' })).expect(201)).body.data;
      const cambiar = (await conSesion(app, c.pro.token).post(revisiones).send(cuerpoDeRevision(evidencia, 'CHANGE_OBJECTIVE', { objective: cuerpoDeObjetivo(c.evaluationId, 2100) })).expect(201)).body.data;
      await apk.pide('API-NUT-19-LISTA', { token });
      await apk.pide('API-NUT-19-PROPIA', { token, params: { reviewId: mantener.reviewId as string } });
      const conObjetivo = await apk.pide('API-NUT-19-PROPIA', { token, params: { reviewId: cambiar.reviewId as string } });
      expect(conObjetivo.body.data.nextAction.objective).toBeDefined();
    }
    expect(apk.rechazos()).toEqual([]);
  });

  siLee('API-MED-01')('la foto de una comida con la exigencia de la evidencia visual: el 403 con el vínculo y la versión del texto, que la APK lee para mostrarlos (DL-125)', async () => {
    const conExigencia = await appDePrueba({ ...googleDePrueba(google), evidenciaVisualExigida: true });
    try {
      const c = await circuitoConPlanActivo(conExigencia, etiqueta(`${corta}-evi`));
      const rechazo = await apk.pide('API-MED-01', {
        app: conExigencia,
        token: c.ase.token,
        cuerpo: { purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: 20_000, provenance: 'PERSON_PROVIDED', authorship: null },
        status: 403,
      });
      expect(rechazo.body.error.code).toBe('VISUAL_EVIDENCE_ACT_REQUIRED');
    } finally {
      await conExigencia.close();
    }
    expect(apk.rechazos()).toEqual([]);
  });

  // ─── Entrenamiento ─────────────────────────────────────────────────────────────────────────────

  it('el entrenamiento: «Hoy», la agenda, el plan, la sesión con sus tiempos, registrar, el historial, corregir y las revisiones (TRN-08 a 20, SER-02, TIE-01 a 04, AGE-01, TRN-23)', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, etiqueta(`${corta}-trn`));
    const token = c.ase.token;
    const hoy = (await apk.pide('API-TRN-14', { token })).body.data;
    const fecha = hoy.date as string;
    expect(hoy.planState).toBe('AVAILABLE');
    await apk.pide('API-TRN-14-PERIODO', { token, consulta: { periodStart: fecha, periodEnd: fecha } });
    await apk.pide('API-TRN-14-PERIODO', { token, consulta: { periodStart: restarDias(fecha, 1), periodEnd: restarDias(fecha, 1) } });
    if (apk.lee('API-AGE-01')) await apk.pide('API-AGE-01', { token });
    await apk.pide('API-TRN-08', { token, params: { adviseeId: c.ase.id } });
    await apk.pide('API-TRN-09', { token, params: { planId: c.planId } });
    if (apk.lee('API-TRN-13')) {
      // La búsqueda de ejercicios con la que esta APK sustituye uno (la que las candidatas perdieron: PR #195).
      await apk.pide('API-TRN-13', { token, consulta: { q: 'press', limit: '20' } });
      await apk.pide('API-TRN-13', { token, consulta: { q: 'sentadila', limit: '20' } });
    }

    const ocurrencia = (hoy.occurrences as { occurrenceId: string; plannedSession: { sessionId: string } }[]).find((o) => o.plannedSession.sessionId === 'ses-a')!.occurrenceId;
    if (apk.lee('API-SER-02')) await apk.pide('API-SER-02', { token, params: { occurrenceId: ocurrencia } });
    const abierto = await apk.pide('API-TRN-15', { token, params: { occurrenceId: ocurrencia }, cuerpo: {}, status: 201 });
    await apk.pide('API-TRN-15', { token, params: { occurrenceId: ocurrencia }, cuerpo: {}, status: 200 });
    const borradorId = abierto.body.data.draftId as string;
    await apk.pide('API-TRN-16', { token, params: { draftId: borradorId } });
    const serie = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 2, perceivedExertion: null };
    const banca = (carga: number) => ({ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [{ ...serie, load: { value: carga, unit: 'kg' } }] });
    // Guardar con una versión vieja: el 409, en la forma que la APK reconoce.
    await apk.pide('API-TRN-17', { token, params: { draftId: borradorId }, cuerpo: { expectedVersion: 'v9', changes: {} }, status: 409 });
    const guardado = await apk.pide('API-TRN-17', {
      token,
      params: { draftId: borradorId },
      cuerpo: { expectedVersion: abierto.body.data.version, changes: { granularity: 'SET', sessionCondition: 'COMPLETED', exercises: [banca(60)] } },
    });

    if (apk.lee('API-TIE-01')) {
      // Los tiempos de la sesión (DL-124): la sesión en curso a mitad de camino y los tiempos del borrador, completos.
      // El ejemplo dura 15 minutos: empieza hace 20, para no cruzar la medianoche de Buenos Aires salvo a las 00:0x.
      const eventos = corrida(pasosDelEjemplo('rx-banca', 'rx-sentadilla'), Date.now() - 20 * 60 * 1000, `corrida-${randomUUID().slice(0, 8)}`);
      await apk.pide('API-TIE-01', { token, params: { draftId: borradorId }, cuerpo: { events: eventos.slice(0, 3) } });
      const enCurso = await apk.pide('API-TIE-04', { token });
      expect(enCurso.body.data.inProgress).not.toBeNull();
      await apk.pide('API-TIE-01', { token, params: { draftId: borradorId }, cuerpo: { events: eventos } });
      await apk.pide('API-TIE-02', { token, params: { draftId: borradorId } });
    }

    const confirmado = await apk.pide('API-TRN-18', { token, params: { draftId: borradorId }, cuerpo: { expectedVersion: guardado.body.data.version }, status: 201 });
    const ejecucionId = confirmado.body.data.executionId as string;
    await apk.pide('API-TRN-19', { token, params: { executionId: ejecucionId } });
    await apk.pide('API-TRN-19-LISTA', { token, consulta: { periodStart: restarDias(fecha, 89), periodEnd: fecha } });
    if (apk.lee('API-TIE-03')) await apk.pide('API-TIE-03', { token, params: { executionId: ejecucionId } });
    await apk.pide('API-TRN-20', {
      token,
      params: { executionId: ejecucionId },
      cuerpo: { reason: 'Cargué mal la carga.', correction: { granularity: 'SET', sessionCondition: 'COMPLETED', reason: null, exercises: [banca(55)], sessionSummary: null } },
      status: 201,
    });
    await apk.pide('API-TRN-19', { token, params: { executionId: ejecucionId } });
    await apk.pide('API-TRN-14', { token });
    if (apk.lee('API-SER-02')) await apk.pide('API-SER-02', { token, params: { occurrenceId: ocurrencia } });

    if (apk.lee('API-TRN-23-LISTA')) {
      // REV-A (DL-134): las revisiones del profesional sobre la persona, una con el objetivo nuevo.
      const revision = (result: string, nextAction: Record<string, unknown>) => ({
        period: { start: fecha, end: fecha, timeZone: ZONA },
        evidenceReferences: [{ type: 'EXECUTION', id: ejecucionId }],
        interpretation: 'Interpretación sintética de la sesión.',
        result,
        rationale: 'Fundamento sintético.',
        nextAction: { description: 'Próxima acción sintética.', ...nextAction },
      });
      const revisiones = `/api/v1/advisees/${c.ase.id}/training/reviews`;
      const mantener = (await conSesion(app, c.pro.token).post(revisiones).send(revision('MAINTAIN', { nextReviewAt: '2030-01-01' })).expect(201)).body.data;
      const objetivo = { evaluationId: c.evaluationId, effectiveFrom: new Date().toISOString(), effectiveUntil: null, objective: { statement: 'Sumar una sesión de movilidad por semana.' }, rationale: 'Fundamento sintético.' };
      const cambiar = (await conSesion(app, c.pro.token).post(revisiones).send(revision('CHANGE_OBJECTIVE', { objective: objetivo })).expect(201)).body.data;
      await apk.pide('API-TRN-23-LISTA', { token });
      await apk.pide('API-TRN-23-PROPIA', { token, params: { reviewId: mantener.reviewId as string } });
      await apk.pide('API-TRN-23-PROPIA', { token, params: { reviewId: cambiar.reviewId as string } });
    }
    expect(apk.rechazos()).toEqual([]);
  });

  it('un plan con objetivos por serie («Piernas A», DL-122): la APK que no los muestra no lo recibe, en la forma que lee; la que los muestra, con el objetivo de cada serie y la imagen del ejercicio (DL-123)', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta(`${corta}-piernas`));
    const imagen = IMAGENES_DEL_PAQUETE.find((i) => i.fixtureKey === SESION_DEMO.exercises[0]!.catalogFixtureKey)!;
    const ejercicio = plan.ejercicios.get(imagen.fixtureKey)!;
    const subida = await subirImagenDeEjercicio(app, plan.pro, imagen);
    await asociarImagen(app, plan.pro, ejercicio.exerciseId, cuerpoDeImagen(imagen, ejercicio.versionId, subida.mediaId, 0)).expect(200);
    await activarLaDemo(app, plan).expect(200);
    const token = plan.ase.token;

    const hoy = (await apk.pide('API-TRN-14', { token })).body.data;
    const fecha = hoy.date as string;
    await apk.pide('API-TRN-14-PERIODO', { token, consulta: { periodStart: fecha, periodEnd: fecha } });
    await apk.pide('API-TRN-08', { token, params: { adviseeId: plan.ase.id } });
    if (!apk.lee('API-SER-02')) {
      // Sin la capacidad: «Hoy» y el período, no disponibles; el plan, el 404 de lo inexistente.
      expect(hoy.planState).toBe('NOT_AVAILABLE');
      await apk.pide('API-TRN-09', { token, params: { planId: plan.planId }, status: 404 });
    } else {
      expect(hoy.planState).toBe('AVAILABLE');
      const ocurrencia = (hoy.occurrences as { occurrenceId: string; plannedSession: { sessionId: string } }[]).find((o) => o.plannedSession.sessionId === SESION_ID)!.occurrenceId;
      const sesion = (await apk.pide('API-SER-02', { token, params: { occurrenceId: ocurrencia } })).body.data.session;
      const conImagen = (sesion.prescriptions as { prescriptionId: string; image: unknown }[]).find((p) => p.prescriptionId === prescripcionIdDe(SESION_DEMO.exercises[0]!))!;
      expect(conImagen.image).not.toBeNull();
      await apk.pide('API-TRN-09', { token, params: { planId: plan.planId } });
      await apk.pide('API-AGE-01', { token });
      await apk.pide('API-MED-03', { token, params: { mediaId: subida.mediaId } });
      await apk.pide('API-TRN-15', { token, params: { occurrenceId: ocurrencia }, cuerpo: {}, status: 201 });
    }
    expect(apk.rechazos()).toEqual([]);
  });

  // ─── Formularios y antropometría ───────────────────────────────────────────────────────────────

  it('los formularios: las solicitudes propias, el detalle, la plantilla, responder y rectificar (FRM-02, 05 a 08)', async () => {
    const e = etiqueta(`${corta}-frm`);
    const pro = await prepararProfesional(app, e, ['ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, e, { a3: true });
    await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    const pedir = async (cuerpo: Record<string, unknown>) => (await conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/form-requests`).send(cuerpo).expect(201)).body.data.formRequestId as string;
    const salud = await pedir({ templateVersionId: VERSION_SALUD, purpose: 'Seguridad del entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: ['condiciones_declaradas', 'dolor_o_lesiones'], requiredFieldCodes: ['condiciones_declaradas'] });
    // «Antecedentes para entrenamiento» (DL-100 a 102): campos numéricos con límites que FRM-02 no expone.
    const antecedentes = await pedir({ templateVersionId: VERSION_ANTECEDENTES, purpose: 'Contexto', scope: 'ENTRENAMIENTO', requestedFieldCodes: CAMPOS_DE_ANTECEDENTES, requiredFieldCodes: CAMPOS_DE_ANTECEDENTES.slice(0, 5) });
    const token = ase.token;

    await apk.pide('API-FRM-06', { token });
    await apk.pide('API-FRM-06', { token, consulta: { status: 'PENDING', limit: '50' } });
    for (const id of [salud, antecedentes]) {
      const detalle = (await apk.pide('API-FRM-05', { token, params: { formRequestId: id } })).body.data.request;
      await apk.pide('API-FRM-02', { token, params: { templateId: detalle.templateId as string, versionId: detalle.templateVersionId as string } });
    }
    const respondida = await apk.pide('API-FRM-07', { token, params: { formRequestId: salud }, cuerpo: { answers: [{ fieldCode: 'condiciones_declaradas', value: 'Sin condiciones' }] }, status: 201 });
    await apk.pide('API-FRM-08', {
      token,
      params: { formResponseId: respondida.body.data.formResponseId as string },
      cuerpo: { expectedVersion: respondida.body.data.version, reason: 'Corrijo un dato mal tipeado.', answers: [{ fieldCode: 'condiciones_declaradas', value: 'Asma leve' }] },
      status: 201,
    });
    await apk.pide('API-FRM-07', {
      token,
      params: { formRequestId: antecedentes },
      cuerpo: {
        answers: [
          { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza para subir escaleras sin cansarme' },
          { fieldCode: 'trn_experiencia', value: 'Caminatas; nada de fuerza en el último año' },
          { fieldCode: 'trn_dias_por_semana', value: 3 },
          { fieldCode: 'trn_minutos_por_sesion', value: 45 },
          { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa, con mancuernas livianas' },
        ],
      },
      status: 201,
    });
    // Responder lo ya respondido: el 422, en la forma que la APK reconoce.
    await apk.pide('API-FRM-07', { token, params: { formRequestId: salud }, cuerpo: { answers: [{ fieldCode: 'condiciones_declaradas', value: 'Otra vez' }] }, status: 422 });
    await apk.pide('API-FRM-05', { token, params: { formRequestId: salud } });
    await apk.pide('API-FRM-05', { token, params: { formRequestId: antecedentes } });
    await apk.pide('API-FRM-06', { token });
    expect(apk.rechazos()).toEqual([]);
  });

  it('la antropometría: la evolución propia, completa y de una medida (ANT-06-PROPIA)', async () => {
    const c = await circuitoAntropometrico(app, prisma, etiqueta(`${corta}-ant`));
    const toma = (dias: number, peso: number) => ({
      occurredAt: new Date(Date.now() - dias * 86_400_000).toISOString(),
      specificationVersionId: c.protocoloVersionId,
      source: { type: 'DIRECT_CAPTURE' },
      directMeasurements: [
        { metricCode: 'peso', value: peso, unit: 'kg' },
        { metricCode: 'talla', value: 1.75, unit: 'm' },
      ],
    });
    for (const [dias, peso] of [
      [20, 74.1],
      [2, 72.5],
    ] as const) {
      await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluations`).send(toma(dias, peso)).expect(201);
    }
    // Como «Mi evolución» de la APK: los últimos 90 días y, si hace falta, los 90 anteriores (`periodoAnterior`).
    const evolucion = await apk.pide('API-ANT-06-PROPIA', { token: c.ase.token });
    const inicio = evolucion.body.data.period.start as string;
    await apk.pide('API-ANT-06-PROPIA', { token: c.ase.token, consulta: { periodStart: restarDias(inicio, 90), periodEnd: restarDias(inicio, 1) } });
    expect(apk.rechazos()).toEqual([]);
  });

  // ─── Lo que solo leen las candidatas ───────────────────────────────────────────────────────────

  siLee('API-NOV-01')('las novedades, los avisos del teléfono, las preferencias y las notas de coordinación (NOV-01 a 06, CRD-01-PROPIA)', async () => {
    const c = await circuitoConPlanActivo(app, etiqueta(`${corta}-nov`));
    const token = c.ase.token;
    // La nota de coordinación (DL-140), de la nutricionista a todos los profesionales de la persona.
    const ent = await prepararProfesional(app, etiqueta(`${corta}-nov-ent`), ['ENTRENAMIENTO']);
    await vinculoCompleto(app, ent, c.ase, 'ENTRENAMIENTO');
    await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/coordination-notes`)
      .send({ originScope: 'NUTRICION', purpose: 'CONTEXT_FOR_YOUR_AREA', recipients: { mode: 'ALL' }, text: 'Nota sintética para la APK.', references: [{ type: 'NUTRITION_PLAN_VERSION', id: c.planId }] })
      .expect(201);

    const novedades = (await apk.pide('API-NOV-01', { token, consulta: { limit: '30' } })).body.data as { newsId: string }[];
    expect(novedades.length).toBeGreaterThan(0);
    await apk.pide('API-NOV-02', { token, params: { newsId: novedades[0]!.newsId } });
    await apk.pide('API-NOV-01', { token, consulta: { limit: '30' } });
    const telefono = randomUUID();
    await apk.pide('API-NOV-03', { token, params: { deviceId: telefono }, cuerpo: { expoPushToken: 'ExponentPushToken[apk-sintetico-1]', platform: 'ANDROID' } });
    await apk.pide('API-NOV-04', { token, params: { deviceId: telefono }, status: 204 });
    await apk.pide('API-NOV-05', { token });
    await apk.pide('API-NOV-06', { token, cuerpo: { mealLogReminder: true, trainingLogReminder: false } });
    await apk.pide('API-NOV-05', { token });
    await apk.pide('API-CRD-01-PROPIA', { token });
    expect(apk.rechazos()).toEqual([]);
  });

  siLee('API-GOO-01')('entrar con Google: crear la cuenta, entrar, la cuenta que no existe, vincular una cuenta con contraseña (GOO-01 a 03, DL-138)', async () => {
    const t = apk.textos;
    const deLaApk = (sub: string, correo: string) => idTokenDeGoogle(google, reclamosDeGoogle(sub, correo, { aud: CLIENTE_APK, azp: CLIENTE_APK }));
    const nueva = deLaApk(subSintetico(), correoSintetico(etiqueta(`${corta}-goo`)));
    const alta = {
      idToken: nueva,
      registrationIntent: 'ADVISEE',
      termsAcceptance: { versionId: t.TERMINOS },
      privacyAcknowledgement: { versionId: t.PRIVACIDAD_INFO },
      adultDeclaration: { versionId: t.MAYORIA_DE_EDAD, declared: true },
    };
    await apk.pide('API-GOO-03', { cuerpo: alta, status: 201 });
    await apk.pide('API-GOO-03', { cuerpo: alta, status: 200 });
    await apk.pide('API-GOO-01', { cuerpo: { idToken: nueva }, status: 201 });
    // Una cuenta de Google sin identidad en BE: el 404 con el correo, que la APK lee para ofrecer crearla.
    await apk.pide('API-GOO-01', { cuerpo: { idToken: deLaApk(subSintetico(), correoSintetico(etiqueta(`${corta}-goo-nadie`))) }, status: 404 });
    // El correo ya es de una cuenta con contraseña: el 409 con el correo, y vincular con la contraseña.
    const correoLocal = correoSintetico(etiqueta(`${corta}-goo-local`));
    await registrarOk(app, correoLocal, 'APK');
    const local = deLaApk(subSintetico(), correoLocal);
    await apk.pide('API-GOO-01', { cuerpo: { idToken: local }, status: 409 });
    await apk.pide('API-GOO-02', { cuerpo: { idToken: local, credential: OTRA_CREDENCIAL_SINTETICA }, status: 401 });
    await apk.pide('API-GOO-02', { cuerpo: { idToken: local, credential: CREDENCIAL_SINTETICA }, status: 201 });
    await apk.pide('API-GOO-01', { cuerpo: { idToken: local }, status: 201 });
    expect(apk.rechazos()).toEqual([]);
  });

  // ─── Todo lo que lee ───────────────────────────────────────────────────────────────────────────

  it('leyó con su esquema cada respuesta que esta APK lee, y cada detalle de rechazo que interpreta', () => {
    expect(apk.sinLeer()).toEqual([...(SOLO_EL_RECHAZO[version] ?? [])]);
    expect(apk.detallesSinLeer()).toEqual([]);
  });
});
