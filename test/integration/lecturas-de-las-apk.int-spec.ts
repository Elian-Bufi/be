/**
 * DL-152 · lo que leen las APK publicadas que importan hoy, contra la API de hoy y PostgreSQL real.
 *
 * Cada APK valida las respuestas con esquemas estrictos: un campo nuevo, un valor nuevo de una enumeración o un `null`
 * donde no lo había, en una respuesta que lee una APK instalada, hacen fallar esa pantalla en el teléfono («respuesta no
 * reconocida»). Esta prueba pide cada operación que llama cada APK congelada en `packages/domain/fixtures/lecturas-de-la-apk/`
 * (hoy la estable 0.13.2, la 0.20.0-candidata.1, la 0.21.0-candidata.1 y la 0.22.0-candidata.1; la 0.17.0-candidata.3 y
 * la 0.18.0-candidata.1 salieron el 2026-11-05), como la pide esa APK, con las capacidades que declara, y lee la respuesta real
 * con el esquema de esa APK (`soporte-lecturas-de-la-apk.ts`). Al final exige haber leído todas: una APK congelada nueva
 * no pasa hasta que cada lectura suya tenga escenario.
 *
 * Lo que se arma alrededor (los profesionales, los vínculos, los planes, las revisiones) va por la API de hoy, como en el
 * resto de las pruebas: lo que se prueba es lo que pide y lee la APK. Las respuestas se leen con datos de verdad, también
 * en las ramas más cargadas de cada esquema: una opción de receta con su imagen, un plan con objetivos por serie y la imagen
 * del ejercicio, eventos de tiempo, una revisión que cambia el objetivo, una respuesta de formulario rectificada, lo que
 * cargó el profesional confirmado con una corrección y descartado con «No es correcto», las versiones de formato 3 del
 * catálogo y los hábitos de la persona con su historia y con un profesional en pausa y otro que llegó después.
 *
 * DL-165, ronda 2.1 (2026-11-06): la 0.21 responde «Tus hábitos» aparte (FRM-HABITOS v2, formato 3, una sola parte) y
 * sigue respondiendo una Solicitud de la ronda 2 pedida antes; lee la novedad nueva («Te piden ver tus hábitos», un tipo y una
 * vista que no conoce) con su esquema; y «Mis hábitos» no cambia de forma aunque haya un pedido de acceso esperando. La
 * 0.22.0-candidata.1 lee además los pedidos (API-HBT-08) y los responde (API-HBT-09), y abre «Mis hábitos» desde la novedad.
 */
import type { INestApplication } from '@nestjs/common';
import { CAMPOS_DE_HABITOS, CAPACIDAD_FORMULARIOS_FORMATO_3, type RespuestaDeCampoV2Entrada } from '@be/domain';
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
import { CAMPOS_V2, CAMPOS_V3, CON_FORMATO_3, conAgua, conDiasParaReservar, fri, pedirV2, REQUERIDOS_V3, RESPUESTAS_V2, RESPUESTAS_V3, sembrarPlantillaV2, sembrarPlantillaV3 } from './soporte-formularios-v2';
import {
  PLANTILLA_ENTRENAMIENTO,
  PLANTILLA_HABITOS,
  PLANTILLA_NUTRICION_INICIO,
  sembrarAntecedentesDeP0,
  solicitudDeAntes,
  VERSION_ENTRENAMIENTO_V3,
  VERSION_ENTRENAMIENTO_V4,
  VERSION_HABITOS_V2,
  VERSION_NUTRICION_INICIO_V2,
  VERSION_NUTRICION_INICIO_V3,
} from './soporte-plantillas-de-inicio';
import { finalizar, pausar, prepararAsesorado, prepararProfesional, solicitar, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';

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

/**
 * FRM-SALUD, sembrada por la migración (la misma de `contrato.int-spec.ts`). «Antecedentes para entrenamiento» se siembra
 * como copia de P0 en la prueba: desde DL-164 FI-02 su v1 es histórica y la vigente usa tipos nuevos, que estas APK no leen.
 */
const VERSION_SALUD = '349161b3-b831-4df1-896f-484517393a57';
const CAMPOS_DE_ANTECEDENTES =['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];

/**
 * Lo que una APK lee pero hoy no puede recibir una respuesta exitosa, por una decisión registrada. De eso se lee el
 * rechazo, con el sobre de error de esa APK.
 * - 0.13.2 · API-ACC-01: desde DL-138 (D-10), una APK sin la casilla de mayoría de edad no crea cuentas. Recibe el 422
 *   TERMS_VERSION_NOT_ACCEPTABLE, que traduce a «Los textos cambiaron. Actualizá la app para continuar.».
 */
const SOLO_EL_RECHAZO: Readonly<Record<string, readonly string[]>> = { '0.13.2': ['API-ACC-01'] };

/**
 * DL-165 D-9 · respuestas completas de la parte «Tus hábitos», en su forma canónica (las de
 * `habitos-de-la-persona.int-spec.ts`). La lista de actividades lleva «Qué días» con varias opciones en el renglón (FR-08).
 */
const HABITOS: readonly RespuestaDeCampoV2Entrada[] = [
  {
    fieldCode: 'habitos_horarios',
    answer: {
      type: 'TIMES',
      times: [
        { part: 'semana_me_levanto', time: '07:00' },
        { part: 'semana_me_acuesto', time: '23:30' },
        { part: 'finde_me_levanto', time: '09:30' },
        { part: 'finde_me_acuesto', time: '01:00' },
      ],
    },
  },
  { fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 7.5, unit: 'h' } },
  { fieldCode: 'nivel_de_actividad', answer: { type: 'CHOICE', option: 'sentado_y_de_pie', otherText: null } },
  { fieldCode: 'habitos_hace_deporte', answer: { type: 'BOOLEAN', yes: true } },
  { fieldCode: 'habitos_deportes', answer: { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'jue'], momento: 'noche', minutos: 90, exigencia: 'moderada' }] } },
  { fieldCode: 'habitos_estres', answer: { type: 'CHOICE', option: 'normal', otherText: null } },
];
/** Las respuestas de formato 3 con otros días en el renglón de la otra actividad. */
const conOtrosDias = (dias: readonly string[]): RespuestaDeCampoV2Entrada[] =>
  RESPUESTAS_V3.map((r) => (r.fieldCode === 'ini_deportes' ? { fieldCode: r.fieldCode, answer: { type: 'LIST' as const, items: [{ cual: 'Fútbol', que_dias: [...dias] }] } } : r));

