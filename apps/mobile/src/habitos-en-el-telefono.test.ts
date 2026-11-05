/**
 * La lógica pura de los hábitos en la APK (`habitos-en-el-telefono.ts`; DL-165 D-9, FR-10): a quién se le pregunta, qué
 * cuerpo de API-HBT-03 sale de cada acto, cuándo hay que leer el texto antes de aceptar, cómo se dice todo en palabras y
 * cuándo un formulario abre con «¿Sigue igual?». Cada caso dice primero lo que pide el diseño (§4) y después lo prueba.
 * Los datos de ejemplo pasan por el esquema de API-HBT-01: son respuestas que la API podría dar.
 *
 * Uso: cd apps/mobile && npx jest src/habitos-en-el-telefono.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import {
  COPY_HABITOS,
  MisHabitosResponseSchema,
  PLANTILLA_ENTRENAMIENTO_V3,
  PLANTILLA_NUTRICION_INICIO,
  PLANTILLA_NUTRICION_INICIO_V2,
  SECCION_DE_HABITOS,
  SOLICITUD_DE_MIS_HABITOS,
  terminosProhibidosDeFormulariosEn,
  type ProfesionalParaHabitos,
  type RespuestaDeCampoV2Entrada,
  type Resultado,
} from '@be/domain';
import { armarRespuestas, borradorDeRespuestas, problemasAntesDeEnviar } from './formulario-v2';
import {
  aQuienesPreguntar,
  areasEnPalabras,
  estadoEnPalabras,
  exitoDeCompartir,
  habitosEnPalabras,
  marcadosAlCambiar,
  marcadosAlCompartir,
  ofrecidosAlCompartir,
  pedidoDeCompartir,
  pedidoEnviable,
  pideElTexto,
  precargaDelFormulario,
  preguntaDeInicio,
  quienesLosReciben,
  rechazoDeCompartir,
  seOfrecePrecargaDeHabitos,
  type MisHabitos,
} from './habitos-en-el-telefono';

const A = COPY_HABITOS.apk;
const TEXTO = {
  id: 'habitos-compartidos-2026-11-propuesta',
  title: 'Compartir mis hábitos con mis profesionales',
  text: 'Compartir mis hábitos con mis profesionales — versión propuesta 2026-11\n\nEsta autorización es sobre una sola categoría de datos: tus hábitos.',
  textHash: '039e752d5c17f469f640068f246cba10190c5a563ad9b546a05269996b5326ee',
  effectiveFrom: '2026-11-05T00:00:00.000Z',
  approval: 'PENDING_APPROVAL' as const,
};
const NUTRICION = { code: 'NUTRICION' as const, label: 'Nutrición' };
const ENTRENAMIENTO = { code: 'ENTRENAMIENTO' as const, label: 'Entrenamiento' };

function prof(id: string, nombre: string, sharing: ProfesionalParaHabitos['sharing'], extra: Partial<ProfesionalParaHabitos> = {}): ProfesionalParaHabitos {
  return { professional: { identityId: id, displayName: nombre }, scopes: [NUTRICION], link: 'ACTIVE', sharing, sharedSince: sharing === 'RECEIVES' ? '2026-11-05T12:00:00.000Z' : null, ...extra };
}

/** Una respuesta de API-HBT-01, validada contra su esquema. */
function datos(status: MisHabitos['sharing']['status'], professionals: ProfesionalParaHabitos[], extra: Partial<MisHabitos> = {}): MisHabitos {
  const d: MisHabitos = {
    section: SECCION_DE_HABITOS,
    current: null,
    history: [],
    sharing: {
      status,
      version: status === 'NOT_GIVEN' ? null : 'v2',
      activeSince: status === 'ACTIVE' ? '2026-11-05T12:00:00.000Z' : null,
      withdrawnAt: status === 'WITHDRAWN' ? '2026-11-06T12:00:00.000Z' : null,
      acceptedTextVersionId: status === 'ACTIVE' ? TEXTO.id : null,
    },
    professionals,
    text: TEXTO,
    ...extra,
  };
  return MisHabitosResponseSchema.parse({ data: d }).data;
}

