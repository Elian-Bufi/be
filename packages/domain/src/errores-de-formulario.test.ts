/**
 * DL-104 · el 422 de un formulario dice qué campo corregir y qué valores admite.
 * - `limiteVulnerado`: qué límite no respeta un número, en el orden de siempre (entero, mínimo, máximo);
 * - compatibilidad: el cuerpo nuevo pasa por el **mismo cliente HTTP** que compila la APK 0.11.3 y sigue siendo un
 *   `FORM_RESPONSE_INVALID` reconocido, nunca un resultado incierto;
 * - `rechazoDeFormulario`: mensaje por campo con el rótulo, el rango y la unidad de la plantilla; respaldo seguro para
 *   un rechazo sin detalle reconocible; y nada que decidir para la red, el servicio o un conflicto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearClienteBe, type Resultado } from './cliente-http';
import { ErrorEnvelopeSchema } from './contratos';
import { DetalleDeRespuestaFueraDeLimitesSchema, LARGO_MAXIMO_DE_TEXTO_DE_RESPUESTA, LARGO_MAXIMO_DEL_MOTIVO_DE_RECTIFICACION, largoDeTexto, type CampoDePlantilla } from './contratos-formularios';
import { COPY } from './copy';
import { COPY_FORMULARIOS, terminosProhibidosDeFormulariosEn } from './copy-formularios';
import { desenlaceDeEnvio, mensajeDeProblema, problemasReconocidos, rechazoDeFormulario, valoresAdmitidos } from './errores-de-formulario';
import { limiteVulnerado, numeroDentroDeLimites } from './formularios';

const DIAS = { minimum: 1, maximum: 7, integer: true };
const MINUTOS = { minimum: 1, maximum: 600, integer: true };

/** Los dos campos numéricos de «Antecedentes para entrenamiento», como los devuelve FRM-02 (migración 20260928000000). */
const CAMPOS: CampoDePlantilla[] = [
  { fieldCode: 'trn_objetivo_declarado', label: 'Qué te gustaría poder hacer o mejorar con el entrenamiento', dataType: 'TEXT', unit: null, category: 'OBJETIVOS', helpText: null },
  { fieldCode: 'trn_dias_por_semana', label: 'Cuántos días por semana podrías reservar de manera realista', dataType: 'NUMBER', unit: 'días por semana', category: 'HABITOS_Y_CONTEXTO', helpText: 'Un número entero entre 1 y 7' },
  { fieldCode: 'trn_minutos_por_sesion', label: 'Cuánto tiempo podrías dedicar a cada sesión', dataType: 'NUMBER', unit: 'min', category: 'HABITOS_Y_CONTEXTO', helpText: 'En minutos: un número entero entre 1 y 600' },
] as unknown as CampoDePlantilla[];