describe.each(VERSIONES)('DL-152 · la APK %s, contra la API de hoy', (version) => {
  const apk = new LaApk(version, () => app);
  /** La etiqueta de las cuentas sintéticas: el versionCode, corto, para que los correos no se acerquen a 64 caracteres. */
  const corta = `apk${apk.congelado.apk.versionCode}`;
  /**
   * Un caso que existe solo si esta APK llama la operación: lo que una APK no lee no se pide en su nombre, y la suite no
   * suma casos omitidos. El cierre de cada bloque exige igual haber leído todo lo que esa APK lee.
   */
  const siLee = (operacion: string, nombre: string, prueba: () => Promise<void>): void => {
    if (apk.lee(operacion)) it(nombre, prueba);
  };
  /** Lo mismo para lo que depende de una capacidad que esta APK declara (DL-122): desde la 0.21.0-candidata.1, el formato 3. */
  const siDeclara = (capacidad: string, nombre: string, prueba: () => Promise<void>): void => {
    if (apk.declara(capacidad)) it(nombre, prueba);
  };

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

  siLee('API-MED-01', 'la foto de una comida con la exigencia de la evidencia visual: el 403 con el vínculo y la versión del texto, que la APK lee para mostrarlos (DL-125)', async () => {
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
    if (apk.lee('API-TRN-13-BUSQUEDA')) {
      // La búsqueda con la que la 0.18.0-candidata.1 vuelve a sustituir un ejercicio (DL-151, #195): el texto viaja en el
      // cuerpo (DL-127). Con resultados y con un texto que no coincide exacto.
      const conResultados = await apk.pide('API-TRN-13-BUSQUEDA', { token, cuerpo: { q: 'press', limit: 20 } });
      expect(conResultados.body.data.length).toBeGreaterThan(0);
      await apk.pide('API-TRN-13-BUSQUEDA', { token, cuerpo: { q: 'sentadila', limit: 20 } });
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

  // Las APK hasta la 0.18.0-candidata.1 (de las vigentes, la 0.13.2) leen FRM; desde la 0.20.0-candidata.1 (DL-164), FRI,
  // en el bloque que sigue.
  siLee('API-FRM-06', 'los formularios: las solicitudes propias, el detalle, la plantilla, responder y rectificar (FRM-02, 05 a 08)', async () => {
    const e = etiqueta(`${corta}-frm`);
    const pro = await prepararProfesional(app, e, ['ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, e, { a3: true });
    await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    const pedir = async (cuerpo: Record<string, unknown>) => (await conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/form-requests`).send(cuerpo).expect(201)).body.data.formRequestId as string;
    const salud = await pedir({ templateVersionId: VERSION_SALUD, purpose: 'Seguridad del entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: ['condiciones_declaradas', 'dolor_o_lesiones'], requiredFieldCodes: ['condiciones_declaradas'] });
    // «Antecedentes para entrenamiento» (DL-100 a 102): campos numéricos con límites que FRM-02 no expone.
    const copiaDeP0 = await sembrarAntecedentesDeP0(prisma, e);
    const antecedentes = await pedir({ templateVersionId: copiaDeP0.versionId, purpose: 'Contexto', scope: 'ENTRENAMIENTO', requestedFieldCodes: CAMPOS_DE_ANTECEDENTES, requiredFieldCodes: CAMPOS_DE_ANTECEDENTES.slice(0, 5) });
    // DL-164 D-5: una Solicitud de una versión con tipos nuevos no existe para esta APK: FRM-06 no la lista, y FRM-05 y
    // FRM-02 responden el 404 que la APK reconoce. La responde la app nueva, por FRI.
    const v2 = await sembrarPlantillaV2(prisma, e, null);
    const inicio = await pedir({ templateVersionId: v2.versionId, purpose: 'Para empezar', scope: 'ENTRENAMIENTO', requestedFieldCodes: [...CAMPOS_V2], requiredFieldCodes: [] });
    // DL-165 (FR-08): una de formato 3, tampoco.
    const v3 = await sembrarPlantillaV3(prisma, e, null);
    const ronda2 = await pedir({ templateVersionId: v3.versionId, purpose: 'Para empezar', scope: 'ENTRENAMIENTO', requestedFieldCodes: [...CAMPOS_V3], requiredFieldCodes: [] });
    const token = ase.token;

    const propias = await apk.pide('API-FRM-06', { token });
    expect((propias.body.data as { formRequestId: string }[]).map((s) => s.formRequestId)).not.toContain(inicio);
    expect((propias.body.data as { formRequestId: string }[]).map((s) => s.formRequestId)).not.toContain(ronda2);
    await apk.pide('API-FRM-05', { token, params: { formRequestId: inicio }, status: 404 });
    await apk.pide('API-FRM-05', { token, params: { formRequestId: ronda2 }, status: 404 });
    await apk.pide('API-FRM-02', { token, params: { templateId: v2.plantillaId, versionId: v2.versionId }, status: 404 });
    await apk.pide('API-FRM-02', { token, params: { templateId: v3.plantillaId, versionId: v3.versionId }, status: 404 });
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

  siLee('API-FRI-02', 'los formularios de inicio: la bandeja, la estructura, el detalle, responder, confirmar lo cargado, «No es correcto» y rectificar (FRI-01 a 05 y 08, DL-164)', async () => {
    const e = etiqueta(`${corta}-fri`);
    const pro = await prepararProfesional(app, e, ['ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, e, { a3: true });
    await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    const token = ase.token;
    // Una de P0 (FRM-SALUD, que FRI traduce a V2) y tres sobre una versión con tipos nuevos: una para responder sola, una
    // que el profesional carga y la persona confirma corrigiendo un dato, y otra que la persona descarta.
    const salud = (
      await conSesion(app, pro.token)
        .post(`/api/v1/advisees/${ase.id}/form-requests`)
        .send({ templateVersionId: VERSION_SALUD, purpose: 'Seguridad del entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: ['condiciones_declaradas', 'dolor_o_lesiones'], requiredFieldCodes: ['condiciones_declaradas'] })
        .expect(201)
    ).body.data.formRequestId as string;
    const v2 = await sembrarPlantillaV2(prisma, e, null);
    const sola = await pedirV2(app, pro, ase.id, v2.versionId, 'ENTRENAMIENTO');
    const confirmada = await pedirV2(app, pro, ase.id, v2.versionId, 'ENTRENAMIENTO');
    const descartada = await pedirV2(app, pro, ase.id, v2.versionId, 'ENTRENAMIENTO');
    // Lo que carga el profesional desde el escritorio (FRI-06): la APK no lo pide, lo lee en la bandeja y en el detalle.
    const delPro = fri(app, pro.token);
    const cargada = (await delPro.cargar(confirmada, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body.data as { proposalId: string; version: string };
    const aDescartar = (await delPro.cargar(descartada, { expectedVersion: null, answers: RESPUESTAS_V2 }).expect(201)).body.data as { proposalId: string; version: string };

    // Inicio pide las pendientes, de a pocas; «Información que me pidieron», todas.
    await apk.pide('API-FRI-02', { token, consulta: { status: 'PENDING', limit: '3' } });
    const bandeja = (await apk.pide('API-FRI-02', { token })).body.data as { formRequestId: string; pendingProposal: { proposalId: string } | null }[];
    expect(bandeja.find((s) => s.formRequestId === confirmada)?.pendingProposal?.proposalId).toBe(cargada.proposalId);
    for (const id of [salud, sola, confirmada]) {
      const vista = (await apk.pide('API-FRI-03', { token, params: { formRequestId: id } })).body.data;
      await apk.pide('API-FRI-01', { token, params: { templateId: vista.request.templateId as string, versionId: vista.request.templateVersionId as string } });
    }

    // Responder sola: la de P0, con su respuesta en la forma V2, y la de tipos nuevos.
    await apk.pide('API-FRI-04', { token, params: { formRequestId: salud }, cuerpo: { answers: [{ fieldCode: 'condiciones_declaradas', answer: { type: 'TEXT', text: 'Sin condiciones' } }], fromProposal: null }, status: 201 });
    const respondida = await apk.pide('API-FRI-04', { token, params: { formRequestId: sola }, cuerpo: { answers: RESPUESTAS_V2, fromProposal: null }, status: 201 });
    // «Confirmo que son mis datos», después de corregir un dato de lo cargado: la transcripción queda en la respuesta.
    await apk.pide('API-FRI-04', {
      token,
      params: { formRequestId: confirmada },
      cuerpo: { answers: conAgua(8), fromProposal: { proposalId: cargada.proposalId, expectedVersion: cargada.version } },
      status: 201,
    });
    // «No es correcto»: lo cargado se borra y la solicitud sigue pendiente.
    await apk.pide('API-FRI-08', { token, params: { formRequestId: descartada }, cuerpo: { expectedVersion: aDescartar.version } });
    // Rectificar una respuesta propia.
    await apk.pide('API-FRI-05', {
      token,
      params: { formResponseId: respondida.body.data.formResponseId as string },
      cuerpo: { expectedVersion: respondida.body.data.version, reason: 'Tomo menos agua de lo que dije.', answers: conAgua(4) },
      status: 201,
    });
    // Responder lo ya respondido: el 422, en la forma que la APK reconoce.
    await apk.pide('API-FRI-04', { token, params: { formRequestId: sola }, cuerpo: { answers: RESPUESTAS_V2, fromProposal: null }, status: 422 });
    // Lo que queda a la vista: la respuesta rectificada, la confirmada con su transcripción y la descartada, pendiente.
    for (const id of [sola, confirmada, descartada, salud]) await apk.pide('API-FRI-03', { token, params: { formRequestId: id } });
    await apk.pide('API-FRI-02', { token });

    // DL-165 (FR-08): una Solicitud de formato 3 (el renglón con varias opciones) no existe para una APK que no declara
    // `forms-format-3` (la 0.20.0-candidata.1): la bandeja no la trae, y la estructura y el detalle son el 404 que la APK
    // reconoce. Ni siquiera con algo cargado por el profesional (desde el website, que sí la declara). La APK que la declara
    // (desde la 0.21.0-candidata.1) la lee en el bloque que sigue.
    if (!apk.declara(CAPACIDAD_FORMULARIOS_FORMATO_3)) {
      const v3 = await sembrarPlantillaV3(prisma, e, null);
      const ronda2 = await pedirV2(app, pro, ase.id, v3.versionId, 'ENTRENAMIENTO', CAMPOS_V3, []);
      await fri(app, pro.token, CON_FORMATO_3).cargar(ronda2, { expectedVersion: null, answers: RESPUESTAS_V3 }).expect(201);
      for (const consulta of [{ status: 'PENDING', limit: '3' }, undefined]) {
        const conLaRonda2 = (await apk.pide('API-FRI-02', { token, ...(consulta ? { consulta } : {}) })).body.data as { formRequestId: string }[];
        expect(conLaRonda2.map((s) => s.formRequestId)).not.toContain(ronda2);
      }
      await apk.pide('API-FRI-03', { token, params: { formRequestId: ronda2 }, status: 404 });
      await apk.pide('API-FRI-01', { token, params: { templateId: v3.plantillaId, versionId: v3.versionId }, status: 404 });
    }
    expect(apk.rechazos()).toEqual([]);
  });

  siDeclara(
    CAPACIDAD_FORMULARIOS_FORMATO_3,
    'el formato 3: la bandeja, las versiones del catálogo, el tope de días, el renglón con varias opciones, lo cargado, «No es correcto», rectificar y la parte «Tus hábitos» (FRI-01 a 05 y 08, DL-165)',
    async () => {
      const e = etiqueta(`${corta}-fr3`);
      const pro = await prepararProfesional(app, e, ['ENTRENAMIENTO']);
      const ase = await prepararAsesorado(app, e, { a3: true });
      await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
      const token = ase.token;
      // Tres sobre una versión sintética de formato 3 (la tabla de días con su tope y otra actividad con sus días): una para
      // responder sola, una para confirmar lo cargado y otra para descartarlo. Y una de «Antes de entrenar» v3, la del
      // catálogo, con la parte «Tus hábitos», pedida antes de la ronda 2.1 (desde ahí FRM-03 ya no la deja pedir), y una de
      // «Tus hábitos» aparte (FRM-HABITOS v2, ronda 2.1), que la 0.21 responde sola.
      const v3 = await sembrarPlantillaV3(prisma, e, null);
      const pedirV3 = () => pedirV2(app, pro, ase.id, v3.versionId, 'ENTRENAMIENTO', CAMPOS_V3, REQUERIDOS_V3);
      const sola = await pedirV3();
      const confirmada = await pedirV3();
      const descartada = await pedirV3();
      const antesDeEntrenar = await solicitudDeAntes(prisma, { profesionalId: pro.id, asesoradoId: ase.id, versionId: VERSION_ENTRENAMIENTO_V3, alcance: 'ENTRENAMIENTO', pedidos: ['trn_objetivo_declarado', ...CAMPOS_DE_HABITOS], requeridos: ['trn_objetivo_declarado'] });
      const tusHabitos = await pedirV2(app, pro, ase.id, VERSION_HABITOS_V2, 'ENTRENAMIENTO', CAMPOS_DE_HABITOS, ['habitos_horarios', 'horas_de_sueno', 'nivel_de_actividad', 'habitos_hace_deporte', 'habitos_deportes']);
      // Lo que carga el profesional desde el website, que también declara la capacidad (FRI-06).
      const web = fri(app, pro.token, CON_FORMATO_3);
      const cargada = (await web.cargar(confirmada, { expectedVersion: null, answers: RESPUESTAS_V3 }).expect(201)).body.data as { proposalId: string; version: string };
      const aDescartar = (await web.cargar(descartada, { expectedVersion: null, answers: RESPUESTAS_V3 }).expect(201)).body.data as { proposalId: string; version: string };

      // La bandeja las trae: Inicio, de a pocas; «Información», todas.
      await apk.pide('API-FRI-02', { token, consulta: { status: 'PENDING', limit: '3' } });
      const bandeja = (await apk.pide('API-FRI-02', { token })).body.data as { formRequestId: string; pendingProposal: { proposalId: string } | null }[];
      expect(bandeja.map((s) => s.formRequestId)).toEqual(expect.arrayContaining([sola, confirmada, descartada, antesDeEntrenar, tusHabitos]));
      expect(bandeja.find((s) => s.formRequestId === confirmada)?.pendingProposal?.proposalId).toBe(cargada.proposalId);
      for (const id of [sola, confirmada, antesDeEntrenar, tusHabitos]) {
        const vista = (await apk.pide('API-FRI-03', { token, params: { formRequestId: id } })).body.data;
        const definicion = (await apk.pide('API-FRI-01', { token, params: { templateId: vista.request.templateId as string, versionId: vista.request.templateVersionId as string } })).body.data;
        expect(definicion.format).toBe(3);
      }
      // «Cómo comés hoy» v2, la otra versión de formato 3 del catálogo: las comidas, los alimentos y el embarazo sin pedir.
      expect((await apk.pide('API-FRI-01', { token, params: { templateId: PLANTILLA_NUTRICION_INICIO, versionId: VERSION_NUTRICION_INICIO_V2 } })).body.data.format).toBe(3);
      // Las de la ronda 2.1, con el esquema de esta APK: «Tus hábitos» (una sola parte) y las de área sin la parte.
      const habitos = (await apk.pide('API-FRI-01', { token, params: { templateId: PLANTILLA_HABITOS, versionId: VERSION_HABITOS_V2 } })).body.data;
      expect([habitos.format, habitos.sections.length, habitos.sections[0].sectionCode]).toEqual([3, 1, 'tus_habitos']);
      await apk.pide('API-FRI-01', { token, params: { templateId: PLANTILLA_NUTRICION_INICIO, versionId: VERSION_NUTRICION_INICIO_V3 } });
      await apk.pide('API-FRI-01', { token, params: { templateId: PLANTILLA_ENTRENAMIENTO, versionId: VERSION_ENTRENAMIENTO_V4 } });

      // El tope de días (FR-07): con dos días marcados, tres para reservar es el 422 que la APK reconoce, y no escribe nada.
      await apk.pide('API-FRI-04', { token, params: { formRequestId: sola }, cuerpo: { answers: conDiasParaReservar(3), fromProposal: null }, status: 422 });
      // Responder sola, con varias opciones en el renglón (FR-08).
      const respondida = (await apk.pide('API-FRI-04', { token, params: { formRequestId: sola }, cuerpo: { answers: RESPUESTAS_V3, fromProposal: null }, status: 201 })).body.data as { formResponseId: string; version: string };
      // «Confirmo que son mis datos», con otros días en el renglón de lo cargado: la transcripción lo dice.
      await apk.pide('API-FRI-04', {
        token,
        params: { formRequestId: confirmada },
        cuerpo: { answers: conOtrosDias(['mar', 'sab']), fromProposal: { proposalId: cargada.proposalId, expectedVersion: cargada.version } },
        status: 201,
      });
      // «No es correcto»: lo cargado se borra y la solicitud sigue pendiente.
      await apk.pide('API-FRI-08', { token, params: { formRequestId: descartada }, cuerpo: { expectedVersion: aDescartar.version } });
      // Rectificar con otros días; con más días para reservar que los marcados, el mismo 422.
      const rectificada = (
        await apk.pide('API-FRI-05', { token, params: { formResponseId: respondida.formResponseId }, cuerpo: { expectedVersion: respondida.version, reason: 'Cambié de días.', answers: conOtrosDias(['mar', 'sab']) }, status: 201 })
      ).body.data as { version: string };
      await apk.pide('API-FRI-05', { token, params: { formResponseId: respondida.formResponseId }, cuerpo: { expectedVersion: rectificada.version, reason: 'Puedo más días.', answers: conDiasParaReservar(4) }, status: 422 });
      // «Antes de entrenar» v3 con la parte «Tus hábitos»: responderla agrega una versión de los hábitos (D-16), que «Mis
      // hábitos» lee como salida de un formulario.
      await apk.pide('API-FRI-04', {
        token,
        params: { formRequestId: antesDeEntrenar },
        cuerpo: { answers: [{ fieldCode: 'trn_objetivo_declarado', answer: { type: 'TEXT', text: 'Subir escaleras sin cansarme' } }, ...HABITOS], fromProposal: null },
        status: 201,
      });
      if (apk.lee('API-HBT-01')) expect((await apk.pide('API-HBT-01', { token })).body.data.current).toMatchObject({ origin: 'FORM' });
      // «Tus hábitos» aparte, respondido solo, con lo de formato 3 del renglón: agrega otra versión de los hábitos (D-20).
      const otrosHabitos = HABITOS.map((r) => (r.fieldCode === 'horas_de_sueno' ? { fieldCode: r.fieldCode, answer: { type: 'NUMBER' as const, number: 6.5, unit: 'h' } } : r));
      await apk.pide('API-FRI-04', { token, params: { formRequestId: tusHabitos }, cuerpo: { answers: otrosHabitos, fromProposal: null }, status: 201 });
      if (apk.lee('API-HBT-01')) expect((await apk.pide('API-HBT-01', { token })).body.data.history).toHaveLength(1);
      // Lo que queda a la vista: la rectificada, la confirmada con su transcripción, la descartada (pendiente) y las del catálogo.
      for (const id of [sola, confirmada, descartada, antesDeEntrenar, tusHabitos]) await apk.pide('API-FRI-03', { token, params: { formRequestId: id } });
      await apk.pide('API-FRI-02', { token });
      expect(apk.rechazos()).toEqual([]);
    },
  );

  siLee('API-HBT-01', '«Mis hábitos»: leerlos, contarlos, compartirlos, sumar a quien llegó después, con un vínculo en pausa, y dejar de compartir (HBT-01 a 04, DL-165 D-9)', async () => {
    const e = etiqueta(`${corta}-hbt`);
    const ase = await prepararAsesorado(app, e, { a3: true });
    const nut = await prepararProfesional(app, `${e}-nut`, ['NUTRICION']);
    const ent = await prepararProfesional(app, `${e}-ent`, ['ENTRENAMIENTO']);
    const vNut = await vinculoCompleto(app, nut, ase, 'NUTRICION');
    await vinculoCompleto(app, ent, ase, 'ENTRENAMIENTO');
    const token = ase.token;
    interface MisHabitos {
      readonly current: { readonly origin: string } | null;
      readonly history: readonly unknown[];
      readonly sharing: { readonly status: string; readonly version: string | null };
      readonly professionals: readonly { readonly professional: { readonly identityId: string }; readonly link: string; readonly sharing: string }[];
      readonly text: { readonly id: string };
    }
    const mios = async (): Promise<MisHabitos> => (await apk.pide('API-HBT-01', { token })).body.data as MisHabitos;
    const de = (d: MisHabitos, pro: { id: string }) => d.professionals.find((p) => p.professional.identityId === pro.id);

    // Ronda 2.1: el entrenador le pidió acceso (API-HBT-06, del website). La 0.21 no conoce los pedidos (la 0.22 los lee en
    // el bloque que sigue), y lo que lee de «Mis hábitos» no cambia de forma.
    await conSesion(app, ent.token).post(`/api/v1/advisees/${ase.id}/habits/access-requests`).send({ scope: 'ENTRENAMIENTO' }).expect(201);
    // Sin nada contado y sin compartir.
    expect(await mios()).toMatchObject({ current: null, history: [], sharing: { status: 'NOT_GIVEN', version: null } });
    // Contarlos en «Mis hábitos», con la vigente que se vio: con una vieja, el 409; lo que no tiene la forma de la parte, el
    // 422; y cambiarlos (ninguna pregunta es obligatoria) deja la anterior en la historia.
    const v1 = (await apk.pide('API-HBT-02', { token, cuerpo: { expectedVersion: null, answers: HABITOS }, status: 201 })).body.data as { version: string };
    await apk.pide('API-HBT-02', { token, cuerpo: { expectedVersion: null, answers: HABITOS }, status: 409 });
    await apk.pide('API-HBT-02', { token, cuerpo: { expectedVersion: v1.version, answers: [{ fieldCode: 'horas_de_sueno', answer: { type: 'NUMBER', number: 20, unit: 'h' } }] }, status: 422 });
    await apk.pide('API-HBT-02', { token, cuerpo: { expectedVersion: v1.version, answers: HABITOS.filter((r) => r.fieldCode !== 'habitos_estres') }, status: 201 });

    // Compartirlos como arma el pedido la app: los dos vienen marcados, y la persona desmarca al entrenador. Con la versión
    // que ya no es la vigente, el 409.
    const antes = await mios();
    expect(antes.history).toHaveLength(1);
    const pedido = { expectedVersion: antes.sharing.version, textVersionId: antes.text.id, professionalIds: [nut.id], declinedProfessionalIds: [ent.id] };
    await apk.pide('API-HBT-03', { token, cuerpo: pedido });
    await apk.pide('API-HBT-03', { token, cuerpo: pedido, status: 409 });

    // Una antropometrista empieza a acompañarla y no los recibe sola (NOT_ASKED); la nutricionista, en pausa, los sigue
    // teniendo en la lista sin verlos.
    const ant = await prepararProfesional(app, `${e}-ant`, ['ANTROPOMETRIA']);
    await vinculoCompleto(app, ant, ase, 'ANTROPOMETRIA');
    await pausar(app, token, vNut.vinculoId, await versionDeVinculo(app, token, vNut.vinculoId)).expect(200);
    const conLaNueva = await mios();
    expect(de(conLaNueva, ant)).toMatchObject({ link: 'ACTIVE', sharing: 'NOT_ASKED' });
    expect(de(conLaNueva, nut)).toMatchObject({ link: 'PAUSED', sharing: 'RECEIVES' });
    expect(de(conLaNueva, ent)).toMatchObject({ link: 'ACTIVE', sharing: 'DOES_NOT_RECEIVE' });
    // «Sí, que los vea»: los que hoy los reciben, más la nueva.
    const sumada = (await apk.pide('API-HBT-03', { token, cuerpo: { expectedVersion: conLaNueva.sharing.version, textVersionId: conLaNueva.text.id, professionalIds: [nut.id, ant.id], declinedProfessionalIds: [] } }))
      .body.data as { sharing: { version: string } };

    // Sumar al entrenador desde «Cambiar con quiénes» (en la 0.21 y en la 0.22) responde que sí a su pedido (D-25).
    const conElEntrenador = await mios();
    const sumadoElEntrenador = (
      await apk.pide('API-HBT-03', { token, cuerpo: { expectedVersion: sumada.sharing.version, textVersionId: conElEntrenador.text.id, professionalIds: [nut.id, ant.id, ent.id], declinedProfessionalIds: [] } })
    ).body.data as { sharing: { version: string } };
    expect(await prisma.pedidoDeAccesoAHabitos.count({ where: { asesoradoId: ase.id, profesionalId: ent.id, estado: 'ACEPTADO' } })).toBe(1);
    // Dejar de compartir, para todos a la vez; otra vez con la misma versión, el 409.
    await apk.pide('API-HBT-04', { token, cuerpo: { expectedVersion: sumadoElEntrenador.sharing.version } });
    await apk.pide('API-HBT-04', { token, cuerpo: { expectedVersion: sumadoElEntrenador.sharing.version }, status: 409 });
    expect((await mios()).sharing.status).toBe('WITHDRAWN');
    expect(apk.rechazos()).toEqual([]);
  });

  siLee(
    'API-HBT-08',
    'los pedidos de acceso a sus hábitos: la novedad que abre «Mis hábitos», «No, por ahora», «Sí, que los vea» sin compartir todavía y con la autorización activa, y los que ya no esperan (HBT-08 y 09, NOV-01 y 02, DL-165 D-17 nueva y D-25)',
    async () => {
      const e = etiqueta(`${corta}-acc`);
      const ase = await prepararAsesorado(app, e, { a3: true });
      const nut = await prepararProfesional(app, `${e}-nut`, ['NUTRICION']);
      const ent = await prepararProfesional(app, `${e}-ent`, ['ENTRENAMIENTO']);
      const ant = await prepararProfesional(app, `${e}-ant`, ['ANTROPOMETRIA']);
      await vinculoCompleto(app, nut, ase, 'NUTRICION');
      await vinculoCompleto(app, ent, ase, 'ENTRENAMIENTO');
      const vAnt = await vinculoCompleto(app, ant, ase, 'ANTROPOMETRIA');
      const token = ase.token;
      interface PedidoDeAcceso {
        readonly accessRequestId: string;
        readonly version: string;
        readonly professional: { readonly identityId: string };
        readonly scope: { readonly code: string };
      }
      interface MisHabitos {
        readonly sharing: { readonly status: string; readonly version: string | null };
        readonly professionals: readonly { readonly professional: { readonly identityId: string }; readonly sharing: string }[];
        readonly text: { readonly id: string };
      }
      const pendientes = async (): Promise<PedidoDeAcceso[]> => (await apk.pide('API-HBT-08', { token })).body.data as PedidoDeAcceso[];
      const mios = async (): Promise<MisHabitos> => (await apk.pide('API-HBT-01', { token })).body.data as MisHabitos;
      const comoLosRecibe = (d: MisHabitos) => Object.fromEntries(d.professionals.map((p) => [p.professional.identityId, p.sharing]));
      /** API-HBT-06, desde el website: el profesional pide acceso desde su área. */
      const pedirAcceso = async (pro: { token: string }, scope: string): Promise<string> =>
        (await conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/habits/access-requests`).send({ scope }).expect(201)).body.data.accessRequestId as string;
      /** El cuerpo de API-HBT-09 como lo arma la app (`respuestaAlPedido`): «Sí» con la autorización y el texto que vio. */
      const si = (version: string, d: MisHabitos) => ({ expectedVersion: version, answer: 'SHARE', sharing: { expectedVersion: d.sharing.version, textVersionId: d.text.id } });
      const noPorAhora = (version: string) => ({ expectedVersion: version, answer: 'NOT_NOW', sharing: null });

      await apk.pide('API-HBT-02', { token, cuerpo: { expectedVersion: null, answers: HABITOS }, status: 201 });
      expect(await pendientes()).toEqual([]);

      // El entrenador pide acceso. Le llega a la persona la novedad «Te piden ver tus hábitos», que esta APK destaca como
      // «Importante» por su tipo y abre en «Mis hábitos», con el pedido.
      const deEnt = await pedirAcceso(ent, 'ENTRENAMIENTO');
      const novedades = (await apk.pide('API-NOV-01', { token, consulta: { limit: '30' } })).body.data as { newsId: string; kind: string; open: { view: string; referenceId: string | null } }[];
      const novedad = novedades.find((n) => n.kind === 'HABITS_ACCESS_REQUESTED');
      expect(novedad?.open).toEqual({ view: 'MY_HABITS', referenceId: deEnt });
      await apk.pide('API-NOV-02', { token, params: { newsId: novedad!.newsId } });
      const [pedido] = await pendientes();
      expect(pedido).toMatchObject({ accessRequestId: deEnt, version: 'v1', professional: { identityId: ent.id }, scope: { code: 'ENTRENAMIENTO' } });

      // «No, por ahora»: no toca la autorización, y el pedido deja de esperar. Responderlo otra vez es el 409 que la app dice
      // como «ese pedido ya no está».
      expect((await apk.pide('API-HBT-09', { token, params: { accessRequestId: deEnt }, cuerpo: noPorAhora(pedido!.version) })).body.data.answer).toBe('NOT_NOW');
      await apk.pide('API-HBT-09', { token, params: { accessRequestId: deEnt }, cuerpo: noPorAhora(pedido!.version), status: 409 });
      expect(await pendientes()).toEqual([]);
      expect((await mios()).sharing).toMatchObject({ status: 'NOT_GIVEN', version: null });

      // «Sí, que los vea» a la nutricionista, sin compartir todavía: con el texto que la app muestra, la autorización se activa
      // solo para ella, y el entrenador sigue sin verlos.
      const deNut = await pedirAcceso(nut, 'NUTRICION');
      const sinCompartir = await mios();
      expect((await apk.pide('API-HBT-09', { token, params: { accessRequestId: deNut }, cuerpo: si('v1', sinCompartir) })).body.data.answer).toBe('SHARE');
      const conLaNutricionista = await mios();
      expect(conLaNutricionista.sharing).toMatchObject({ status: 'ACTIVE', version: 'v1' });
      expect(comoLosRecibe(conLaNutricionista)).toMatchObject({ [nut.id]: 'RECEIVES', [ent.id]: 'DOES_NOT_RECEIVE' });
      expect(await pendientes()).toEqual([]);

      // D-17 nueva: la persona cambia de opinión. El entrenador vuelve a pedir a los 7 días (acá, el pedido directo en la base,
      // como en `habitos-de-la-persona.int-spec.ts`) y ella dice que sí con la autorización activa: con la autorización que vio
      // antes, el 409 que la app dice como «cambió mientras respondías»; con la vigente, lo suma.
      const componente = await prisma.alcanceDeVinculo.findFirstOrThrow({ where: { alcance: 'ENTRENAMIENTO', estado: 'ACEPTADO', vinculo: { profesionalId: ent.id, asesoradoId: ase.id } } });
      const otraVez = await prisma.pedidoDeAccesoAHabitos.create({ data: { profesionalId: ent.id, asesoradoId: ase.id, alcanceDeVinculoId: componente.id, alcance: 'ENTRENAMIENTO', pedidoEn: new Date(), procedencia: {} } });
      expect((await pendientes()).map((p) => p.accessRequestId)).toEqual([otraVez.id]);
      await apk.pide('API-HBT-09', { token, params: { accessRequestId: otraVez.id }, cuerpo: si('v1', sinCompartir), status: 409 });
      await apk.pide('API-HBT-09', { token, params: { accessRequestId: otraVez.id }, cuerpo: si('v1', await mios()) });
      const conLosDos = await mios();
      expect(conLosDos.sharing).toMatchObject({ status: 'ACTIVE', version: 'v2' });
      expect(comoLosRecibe(conLosDos)).toMatchObject({ [nut.id]: 'RECEIVES', [ent.id]: 'RECEIVES' });

      // Los que ya no esperan: uno que no existe, el 404; el de la antropometrista, con el vínculo terminado, ya no se lista, y
      // decirle que sí es el 422 que la app también dice como «ese pedido ya no está».
      await apk.pide('API-HBT-09', { token, params: { accessRequestId: randomUUID() }, cuerpo: noPorAhora('v1'), status: 404 });
      const deAnt = await pedirAcceso(ant, 'ANTROPOMETRIA');
      expect((await pendientes()).map((p) => p.accessRequestId)).toEqual([deAnt]);
      await finalizar(app, token, vAnt.vinculoId, await versionDeVinculo(app, token, vAnt.vinculoId)).expect(200);
      expect(await pendientes()).toEqual([]);
      await apk.pide('API-HBT-09', { token, params: { accessRequestId: deAnt }, cuerpo: si('v1', await mios()), status: 422 });
      expect(apk.rechazos()).toEqual([]);
    },
  );

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

  siLee('API-NOV-01', 'las novedades, los avisos del teléfono, las preferencias y las notas de coordinación (NOV-01 a 06, CRD-01-PROPIA)', async () => {
    const c = await circuitoConPlanActivo(app, etiqueta(`${corta}-nov`));
    const token = c.ase.token;
    // La nota de coordinación (DL-140), de la nutricionista a todos los profesionales de la persona.
    const ent = await prepararProfesional(app, etiqueta(`${corta}-nov-ent`), ['ENTRENAMIENTO']);
    await vinculoCompleto(app, ent, c.ase, 'ENTRENAMIENTO');
    await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/coordination-notes`)
      .send({ originScope: 'NUTRICION', purpose: 'CONTEXT_FOR_YOUR_AREA', recipients: { mode: 'ALL' }, text: 'Nota sintética para la APK.', references: [{ type: 'NUTRITION_PLAN_VERSION', id: c.planId }] })
      .expect(201);

    // DL-165, ronda 2.1: el entrenador le pide ver sus hábitos (API-HBT-06). La novedad trae un tipo y una vista que la 0.20 y
    // la 0.21 no conocen (`HABITS_ACCESS_REQUESTED`, `MY_HABITS`): la leen con su esquema, la muestran con su texto y, al
    // abrirla, se quedan en Novedades. La 0.22 la destaca y la abre en «Mis hábitos» (el bloque de los pedidos de acceso).
    await conSesion(app, ent.token).post(`/api/v1/advisees/${c.ase.id}/habits/access-requests`).send({ scope: 'ENTRENAMIENTO' }).expect(201);
    const novedades = (await apk.pide('API-NOV-01', { token, consulta: { limit: '30' } })).body.data as { newsId: string; kind: string; open: { view: string } }[];
    expect(novedades.length).toBeGreaterThan(0);
    const pedido = novedades.find((n) => n.kind === 'HABITS_ACCESS_REQUESTED');
    expect(pedido?.open.view).toBe('MY_HABITS');
    await apk.pide('API-NOV-02', { token, params: { newsId: pedido!.newsId } });
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

  siLee('API-GOO-01', 'entrar con Google: crear la cuenta, entrar, la cuenta que no existe, vincular una cuenta con contraseña (GOO-01 a 03, DL-138)', async () => {
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