const LUCIA = prof('11111111-1111-4111-8111-111111111111', 'Lucía (nutricionista)', 'RECEIVES');
const MARCOS = prof('22222222-2222-4222-8222-222222222222', 'Marcos (entrenador)', 'NOT_ASKED', { scopes: [ENTRENAMIENTO] });
const PAULA = prof('33333333-3333-4333-8333-333333333333', 'Paula', 'DOES_NOT_RECEIVE', { scopes: [NUTRICION, ENTRENAMIENTO] });
const EN_PAUSA = prof('44444444-4444-4444-8444-444444444444', 'Ana', 'RECEIVES', { link: 'PAUSED' });
const NUEVO_EN_PAUSA = prof('55555555-5555-4555-8555-555555555555', 'Bruno', 'NOT_ASKED', { link: 'PAUSED' });

const respuesta = (fieldCode: string, answer: RespuestaDeCampoV2Entrada['answer']): RespuestaDeCampoV2Entrada => ({ fieldCode, answer });
const HABITOS: RespuestaDeCampoV2Entrada[] = [
  respuesta('habitos_horarios', { type: 'TIMES', times: [{ part: 'semana_me_levanto', time: '07:00' }, { part: 'semana_me_acuesto', time: '23:30' }] }),
  respuesta('horas_de_sueno', { type: 'NUMBER', number: 7.5, unit: 'h' }),
  respuesta('nivel_de_actividad', { type: 'CHOICE', option: 'sentado_y_de_pie', otherText: null }),
  respuesta('habitos_hace_deporte', { type: 'BOOLEAN', yes: true }),
  respuesta('habitos_deportes', { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['mar', 'jue'], momento: 'noche', minutos: 90, exigencia: 'exigente' }] }),
  respuesta('habitos_estres', { type: 'CHOICE', option: 'normal', otherText: null }),
];

describe('a quién se le pregunta (§4.3: un profesional nuevo no los recibe solo, y sin respuesta no se suma)', () => {
  test('con la autorización activa, a cada profesional que empezó a acompañarla después y tiene el vínculo aceptado', () => {
    const d = datos('ACTIVE', [LUCIA, MARCOS, PAULA, NUEVO_EN_PAUSA]);
    expect(aQuienesPreguntar(d).map((p) => p.professional.displayName)).toEqual(['Marcos (entrenador)']);
    expect(preguntaDeInicio(d)?.professional.identityId).toBe(MARCOS.professional.identityId);
  });

  test('sin la autorización activa (nunca dada o retirada) no se pregunta nada, y la tarjeta de Inicio no se dibuja', () => {
    for (const status of ['NOT_GIVEN', 'WITHDRAWN'] as const) {
      const d = datos(status, [MARCOS, PAULA].map((p) => ({ ...p, sharing: 'DOES_NOT_RECEIVE' as const })));
      expect(aQuienesPreguntar(d)).toEqual([]);
      expect(preguntaDeInicio(d)).toBeNull();
    }
    // Activa, pero sin nadie nuevo: tampoco.
    expect(preguntaDeInicio(datos('ACTIVE', [LUCIA, PAULA]))).toBeNull();
  });

  test('uno nuevo con el vínculo en pausa espera: se le pregunta cuando el vínculo vuelva a estar aceptado', () => {
    expect(aQuienesPreguntar(datos('ACTIVE', [LUCIA, NUEVO_EN_PAUSA]))).toEqual([]);
  });
});

