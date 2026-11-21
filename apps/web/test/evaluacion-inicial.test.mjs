/**
 * WP-EVALUACION-INICIAL-2 (DL-189) · TEST-EVI-020 a TEST-EVI-026 · la evaluación inicial en el website, sin navegador:
 *  1. la franja de los pasos (RP-10): una sola fila arriba, con el estado de cada paso; solo el actual abierto, y un paso que
 *     viene no se abre;
 *  2. la fecha automática (RP-11): la del registro, «cambiar» para una anterior y nunca posterior a ahora; el reintento manda
 *     la misma;
 *  3. los tres bloques (RP-12): lo que contó, con su origen y lo crítico primero; lo medido; lo que necesita el cálculo; sin
 *     «Concepto / Valor / Unidad» a la vista, sin «Para empezar» y sin «BE no calcula»; las correcciones (RP-16);
 *  4. lo que se vincula al registrar: lo que muestra «Lo que contó», con la versión vista, hasta 20;
 *  5. «Completarlo ahora» (RP-14): el del área y «Tus hábitos» de un clic, lo demás para tildar, nada sin el del área, y
 *     «Cargar con la persona» ahí mismo;
 *  6. lo crítico primero en «Cargar con la persona» (RP-15);
 *  7. «Anotaciones» (RP-13), RP-02, y nada de la persona en el navegador.
 * Lo que se ve, en las capturas de la CI.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const D = await import('../src/app/pro/advisees/evaluacion/datos-de-la-evaluacion.ts');
const dominio = await import('@be/domain');
const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(join(AQUI, '../src/app/pro/advisees', ruta), 'utf8');

const PRIMER_PLAN = leer('primer-plan.tsx');
const PIEZAS = leer('evaluacion/evaluacion-inicial.tsx');
const NUTRICION = leer('nutrition/formularios.tsx');
const ENTRENAMIENTO = leer('training/resumen.tsx');
const CARGAR = leer('forms/cargar.tsx');
const PLAN_DE_NUTRICION = leer('nutrition/plan.tsx');
/** La parte de la evaluación de Nutrición: hasta el objetivo, que es de otro frente. */
const EVALUACION_DE_NUTRICION = NUTRICION.slice(0, NUTRICION.indexOf('// ─── Objetivo'));

const respondido = (over = {}) => ({
  formRequestId: 's-1',
  formResponseId: 'r-1',
  scope: 'NUTRICION',
  templateKey: 'FRM-HABITOS',
  templateName: 'Tus hábitos',
  templateVersion: '2',
  purpose: 'Que tu plan entre en tu semana',
  requestedAt: '2026-11-10T12:00:00.000Z',
  answeredAt: '2026-11-12T12:00:00.000Z',
  version: 'v1',
  rectified: false,
  transcribedConfirmedAt: null,
  sections: [
    {
      sectionCode: 'tus_habitos',
      title: 'Tus hábitos',
      answers: [
        { fieldCode: 'habitos_estres', label: '¿Cómo viene tu semana, en estrés?', category: 'HABITOS_Y_CONTEXTO', dataType: 'CHOICE', answer: { type: 'CHOICE', option: 'tranquila', otherText: null }, text: 'Tranquila' },
        { fieldCode: 'nivel_de_actividad', label: '¿Cómo es tu día, en movimiento?', category: 'HABITOS_Y_CONTEXTO', dataType: 'CHOICE', answer: { type: 'CHOICE', option: 'sentado_y_de_pie', otherText: null }, text: 'Combino sentado y de pie' },
      ],
    },
  ],
  ...over,
});