/** El cuerpo exacto que responde la API (respuestas.service.ts, DL-104): días 9 y minutos 45,5. */
const CUERPO_422 = {
  error: {
    code: 'FORM_RESPONSE_INVALID',
    message: 'Hay respuestas numéricas fuera de lo que admite la plantilla.',
    details: {
      issues: [
        { code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[1].value', fieldCode: 'trn_dias_por_semana', limits: DIAS },
        { code: 'FORM_ANSWER_NOT_INTEGER', path: 'answers[2].value', fieldCode: 'trn_minutos_por_sesion', limits: MINUTOS },
      ],
    },
  },
};

const clienteQueResponde = (status: number, cuerpo: unknown) =>
  crearClienteBe({
    baseUrl: '/api/v1',
    superficie: 'APK',
    fetch: (async () => new Response(JSON.stringify(cuerpo), { status })) as unknown as typeof fetch,
  });

const rechazo = (codigo: string, issues: unknown[] = []): Resultado<unknown> => ({ ok: false, tipo: 'API', status: 422, codigo, issues: issues as never });

// ─── Qué límite no se respeta ───────────────────────────────────────────────────────────────────

test('DL-104 · limiteVulnerado: decimales, por debajo del mínimo y por encima del máximo, en el orden de siempre', () => {
  assert.equal(limiteVulnerado(2.5, DIAS), 'NOT_INTEGER');
  assert.equal(limiteVulnerado(0, DIAS), 'BELOW_MINIMUM');
  assert.equal(limiteVulnerado(-1, DIAS), 'BELOW_MINIMUM');
  assert.equal(limiteVulnerado(9, DIAS), 'ABOVE_MAXIMUM');
  assert.equal(limiteVulnerado(0.5, DIAS), 'NOT_INTEGER', 'primero entero: «0,5 días» es un problema de decimales');
  for (const v of [1, 4, 7]) assert.equal(limiteVulnerado(v, DIAS), null);
  assert.equal(limiteVulnerado(-3, undefined), null, 'sin límites declarados no hay nada que vulnerar (FRM-HABITOS)');
  // numeroDentroDeLimites sigue igual (DL-101): ahora se apoya en limiteVulnerado.
  for (const v of [0, 8, 9, 2.5, -1]) assert.equal(numeroDentroDeLimites(v, DIAS), false);
  assert.equal(numeroDentroDeLimites(Number.NaN, undefined), false);
});

// ─── Compatibilidad del contrato ────────────────────────────────────────────────────────────────

test('DL-104 · compatibilidad: el 422 nuevo es un ErrorEnvelope válido y el cliente de la APK lo reconoce, sin volverlo incierto', async () => {
  assert.equal(ErrorEnvelopeSchema.safeParse(CUERPO_422).success, true, 'la raíz y error no cambian: solo details');
  assert.equal(DetalleDeRespuestaFueraDeLimitesSchema.safeParse(CUERPO_422.error.details).success, true);
  // cliente-http.ts es el mismo archivo en be-apk-0.11.3 (13280e6) y en main: esto es lo que hace la APK instalada.
  const r = await clienteQueResponde(422, CUERPO_422).responderSolicitudDeFormulario('token', 'solicitud', { answers: [] }, 'clave-de-prueba-01');
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.tipo === 'API');
  assert.equal(r.tipo === 'API' && r.codigo, 'FORM_RESPONSE_INVALID', 'nunca RESPUESTA_NO_RECONOCIDA');
  assert.deepEqual(r.tipo === 'API' && r.issues, CUERPO_422.error.details.issues, 'los issues llegan completos, con fieldCode y límites');
  const rect = await clienteQueResponde(422, CUERPO_422).rectificarRespuestaDeFormulario('token', 'respuesta', { expectedVersion: 'v1', reason: 'x', answers: [] }, 'clave-de-prueba-02');
  assert.equal(!rect.ok && rect.tipo === 'API' && rect.codigo, 'FORM_RESPONSE_INVALID');
});

test('DL-104 · compatibilidad: si una clave nueva se pusiera fuera de details, el cliente no reconocería el rechazo (por eso va adentro)', async () => {
  const mal = { error: { ...CUERPO_422.error, issues: CUERPO_422.error.details.issues } };
  const r = await clienteQueResponde(422, mal).responderSolicitudDeFormulario('token', 'solicitud', { answers: [] }, 'clave-de-prueba-03');
  assert.equal(!r.ok && r.tipo === 'API' && r.codigo, 'RESPUESTA_NO_RECONOCIDA');
});

// ─── Qué muestra la APK ─────────────────────────────────────────────────────────────────────────

test('DL-104 · por campo: cada campo recibe qué pasó y qué valores admite, con la unidad; el resumen los nombra por su rótulo', async () => {
  const r = await clienteQueResponde(422, CUERPO_422).responderSolicitudDeFormulario('token', 'solicitud', { answers: [] }, 'clave-de-prueba-04');
  const x = rechazoDeFormulario(r, CAMPOS);
  assert.ok(x && x.tipo === 'por-campo');
  assert.deepEqual(x.errores, {
    trn_dias_por_semana: 'Es más de lo que se admite. Ingresá un número entero entre 1 y 7 días por semana.',
    trn_minutos_por_sesion: 'Sin decimales. Ingresá un número entero entre 1 y 600 min.',
  });
  assert.equal(x.resumen, COPY.resumenDeErrores(2));
  assert.deepEqual(x.lineas, [
    'Cuántos días por semana podrías reservar de manera realista: Es más de lo que se admite. Ingresá un número entero entre 1 y 7 días por semana.',
    'Cuánto tiempo podrías dedicar a cada sesión: Sin decimales. Ingresá un número entero entre 1 y 600 min.',
  ]);
  assert.equal(JSON.stringify(x).includes('trn_'), true, 'los códigos solo son claves internas…');
  assert.equal(x.lineas.some((l) => l.includes('trn_')), false, '…nunca texto visible (10-B04:387-393)');
});