describe('el cuerpo de API-HBT-03 sale de lo que la persona vio', () => {
  test('al compartir se ofrecen los que tienen el vínculo aceptado, todos marcados; los desmarcados quedan como «dijo que no»', () => {
    const d = datos('NOT_GIVEN', [LUCIA, MARCOS, PAULA, EN_PAUSA].map((p) => ({ ...p, sharing: 'DOES_NOT_RECEIVE' as const, sharedSince: null })));
    expect(ofrecidosAlCompartir(d).map((p) => p.professional.displayName)).toEqual(['Lucía (nutricionista)', 'Marcos (entrenador)', 'Paula']);
    expect([...marcadosAlCompartir(d)]).toEqual([LUCIA, MARCOS, PAULA].map((p) => p.professional.identityId));
    const marcados = new Set([LUCIA.professional.identityId, PAULA.professional.identityId]);
    expect(pedidoDeCompartir(d, { tipo: 'compartir', marcados })).toEqual({
      expectedVersion: null,
      textVersionId: TEXTO.id,
      professionalIds: [LUCIA.professional.identityId, PAULA.professional.identityId],
      declinedProfessionalIds: [MARCOS.professional.identityId],
    });
    // El de la pausa no se mostró: no se lo nombra (sigue sin preguntar).
  });

  test('compartir de nuevo, después de retirarla, va con la última versión que se vio', () => {
    const d = datos('WITHDRAWN', [{ ...LUCIA, sharing: 'DOES_NOT_RECEIVE', sharedSince: null }]);
    expect(pedidoDeCompartir(d, { tipo: 'compartir', marcados: marcadosAlCompartir(d) })).toMatchObject({ expectedVersion: 'v2', professionalIds: [LUCIA.professional.identityId], declinedProfessionalIds: [] });
  });

  test('al cambiar con quiénes se muestran todos; vienen marcados los que hoy los reciben, y sacar a uno lo deja afuera', () => {
    const d = datos('ACTIVE', [LUCIA, MARCOS, PAULA, EN_PAUSA]);
    expect([...marcadosAlCambiar(d)]).toEqual([LUCIA.professional.identityId, EN_PAUSA.professional.identityId]);
    const sinLucia = new Set([EN_PAUSA.professional.identityId]);
    expect(pedidoDeCompartir(d, { tipo: 'cambiar', marcados: sinLucia })).toEqual({
      expectedVersion: 'v2',
      textVersionId: TEXTO.id,
      professionalIds: [EN_PAUSA.professional.identityId],
      declinedProfessionalIds: [LUCIA, MARCOS, PAULA].map((p) => p.professional.identityId),
    });
  });

  test('«Sí, que los vea» suma al nuevo a la lista de hoy; «No, por ahora» deja la lista y lo nombra como «dijo que no»', () => {
    const d = datos('ACTIVE', [LUCIA, MARCOS, PAULA]);
    const id = MARCOS.professional.identityId;
    expect(pedidoDeCompartir(d, { tipo: 'sumar', profesionalId: id })).toEqual({ expectedVersion: 'v2', textVersionId: TEXTO.id, professionalIds: [LUCIA.professional.identityId, id], declinedProfessionalIds: [] });
    expect(pedidoDeCompartir(d, { tipo: 'no-sumar', profesionalId: id })).toEqual({ expectedVersion: 'v2', textVersionId: TEXTO.id, professionalIds: [LUCIA.professional.identityId], declinedProfessionalIds: [id] });
    expect(quienesLosReciben(d)).toEqual([LUCIA.professional.identityId]);
  });

  test('con nadie que los reciba hoy, «No, por ahora» no tiene lista que mandar: no se ofrece (la API pide al menos uno)', () => {
    const d = datos('ACTIVE', [MARCOS]);
    const no = pedidoDeCompartir(d, { tipo: 'no-sumar', profesionalId: MARCOS.professional.identityId });
    expect(no.professionalIds).toEqual([]);
    expect(pedidoEnviable(no)).toBe(false);
    expect(pedidoEnviable(pedidoDeCompartir(d, { tipo: 'sumar', profesionalId: MARCOS.professional.identityId }))).toBe(true);
  });
});