test('TEST-EVI-020 · la franja: los tres pasos en una fila, con su estado, y solo el actual abierto', () => {
  assert.match(PRIMER_PLAN, /<ol className="primer-plan__franja" aria-label=\{EI\.franja\} data-franja-de-pasos>/);
  assert.match(PRIMER_PLAN, /aria-current=\{estado === 'ahora' \? 'step' : undefined\}/);
  // Un paso que viene no se abre; uno listo, sí (EI-D16).
  assert.match(PRIMER_PLAN, /disabled=\{!seAbre\}/);
  assert.match(PRIMER_PLAN, /const seAbre = estado !== 'despues';/);
  // Debajo, un solo paso: el que toca o el listo que se tocó.
  assert.match(PRIMER_PLAN, /const mostrado = mirado \?\? actual;/);
  assert.match(PRIMER_PLAN, /data-paso-abierto=\{mostrado\}/);
  // Los pasos que vienen ya no dicen «Después de…» debajo.
  assert.doesNotMatch(PRIMER_PLAN, /despuesDeLaEvaluacion|despuesDelObjetivo/);
  assert.equal(dominio.COPY_EVALUACION_INICIAL.evaluacionLista('21/11'), 'Registrada el 21/11');
});

test('TEST-EVI-021 · la fecha: la del registro, «cambiar» para una anterior, nunca posterior a ahora', () => {
  const ahora = new Date('2026-11-21T15:12:00.000Z');
  assert.deepEqual(D.momentoDeLaEvaluacion(null, ahora), { ok: true, iso: '2026-11-21T15:12:00.000Z' });
  const antes = D.momentoDeLaEvaluacion('2026-11-18T10:30', ahora);
  assert.equal(antes.ok, true);
  assert.equal(D.momentoDeLaEvaluacion('2027-01-01T10:00', ahora).ok, false);
  assert.equal(D.momentoDeLaEvaluacion('2027-01-01T10:00', ahora).problema, dominio.COPY_EVALUACION_INICIAL.fechaFutura);
  assert.equal(D.momentoDeLaEvaluacion('', ahora).problema, dominio.COPY_EVALUACION_INICIAL.fechaIlegible);
  assert.match(D.aCampoLocal(ahora), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.equal(dominio.COPY_EVALUACION_INICIAL.hoy('12:12'), 'Hoy, 12:12');
  // Las dos áreas usan la misma pieza, y el reintento de un resultado incierto manda la misma fecha.
  for (const fuente of [EVALUACION_DE_NUTRICION, ENTRENAMIENTO]) {
    assert.match(fuente, /<FechaDeLaEvaluacion id="(trn-)?evaluacion-ocurrencia" valor=\{ocurrencia\} onCambiar=\{setOcurrencia\}/);
    assert.match(fuente, /ocurrencia === null && intento\.quedoIncierto\(\) && momentoDelIntento\.current/);
  }
  assert.match(PIEZAS, /<p className="fecha-de-la-evaluacion" data-fecha-automatica>/);
});

test('TEST-EVI-022 · los tres bloques: lo que contó con su origen, lo medido y lo que necesita el cálculo, sin la planilla', () => {
  for (const pieza of ['<LoQueConto\n', '<LoMedido lectura=', '<LoQueNecesitaElCalculo\n']) assert.ok(EVALUACION_DE_NUTRICION.includes(pieza), pieza);
  // Sin la planilla a la vista: las filas libres quedan plegadas en «+ Agregar otro dato».
  assert.match(EVALUACION_DE_NUTRICION, /<details className="campos-opcionales evaluacion-inicial__otros"[^\n]*\n\s*<summary>\{EI\.agregarOtroDato\}<\/summary>/);
  assert.doesNotMatch(EVALUACION_DE_NUTRICION, /BE no calcula|ConceptosFrecuentes|paraEmpezar/);
  assert.match(EVALUACION_DE_NUTRICION, /const \[datos, setDatos\] = useState<Dato\[\]>\(\[\]\);/);
  // Las fuentes: lo respondido, lo confirmado con lo corregido, lo cargado sin confirmar y lo compartido.
  const habitos = dominio.PLANTILLA_HABITOS_V2;
  const fuentes = D.fuentesDeLoQueConto({
    respondidos: [{ form: respondido(), corregidos: [] }, { form: respondido({ formResponseId: 'r-2', transcribedConfirmedAt: '2026-11-13T12:00:00.000Z' }), corregidos: ['nivel_de_actividad'] }],
    pendientes: [
      {
        solicitud: { formRequestId: 's-3', templateName: 'Tus hábitos' },
        propuesta: { answers: [{ fieldCode: 'nivel_de_actividad', answer: { type: 'CHOICE', option: 'de_pie_o_caminando', otherText: null } }], loadedAt: '2026-11-21T12:00:00.000Z' },
        version: { key: 'FRM-HABITOS', sections: habitos.sections },
      },
    ],
    compartidos: null,
  });
  assert.deepEqual(
    fuentes.map((f) => f.origen.tipo),
    ['RESPONDIDO', 'CONFIRMADO', 'CARGADO_SIN_CONFIRMAR'],
  );
  assert.equal(fuentes[2].respuestas[0].text, 'Mucho de pie o caminando');
  const candidatos = dominio.candidatosDeLasRespuestas(fuentes);
  assert.deepEqual(
    candidatos.map((c) => c.origen.tipo),
    ['RESPONDIDO', 'CORREGIDO', 'CARGADO_SIN_CONFIRMAR'],
  );
  // Lo crítico primero en el resumen: el nivel de actividad antes que el estrés.
  assert.deepEqual(
    D.resumenDelFormulario('FRM-HABITOS', D.renglonesDelRespondido(respondido())).map((r) => r.fieldCode),
    ['nivel_de_actividad', 'habitos_estres'],
  );
  // El origen y las correcciones, en palabras.
  const dia = (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7);
  assert.equal(D.origenEnPalabras({ tipo: 'TOMA', fecha: '2026-11-10' }, 'Ana', dia), 'Toma del 10/11');
  assert.equal(D.origenEnPalabras({ tipo: 'RESPONDIDO', fecha: '2026-11-12', formulario: 'X' }, 'Ana', dia), 'Respondido por Ana · 12/11');
  assert.equal(D.origenEnPalabras({ tipo: 'CARGADO_SIN_CONFIRMAR', fecha: '2026-11-21', formulario: 'X' }, 'Ana', dia), 'Cargado por vos · falta que Ana lo confirme');
  assert.equal(D.origenEnPalabras({ tipo: 'CARGADO_POR_VOS' }, 'Ana', dia), 'Cargado por vos');
  assert.equal(D.correccionEnPalabras({ fieldCode: 'peso', pregunta: 'Peso', ahora: '82 kg', antes: '80 kg' }, 'Ana'), 'Ana corrigió: 80 kg → 82 kg');
  assert.equal(D.correccionEnPalabras({ fieldCode: 'x', pregunta: '¿Tomás mate?', ahora: 'Sí', antes: null }, 'Ana'), 'Ana corrigió «¿Tomás mate?»: ahora dice Sí');
  // La toma es la del calculador (API-OBC-01), y «Ver toma» abre esa toma en Antropometría.
  assert.match(PIEZAS, /api\.tomasDeReferencia\(token, asesoradoId\)/);
  assert.match(PIEZAS, /vista=evaluaciones&evaluacion=\$\{encodeURIComponent\(toma\.evaluationId\)\}/);
  // RP-16: las correcciones salen de la transcripción (API-FRI-03), al registrar y en la evaluación registrada, con el antes
  // de lo que quedó en ella (en «Empezar el plan» y en Resumen).
  assert.match(PIEZAS, /v\.datos\.data\.response\?\.transcription\?\.correctedFieldCodes \?\? \[\]/);
  assert.match(PIEZAS, /correccionesDeLaPersona\(\{ corregidos, respuestas: renglonesDelRespondido\(form\), registrado \}\)/);
  assert.match(PLAN_DE_NUTRICION, /pie=\{<CorreccionesDespuesDeLaEvaluacion area="nutrition" [^\n]*evaluacion=\{ultima\} \/>\}/);
  assert.match(leer('nutrition/resumen.tsx'), /pie=\{<CorreccionesDespuesDeLaEvaluacion area="nutrition" [^\n]*evaluacion=\{lista\[0\]\} \/>\}/);
});

test('TEST-EVI-023 · lo que se registra sale del dominio y lo que se vincula es lo que muestra «Lo que contó»', () => {
  assert.match(EVALUACION_DE_NUTRICION, /const \{ entries: delCalculoParaRegistrar, evidencias \} = entradasDelCalculo\(delCalculo, diaConAnio\);/);
  assert.match(EVALUACION_DE_NUTRICION, /evidenceReferences: evidencias\.slice\(0, 20\),/);
  assert.match(EVALUACION_DE_NUTRICION, /conto\.respondidos\.slice\(0, MAXIMO_DE_FORMULARIOS_VINCULADOS\)/);
  assert.match(EVALUACION_DE_NUTRICION, /await vincularAlRegistrar\(token, 'nutrition', r\.datos\.data\.evaluationId, vinculos\);/);
  // Sin ningún dato, no se registra: se dice.
  assert.match(EVALUACION_DE_NUTRICION, /if \(entries\.length === 0\) return setFallo\(EI\.nadaParaRegistrar\);/);
});

test('TEST-EVI-024 · «Completarlo ahora»: el del área y «Tus hábitos» de un clic, lo demás para tildar', () => {
  const plantilla = (key, domain, over = {}) => ({ templateId: `t-${key}`, key, name: key, purpose: '', domain, status: 'SELECTABLE', latestVersionId: `v-${key}`, fieldCount: 3, effectiveSince: '2026-11-01T00:00:00.000Z', ...over });
  const catalogo = [plantilla('FRM-NUTRICION-INICIO', 'NUTRICION'), plantilla('FRM-HABITOS', null), plantilla('FRM-ENTRENAMIENTO', 'ENTRENAMIENTO'), plantilla('FRM-OTRA', null), plantilla('FRM-VIEJA', 'NUTRICION', { status: 'NOT_SELECTABLE' })];
  const base = { catalogo, area: 'NUTRICION', claveDelArea: 'FRM-NUTRICION-INICIO', sinAccesoAHabitos: false, yaPedidas: new Set(), ahora: '2026-11-21T12:00:00.000Z', fecha: (iso) => iso.slice(0, 10) };
  const sabe = (latestSeenAt, pendingHabitsRequestSince = null) => ({ scopes: ['NUTRICION'], receives: false, sharedSince: null, latestSeenAt, pendingHabitsRequestSince, accessRequest: null });
  // Sin hábitos vistos: «Tus hábitos» va de un clic; lo transversal, para tildar; lo de otra área y lo no seleccionable, no.
  const sinHabitos = D.pedidosParaCompletar({ ...base, loQueSabe: sabe(null) });
  assert.deepEqual(sinHabitos.fijos.map((p) => p.key), ['FRM-NUTRICION-INICIO', 'FRM-HABITOS']);
  assert.deepEqual(sinHabitos.paraTildar.map((x) => x.plantilla.key), ['FRM-OTRA']);
  // Con hábitos recientes: «Tus hábitos» se tilda, con su motivo.
  const recientes = D.pedidosParaCompletar({ ...base, loQueSabe: sabe('2026-11-15T12:00:00.000Z') });
  assert.deepEqual(recientes.fijos.map((p) => p.key), ['FRM-NUTRICION-INICIO']);
  assert.equal(recientes.paraTildar[0].plantilla.key, 'FRM-HABITOS');
  assert.ok(recientes.paraTildar[0].motivo);
  // Sin acceso a sus hábitos (el 404 de API-HBT-07): no se ofrece.
  assert.ok(!D.pedidosParaCompletar({ ...base, loQueSabe: null, sinAccesoAHabitos: true }).fijos.some((p) => p.key === 'FRM-HABITOS'));
  // Con el del área ya pedido (pendiente), no se crea otro (EI-D09); sin el del área, nada.
  assert.deepEqual(D.pedidosParaCompletar({ ...base, loQueSabe: sabe(null), yaPedidas: new Set(['t-FRM-NUTRICION-INICIO']) }), { fijos: [], paraTildar: [] });
  // El cuerpo: lo que viene pedido y obligatorio en la plantilla, con su «para qué» y el área.
  const v3 = dominio.PLANTILLA_NUTRICION_INICIO_V3;
  const cuerpo = D.pedidoParaCompletar({ templateVersionId: 'tv-1', sections: v3.sections }, 'NUTRICION', 'Para tu plan');
  assert.equal(cuerpo.scope, 'NUTRICION');
  assert.equal(cuerpo.purpose, 'Para tu plan');
  assert.ok(!cuerpo.requestedFieldCodes.includes('nut_embarazo'), 'el embarazo no viene pedido (DL-165 D-4)');
  assert.ok(cuerpo.requiredFieldCodes.every((c) => cuerpo.requestedFieldCodes.includes(c)), 'obligatorias ⊆ pedidas');
  // «Cargar con la persona» se abre ahí mismo, y al terminar vuelve a la evaluación y vuelve a leer.
  assert.match(PIEZAS, /<CargarLaSolicitud\n\s*key=\{actual\.id\}/);
  assert.match(PIEZAS, /textoDeVolver=\{EI\.volverALaEvaluacion\}/);
  assert.match(EVALUACION_DE_NUTRICION, /setCompletando\(null\);\n\s*setAvisoDeLaCarga\(aviso\);\n\s*lecturas\.releer\(\);/);
  // «Enviárselo» es «Pedir información», como hoy.
  assert.match(EVALUACION_DE_NUTRICION, /vista=pedir&plantilla=FRM-NUTRICION-INICIO&volver=nutricion/);
});

test('TEST-EVI-025 · lo crítico primero en «Cargar con la persona», y el resto detrás de «Cargar también el resto»', () => {
  assert.match(CARGAR, /const criticos = useMemo\(\(\) => \(solicitud \? camposCriticos\(clave, secciones, solicitud, respuestas\) : \[\]\)/);
  assert.match(CARGAR, /data-lo-critico/);
  assert.match(CARGAR, /\{EI\.primeroLoNecesario\}/);
  assert.match(CARGAR, /\{EI\.cargarElResto\}/);
  // Lo ya cargado fuera de lo crítico se abre con las partes, para que se vea.
  assert.match(CARGAR, /const soloLoCritico = criticos\.length > 0 && \(conTodo === null \? !cargadoFueraDeLoCritico : !conTodo\);/);
  // La pestaña Información sigue igual: la solicitud en la dirección y la vuelta a «Solicitudes».
  assert.match(CARGAR, /export function CargaConLaPersona\(\) \{\n\s*const \{ token, sesionPerdida, avisar, parametros, ir, yoId \} = useFormularios\(\);/);
  assert.match(CARGAR, /alEnviar\(expectedVersion === null \? T\.cargado : T\.cambiosGuardados\);/);
  assert.equal(dominio.COPY_EVALUACION_INICIAL.primeroBajada('Ana'), 'Lo que no cargues, Ana lo responde en su app al confirmar.');
});

test('TEST-EVI-026 · «Anotaciones», RP-02 y nada de la persona en el navegador', () => {
  // RP-13: un espacio amplio, a la vista, que va a las notas del profesional de la evaluación.
  for (const fuente of [EVALUACION_DE_NUTRICION, ENTRENAMIENTO]) {
    assert.match(fuente, /<label htmlFor="(trn-)?evaluacion-notas">\{EI\.anotaciones\}<\/label>/);
    assert.match(fuente, /rows=\{6\}[^\n]*maxLength=\{4000\} data-anotaciones/);
    assert.match(fuente, /professionalNotes: notas\.trim\(\) \|\| null,/);
  }
  // RP-02: con la versión en preparación a la vista, sin «Todavía no hay un plan activo.».
  assert.doesNotMatch(PLAN_DE_NUTRICION, /<p className="nota">\{COPY_NUTRICION\.sinPlanActivo\}<\/p>/);
  // La evaluación de Nutrición va abierta en su paso.
  assert.match(PLAN_DE_NUTRICION, /evaluacionAbierta\n\s*formularioDeEvaluacion=/);
  for (const fuente of [PIEZAS, leer('evaluacion/datos-de-la-evaluacion.ts'), EVALUACION_DE_NUTRICION]) assert.doesNotMatch(fuente, /localStorage|sessionStorage|indexedDB/);
});