test('DL-104 · por debajo del mínimo, y los rangos con coma y sin unidad', () => {
  const bajo = rechazoDeFormulario(rechazo('FORM_RESPONSE_INVALID', [{ code: 'FORM_ANSWER_BELOW_MINIMUM', path: 'answers[0].value', fieldCode: 'trn_dias_por_semana', limits: DIAS }]), CAMPOS);
  assert.ok(bajo && bajo.tipo === 'por-campo');
  assert.equal(bajo.errores.trn_dias_por_semana, 'Es menos de lo que se admite. Ingresá un número entero entre 1 y 7 días por semana.');
  assert.equal(bajo.resumen, COPY.resumenDeErrores(1));
  assert.equal(valoresAdmitidos({ minimum: 0.5, maximum: 2.5 }, null), 'Ingresá un número entre 0,5 y 2,5.');
  assert.equal(valoresAdmitidos({ minimum: 1 }, 'h'), 'Ingresá un número de 1 h o más.');
  assert.equal(valoresAdmitidos({ maximum: 600, integer: true }, 'min'), 'Ingresá un número entero de hasta 600 min.');
  assert.equal(valoresAdmitidos({ integer: true }, null), 'Ingresá un número entero.');
});

test('DL-104 · respaldo: un FORM_RESPONSE_INVALID sin issues reconocibles dice que un dato no se aceptó, nunca «servicio no disponible»', () => {
  const casos: unknown[][] = [
    [],
    [{ code: 'CODIGO_DE_OTRA_VERSION', path: 'answers[0].value', fieldCode: 'trn_dias_por_semana', limits: DIAS }],
    [{ code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[0].value', fieldCode: 'campo_que_no_se_muestra', limits: DIAS }],
    [{ code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[0].value' }],
    ['no es un objeto'],
  ];
  for (const issues of casos) {
    const x = rechazoDeFormulario(rechazo('FORM_RESPONSE_INVALID', issues), CAMPOS);
    assert.deepEqual(x, { tipo: 'dato-no-aceptado', mensaje: COPY_FORMULARIOS.respuestaNoAceptada }, JSON.stringify(issues));
    assert.notEqual(x?.tipo === 'dato-no-aceptado' && x.mensaje, COPY.noDisponible);
  }
  // `details.issues` llega sin validar: si no es un arreglo, también es el respaldo (y nunca una excepción).
  for (const issues of [{ 0: CUERPO_422.error.details.issues[0] }, 7, true, 'texto', null]) {
    const r = { ok: false, tipo: 'API', status: 422, codigo: 'FORM_RESPONSE_INVALID', issues } as unknown as Resultado<unknown>;
    assert.deepEqual(rechazoDeFormulario(r, CAMPOS), { tipo: 'dato-no-aceptado', mensaje: COPY_FORMULARIOS.respuestaNoAceptada }, JSON.stringify(issues));
  }
  // Un issue reconocido junto a uno que no: se marca el reconocido y el otro se ignora.
  const mixto = problemasReconocidos([{ code: 'X', path: 'y' }, CUERPO_422.error.details.issues[0]], ['trn_dias_por_semana']);
  assert.deepEqual(mixto.map((p) => p.fieldCode), ['trn_dias_por_semana']);
});

test('DL-104 · lo que no es un rechazo por los datos no lo decide esta función: red, servicio, conflicto, 404 o respuesta no reconocida', () => {
  const otros: Resultado<unknown>[] = [
    { ok: false, tipo: 'RED' },
    rechazo('RESPUESTA_NO_RECONOCIDA'),
    { ok: false, tipo: 'API', status: 500, codigo: 'INTERNAL_ERROR', issues: [] },
    { ok: false, tipo: 'API', status: 503, codigo: 'DB_UNAVAILABLE', issues: [] },
    { ok: false, tipo: 'API', status: 409, codigo: 'VERSION_CONFLICT', issues: [] },
    { ok: false, tipo: 'API', status: 404, codigo: 'RESOURCE_NOT_FOUND', issues: [] },
    rechazo('FORM_REQUEST_NOT_RESPONDABLE'),
    { ok: true, datos: null },
  ];
  for (const r of otros) assert.equal(rechazoDeFormulario(r, CAMPOS), null, JSON.stringify(r));
});

test('DL-104 · los textos nuevos no usan términos prohibidos de formularios', () => {
  const textos = [
    COPY_FORMULARIOS.respuestaNoAceptada,
    COPY_FORMULARIOS.numeroIlegible,
    ...(['FORM_ANSWER_NOT_INTEGER', 'FORM_ANSWER_BELOW_MINIMUM', 'FORM_ANSWER_ABOVE_MAXIMUM'] as const).map((code) =>
      mensajeDeProblema({ code, path: 'answers[0].value', fieldCode: 'trn_dias_por_semana', limits: DIAS }, 'días por semana'),
    ),
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
});

// ─── Recuperación: cada rechazo de la API tiene su desenlace, y ninguno es «el servicio no está disponible» ─────

const cuerpoDeError = (code: string) => ({ error: { code, message: 'x' } });

test('recuperación · responder: FORM_REQUEST_NOT_RESPONDABLE dice que ya no se puede, que lo escrito sigue, y ofrece cargar y volver', async () => {
  const r = await clienteQueResponde(422, cuerpoDeError('FORM_REQUEST_NOT_RESPONDABLE')).responderSolicitudDeFormulario('token', 'solicitud', { answers: [] }, 'clave-de-prueba-10');
  const d = desenlaceDeEnvio(r, CAMPOS, { esCorreccion: false });
  assert.deepEqual(d, { tipo: 'ya-no-se-puede', sobre: 'respuesta', mensaje: COPY_FORMULARIOS.noSePuedeResponderYa, acciones: ['cargar', 'volver'] });
});

test('recuperación · corregir: FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED dice que no se puede corregir ahora', async () => {
  const r = await clienteQueResponde(422, cuerpoDeError('FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED')).rectificarRespuestaDeFormulario('token', 'respuesta', { expectedVersion: 'v1', reason: 'x', answers: [] }, 'clave-de-prueba-11');
  assert.equal(desenlaceDeEnvio(r, CAMPOS, { esCorreccion: true })?.tipo, 'ya-no-se-puede');
  assert.equal((desenlaceDeEnvio(r, CAMPOS, { esCorreccion: true }) as { mensaje: string }).mensaje, COPY_FORMULARIOS.noSePuedeCorregirYa);
});

test('recuperación · corregir sobre una versión vieja (409 VERSION_CONFLICT): ofrece cargar la versión guardada, sin reenviar', async () => {
  const r = await clienteQueResponde(409, cuerpoDeError('VERSION_CONFLICT')).rectificarRespuestaDeFormulario('token', 'respuesta', { expectedVersion: 'v1', reason: 'x', answers: [] }, 'clave-de-prueba-12');
  assert.deepEqual(desenlaceDeEnvio(r, CAMPOS, { esCorreccion: true }), { tipo: 'version-vieja', mensaje: COPY_FORMULARIOS.respuestaCambioAntesDeCorregir, acciones: ['cargar', 'volver'] });
  // Responder no lleva expectedVersion: un 409 de versión ahí no es este caso y lo decide falloDe.
  assert.equal(desenlaceDeEnvio(r, CAMPOS, { esCorreccion: false }), null);
});

test('DL-115 · responder o corregir sin A3 (403 ACTION_FORBIDDEN): no es una falla del servicio; dice qué falta y ofrece Privacidad y volver', async () => {
  const responder = await clienteQueResponde(403, cuerpoDeError('ACTION_FORBIDDEN')).responderSolicitudDeFormulario('token', 'solicitud', { answers: [] }, 'clave-de-prueba-20');
  const corregir = await clienteQueResponde(403, cuerpoDeError('ACTION_FORBIDDEN')).rectificarRespuestaDeFormulario('token', 'respuesta', { expectedVersion: 'v1', reason: 'x', answers: [] }, 'clave-de-prueba-21');
  for (const [r, esCorreccion] of [[responder, false], [corregir, true]] as const) {
    assert.deepEqual(desenlaceDeEnvio(r, CAMPOS, { esCorreccion }), { tipo: 'sin-a3', mensaje: COPY_FORMULARIOS.necesitaA3ParaEnviar, acciones: ['privacidad', 'volver'] });
  }
  assert.deepEqual(terminosProhibidosDeFormulariosEn(COPY_FORMULARIOS.necesitaA3ParaEnviar), []);
  assert.deepEqual(terminosProhibidosDeFormulariosEn(COPY_FORMULARIOS.necesitaA3), []);
});

test('recuperación · editar después de un resultado incierto: 409 IDEMPOTENCY_KEY_REUSED quiere decir que el primer envío se guardó', async () => {
  for (const esCorreccion of [false, true]) {
    const cliente = clienteQueResponde(409, cuerpoDeError('IDEMPOTENCY_KEY_REUSED'));
    const r = esCorreccion
      ? await cliente.rectificarRespuestaDeFormulario('token', 'respuesta', { expectedVersion: 'v1', reason: 'x', answers: [] }, 'clave-de-prueba-13')
      : await cliente.responderSolicitudDeFormulario('token', 'solicitud', { answers: [] }, 'clave-de-prueba-13');
    assert.deepEqual(desenlaceDeEnvio(r, CAMPOS, { esCorreccion }), { tipo: 'envio-anterior-guardado', mensaje: COPY_FORMULARIOS.envioAnteriorGuardado, acciones: ['cargar', 'volver'] });
  }
});

test('recuperación · lo validado en la 0.12.0 sigue igual: por campo, dato no aceptado; y red, 404 y servicio siguen en falloDe', async () => {
  const porCampo = desenlaceDeEnvio(rechazo('FORM_RESPONSE_INVALID', CUERPO_422.error.details.issues), CAMPOS, { esCorreccion: false });
  assert.equal(porCampo?.tipo, 'por-campo');
  assert.equal(desenlaceDeEnvio(rechazo('FORM_RESPONSE_INVALID'), CAMPOS, { esCorreccion: true })?.tipo, 'dato-no-aceptado');
  const otros: Resultado<unknown>[] = [
    { ok: false, tipo: 'RED' },
    rechazo('RESPUESTA_NO_RECONOCIDA'),
    { ok: false, tipo: 'API', status: 404, codigo: 'RESOURCE_NOT_FOUND', issues: [] },
    { ok: false, tipo: 'API', status: 500, codigo: 'INTERNAL_ERROR', issues: [] },
    { ok: false, tipo: 'API', status: 503, codigo: 'DB_UNAVAILABLE', issues: [] },
    { ok: true, datos: null },
  ];
  for (const r of otros) for (const esCorreccion of [false, true]) assert.equal(desenlaceDeEnvio(r, CAMPOS, { esCorreccion }), null, JSON.stringify(r));
});

test('recuperación · los mensajes nuevos no usan términos prohibidos ni dicen «servicio no disponible»', () => {
  for (const t of [
    COPY_FORMULARIOS.noSePuedeResponderYa,
    COPY_FORMULARIOS.noSePuedeCorregirYa,
    COPY_FORMULARIOS.respuestaCambioAntesDeCorregir,
    COPY_FORMULARIOS.envioAnteriorGuardado,
    COPY_FORMULARIOS.loGuardadoEstaArriba,
    COPY_FORMULARIOS.borradorSinEnviar,
    COPY_FORMULARIOS.sinRespuestaGuardada,
  ]) {
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
    assert.notEqual(t, COPY.noDisponible);
  }
});

test('WP-07 §9.3 · un texto más largo que el tope se marca junto al campo, con el tope en caracteres', () => {
  const issue = { code: 'FORM_ANSWER_TOO_LONG', path: 'answers[0].value', fieldCode: 'trn_objetivo_declarado', maxLength: 2000 };
  DetalleDeRespuestaFueraDeLimitesSchema.parse({ issues: [issue] });
  assert.deepEqual(problemasReconocidos([issue], ['trn_objetivo_declarado']), [issue]);
  const x = rechazoDeFormulario(rechazo('FORM_RESPONSE_INVALID', [issue, { code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[1].value', fieldCode: 'trn_dias_por_semana', limits: DIAS }]), CAMPOS);
  assert.ok(x && x.tipo === 'por-campo');
  assert.equal(x.errores.trn_objetivo_declarado, 'Es más largo de lo que se admite. Escribí hasta 2.000 caracteres.');
  assert.equal(x.resumen, COPY.resumenDeErrores(2));
  assert.deepEqual(terminosProhibidosDeFormulariosEn(x.errores.trn_objetivo_declarado as string), []);
  // Sin tope o con un tope que no es entero positivo, no se reconoce: respaldo seguro, no un mensaje roto.
  for (const malo of [{ ...issue, maxLength: 0 }, { ...issue, maxLength: 'mucho' }, { code: 'FORM_ANSWER_TOO_LONG', path: 'answers[0].value', fieldCode: 'trn_objetivo_declarado' }]) {
    assert.deepEqual(problemasReconocidos([malo], ['trn_objetivo_declarado']), []);
  }
});

test('WP-07 §9.3 · el largo se cuenta en caracteres, no en unidades UTF-16', () => {
  assert.equal(largoDeTexto('ñandú'), 5);
  assert.equal(largoDeTexto('💪'), 1);
  assert.equal(LARGO_MAXIMO_DE_TEXTO_DE_RESPUESTA, 2000);
  assert.equal(LARGO_MAXIMO_DEL_MOTIVO_DE_RECTIFICACION, 1000);
});