describe('ampliar pide leer el texto y aceptarlo (08 C-12); sacar a alguien no', () => {
  const d = datos('ACTIVE', [LUCIA, MARCOS, PAULA]);
  test('compartir (autorización no activa) siempre pide el texto', () => {
    const apagada = datos('NOT_GIVEN', [{ ...LUCIA, sharing: 'DOES_NOT_RECEIVE', sharedSince: null }]);
    expect(pideElTexto(apagada, pedidoDeCompartir(apagada, { tipo: 'compartir', marcados: marcadosAlCompartir(apagada) }))).toBe(true);
  });
  test('sumar a alguien que hoy no los recibe pide el texto; dejar la lista igual o sacar a alguien, no', () => {
    expect(pideElTexto(d, pedidoDeCompartir(d, { tipo: 'sumar', profesionalId: MARCOS.professional.identityId }))).toBe(true);
    expect(pideElTexto(d, pedidoDeCompartir(d, { tipo: 'cambiar', marcados: new Set([LUCIA.professional.identityId, PAULA.professional.identityId]) }))).toBe(true);
    expect(pideElTexto(d, pedidoDeCompartir(d, { tipo: 'no-sumar', profesionalId: MARCOS.professional.identityId }))).toBe(false);
    expect(pideElTexto(d, pedidoDeCompartir(d, { tipo: 'cambiar', marcados: new Set([LUCIA.professional.identityId]) }))).toBe(false);
  });
  test('si el texto vigente no es el que aceptó, cualquier cambio pide leerlo de nuevo', () => {
    const otroTexto = datos('ACTIVE', [LUCIA, PAULA], { text: { ...TEXTO, id: 'habitos-compartidos-2027-01' } });
    expect(pideElTexto(otroTexto, pedidoDeCompartir(otroTexto, { tipo: 'cambiar', marcados: new Set([LUCIA.professional.identityId]) }))).toBe(true);
  });
});

describe('los rechazos y los avisos', () => {
  const api = (codigo: string, status: number): Resultado<unknown> => ({ ok: false, tipo: 'API', status, codigo, issues: [] });
  test('otra versión, un texto nuevo o un profesional que ya no la acompaña: se vuelve a leer, con lo que pasó', () => {
    expect(rechazoDeCompartir(api('VERSION_CONFLICT', 409))).toBe(A.cambioLaAutorizacion);
    expect(rechazoDeCompartir(api('CONSENT_VERSION_STALE', 409))).toBe(A.cambioLaAutorizacion);
    expect(rechazoDeCompartir(api('HABITS_RECIPIENT_NOT_AVAILABLE', 422))).toBe(A.profesionalNoDisponible);
    // Lo demás lo decide `falloDe`: la red, un 5xx, un A3 revocado.
    expect(rechazoDeCompartir(api('ACTION_FORBIDDEN', 403))).toBeNull();
    expect(rechazoDeCompartir({ ok: false, tipo: 'RED' } as Resultado<unknown>)).toBeNull();
    expect(rechazoDeCompartir({ ok: true, datos: {} })).toBeNull();
  });
  test('lo que se le dice después de cada acto nombra al profesional cuando es uno', () => {
    const d = datos('ACTIVE', [LUCIA, MARCOS]);
    expect(exitoDeCompartir(d, { tipo: 'compartir', marcados: new Set() })).toBe(A.compartidos);
    expect(exitoDeCompartir(d, { tipo: 'cambiar', marcados: new Set() })).toBe(A.cambiosGuardados);
    expect(exitoDeCompartir(d, { tipo: 'sumar', profesionalId: MARCOS.professional.identityId })).toBe(A.nuevoSumado('Marcos (entrenador)'));
    expect(exitoDeCompartir(d, { tipo: 'no-sumar', profesionalId: MARCOS.professional.identityId })).toBe(A.nuevoNoSumado('Marcos (entrenador)'));
  });
});

describe('en palabras', () => {
  test('lo vigente, con las etiquetas de la parte y nunca los códigos; lo que no contó no aparece', () => {
    const lineas = habitosEnPalabras(SECCION_DE_HABITOS, HABITOS);
    expect(lineas.map((l) => l.fieldCode)).toEqual(['habitos_horarios', 'horas_de_sueno', 'nivel_de_actividad', 'habitos_hace_deporte', 'habitos_deportes', 'habitos_estres']);
    const valor = Object.fromEntries(lineas.map((l) => [l.fieldCode, l.valor]));
    expect(valor.horas_de_sueno).toBe('7,5 h');
    expect(valor.nivel_de_actividad).toBe('Combino sentado y de pie');
    expect(valor.habitos_deportes).toBe('Fútbol · Martes, Jueves · Noche · 90 min · Exigente: termino muy cansado o cansada');
    // Ningún código a la vista: los códigos llevan guion bajo, las etiquetas no.
    for (const l of lineas) expect(l.valor).not.toMatch(/_/);
    expect(habitosEnPalabras(SECCION_DE_HABITOS, [HABITOS[1]!]).map((l) => l.etiqueta)).toEqual(['¿Cuántas horas dormís habitualmente?']);
  });

  test('lo que quedó oculto por una condición no se lee: sin deporte, la lista de actividades no aparece', () => {
    const sinDeporte = HABITOS.map((r) => (r.fieldCode === 'habitos_hace_deporte' ? respuesta('habitos_hace_deporte', { type: 'BOOLEAN', yes: false }) : r));
    expect(habitosEnPalabras(SECCION_DE_HABITOS, sinDeporte).map((l) => l.fieldCode)).not.toContain('habitos_deportes');
  });

  test('el estado de cada profesional y sus áreas', () => {
    const dia = (iso: string) => iso.slice(0, 10);
    expect(estadoEnPalabras(LUCIA, dia)).toBe(`${A.losVe} · ${A.desde('2026-11-05')}`);
    expect(estadoEnPalabras(EN_PAUSA, dia)).toBe(A.enPausa);
    expect(estadoEnPalabras(MARCOS, dia)).toBe(A.empezoDespues);
    expect(estadoEnPalabras(PAULA, dia)).toBe(A.noLosVe);
    expect(areasEnPalabras(LUCIA)).toBe('Nutrición');
    expect(areasEnPalabras(PAULA)).toBe('Nutrición y Entrenamiento');
    expect(areasEnPalabras({ scopes: [NUTRICION, ENTRENAMIENTO, { code: 'ANTROPOMETRIA', label: 'Antropometría' }] })).toBe('Nutrición, Entrenamiento y Antropometría');
  });
});

describe('«Mis hábitos» se edita con el mismo borrador que un formulario, y nada es obligatorio', () => {
  test('lo vigente vuelve igual del borrador, y sin nada respondido no hay nada que corregir', () => {
    const secciones = [SECCION_DE_HABITOS];
    const armadas = armarRespuestas(secciones, SOLICITUD_DE_MIS_HABITOS, borradorDeRespuestas(secciones, HABITOS));
    expect(armadas.errores).toEqual({});
    expect(armadas.respuestas).toEqual(HABITOS);
    expect(problemasAntesDeEnviar(secciones, SOLICITUD_DE_MIS_HABITOS, armadas)).toBeNull();
    expect(problemasAntesDeEnviar(secciones, SOLICITUD_DE_MIS_HABITOS, armarRespuestas(secciones, SOLICITUD_DE_MIS_HABITOS, {}))).toBeNull();
  });
});

describe('«¿Sigue igual?» al abrir una solicitud (D-18)', () => {
  const nueva = { response: null, proposal: null, respondable: true, status: 'PENDING' as const };
  test('se ofrece en una solicitud nueva, pendiente y respondable, cuya versión trae la parte «Tus hábitos»', () => {
    expect(seOfrecePrecargaDeHabitos(nueva, PLANTILLA_NUTRICION_INICIO_V2.sections, false)).toBe(true);
    expect(seOfrecePrecargaDeHabitos(nueva, PLANTILLA_ENTRENAMIENTO_V3.sections, false)).toBe(true);
  });
  test('no se ofrece sobre una respuesta (es una corrección), lo cargado por el profesional, lo ya escrito o recuperado, en pausa o sin la parte', () => {
    expect(seOfrecePrecargaDeHabitos({ ...nueva, response: {} }, PLANTILLA_NUTRICION_INICIO_V2.sections, false)).toBe(false);
    expect(seOfrecePrecargaDeHabitos({ ...nueva, proposal: {} }, PLANTILLA_NUTRICION_INICIO_V2.sections, false)).toBe(false);
    expect(seOfrecePrecargaDeHabitos(nueva, PLANTILLA_NUTRICION_INICIO_V2.sections, true)).toBe(false);
    expect(seOfrecePrecargaDeHabitos({ ...nueva, respondable: false }, PLANTILLA_NUTRICION_INICIO_V2.sections, false)).toBe(false);
    expect(seOfrecePrecargaDeHabitos({ ...nueva, status: 'RESPONDED' }, PLANTILLA_NUTRICION_INICIO_V2.sections, false)).toBe(false);
    // La v1 de «Cómo comés hoy» (la que lee la APK 0.20) no tiene la parte: nada cambia para ella.
    expect(seOfrecePrecargaDeHabitos(nueva, PLANTILLA_NUTRICION_INICIO.sections, false)).toBe(false);
  });
  test('se precarga solo lo que la solicitud pide de la parte, con la fecha de lo vigente', () => {
    const vigente = { answers: HABITOS.map((r) => ({ ...r, provenance: 'SELF_REPORTED' as const })), recordedAt: '2026-11-05T15:00:00.000Z' };
    const pide = { requestedFieldCodes: ['habitos_horarios', 'horas_de_sueno', 'nut_jornada'] };
    const precarga = precargaDelFormulario(PLANTILLA_NUTRICION_INICIO_V2.sections, pide, vigente);
    expect(precarga?.desde).toBe('2026-11-05T15:00:00.000Z');
    expect(precarga?.respuestas.map((r) => r.fieldCode)).toEqual(['habitos_horarios', 'horas_de_sueno']);
    // Sin vigente, o si la solicitud no pide nada de la parte, no se precarga nada.
    expect(precargaDelFormulario(PLANTILLA_NUTRICION_INICIO_V2.sections, pide, null)).toBeNull();
    expect(precargaDelFormulario(PLANTILLA_NUTRICION_INICIO_V2.sections, { requestedFieldCodes: ['nut_jornada'] }, vigente)).toBeNull();
  });
  test('la lista de actividades se precarga solo si también se pide «¿Hacés ejercicio…?», que la abre', () => {
    const vigente = { answers: HABITOS.map((r) => ({ ...r, provenance: 'SELF_REPORTED' as const })), recordedAt: '2026-11-05T15:00:00.000Z' };
    const conLaQueAbre = precargaDelFormulario(PLANTILLA_ENTRENAMIENTO_V3.sections, { requestedFieldCodes: ['habitos_hace_deporte', 'habitos_deportes'] }, vigente);
    expect(conLaQueAbre?.respuestas.map((r) => r.fieldCode)).toEqual(['habitos_hace_deporte', 'habitos_deportes']);
    const sinLaQueAbre = precargaDelFormulario(PLANTILLA_ENTRENAMIENTO_V3.sections, { requestedFieldCodes: ['habitos_deportes'] }, vigente);
    expect(sinLaQueAbre).toBeNull();
  });
});

test('los textos de la APK son cortos, para personas y sin términos prohibidos (ni «cumplimiento», ni «px»)', () => {
  const textos: string[] = [];
  for (const v of Object.values(A)) {
    if (typeof v === 'string') textos.push(v);
    else if (typeof v === 'function') textos.push(String((v as (...a: string[]) => string)('Lucía', 'FORM')));
  }
  expect(textos.length).toBeGreaterThan(40);
  for (const t of textos) {
    expect(terminosProhibidosDeFormulariosEn(t)).toEqual([]);
    expect(t.toLowerCase()).not.toMatch(/cumplimiento|\bpx\b/);
  }
});
