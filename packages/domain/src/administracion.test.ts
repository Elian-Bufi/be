/**
 * WP-ADMINISTRACION (DL-155) · las reglas puras de la administración por área, con resultados escritos a mano:
 * - cada decisión es una sola transición del 06 y solo se ofrece donde la lista blanca la admite (criterio 4);
 * - verificación y habilitación no se mezclan: rehabilitar no concede, conceder no verifica (criterio 9);
 * - la vigencia del segundo factor la decide el servidor con lo que guarda (criterios 1 y 10);
 * - los textos no prometen lo que no pasa ni dicen lo que B10-03 prohíbe; los avisos usan vistas que las APK conocen.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cambioDeOperacion,
  codigoEnGrupos,
  DECISIONES_ADMINISTRATIVAS,
  decisionesDisponibles,
  estadoDelSegundoFactor,
  evaluarDecision,
  normalizarCodigoDeIncorporacion,
  normalizarCodigoDelAutenticador,
  normalizarCodigoDeRecuperacion,
  puedeOperar,
  situacionDelArea,
  TRANSICION_DE_LA_DECISION,
  versionDelArea,
  type DecisionAdministrativa,
  type EstadoDelArea,
} from './administracion';
import { ALCANCES } from './alcance';
import { DecidirSobreAreaRequestSchema, FichaDeProfesionalResponseSchema, EstadoDelSegundoFactorSchema } from './contratos-administracion';
import { NovedadSchema, TIPOS_DE_NOVEDAD, VISTAS_DE_NOVEDAD } from './contratos-novedades';
import { COPY_ADMINISTRACION, efectoDeLaDecision, operacionEnPalabras, terminosProhibidosDeAdministracionEn } from './copy-administracion';
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { textoDeNovedad, vistaDeNovedad } from './copy-novedades';
import { terminosProhibidosEn } from './copy-nutricion';
import { EstadoDeHabilitacion, EstadoDeVerificacionProfesional } from './verificacion-profesional';

const V = [null, ...Object.values(EstadoDeVerificacionProfesional)] as const;
const H = [null, ...Object.values(EstadoDeHabilitacion)] as const;
const todos: EstadoDelArea[] = V.flatMap((verificacion) => H.map((habilitacion) => ({ verificacion, habilitacion })));
const clave = (e: EstadoDelArea) => `${e.verificacion ?? '∅'}/${e.habilitacion ?? '∅'}`;

test('criterio 4: las decisiones disponibles por estado son exactamente las de la lista blanca (resultado a mano)', () => {
  const esperado: Record<string, DecisionAdministrativa[]> = {};
  for (const e of todos) {
    const verif: DecisionAdministrativa[] =
      e.verificacion === 'PENDIENTE' ? ['OBSERVE', 'VERIFY', 'REJECT'] : e.verificacion === 'VERIFICADO' ? ['SUSPEND'] : e.verificacion === 'SUSPENDIDO' ? ['REINSTATE'] : [];
    const hab: DecisionAdministrativa[] = e.verificacion === null ? [] : e.habilitacion === 'CONCEDIDA' ? ['WITHDRAW_ENABLEMENT'] : ['GRANT_ENABLEMENT'];
    esperado[clave(e)] = [...verif, ...hab];
  }
  for (const e of todos) assert.deepEqual(decisionesDisponibles(e), esperado[clave(e)], clave(e));
  // Sin presentación no hay nada que decidir: presentar es del profesional (fuera de D-1).
  assert.deepEqual(decisionesDisponibles({ verificacion: null, habilitacion: null }), []);
  // Rechazada: solo la habilitación (volver a presentar es del profesional).
  assert.deepEqual(decisionesDisponibles({ verificacion: 'RECHAZADO', habilitacion: null }), ['GRANT_ENABLEMENT']);
});

test('criterio 9: cada decisión cambia una sola dimensión; rehabilitar no concede y conceder no verifica', () => {
  for (const d of DECISIONES_ADMINISTRATIVAS) {
    for (const e of todos) {
      const r = evaluarDecision(e, d, 'fundamento', 'texto');
      if (!r.permitida) continue;
      if (TRANSICION_DE_LA_DECISION[d].sobre === 'VERIFICACION') assert.equal(r.despues.habilitacion, e.habilitacion, `${d} en ${clave(e)} tocó la habilitación`);
      else assert.equal(r.despues.verificacion, e.verificacion, `${d} en ${clave(e)} tocó la verificación`);
    }
  }
  const rehabilitada = evaluarDecision({ verificacion: 'SUSPENDIDO', habilitacion: 'RETIRADA' }, 'REINSTATE', 'f', null);
  assert.ok(rehabilitada.permitida);
  assert.deepEqual(rehabilitada.despues, { verificacion: 'VERIFICADO', habilitacion: 'RETIRADA' });
  assert.equal(puedeOperar(rehabilitada.despues), false, 'rehabilitar con la habilitación retirada no deja operar');
  const concedida = evaluarDecision({ verificacion: 'PENDIENTE', habilitacion: null }, 'GRANT_ENABLEMENT', 'f', null);
  assert.ok(concedida.permitida);
  assert.deepEqual(concedida.despues, { verificacion: 'PENDIENTE', habilitacion: 'CONCEDIDA' });
  assert.equal(puedeOperar(concedida.despues), false, 'conceder con la verificación pendiente no deja operar');
  // Una observación no cambia el estado (REG-06-37).
  const observada = evaluarDecision({ verificacion: 'PENDIENTE', habilitacion: null }, 'OBSERVE', 'f', 'Falta la constancia');
  assert.ok(observada.permitida);
  assert.deepEqual(observada.despues, { verificacion: 'PENDIENTE', habilitacion: null });
});

test('los rechazos, en el orden del 09: primero la transición, después el fundamento y el texto obligatorio', () => {
  assert.deepEqual(evaluarDecision({ verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' }, 'VERIFY', '', null), { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
  assert.deepEqual(evaluarDecision({ verificacion: 'SUSPENDIDO', habilitacion: 'CONCEDIDA' }, 'SUSPEND', 'f', 'x'), { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
  assert.deepEqual(evaluarDecision({ verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' }, 'SUSPEND', '   ', 'x'), { permitida: false, motivo: 'SIN_FUNDAMENTO' });
  for (const d of ['OBSERVE', 'REJECT'] as const) assert.deepEqual(evaluarDecision({ verificacion: 'PENDIENTE', habilitacion: null }, d, 'f', ' '), { permitida: false, motivo: 'SIN_MENSAJE' });
  assert.deepEqual(evaluarDecision({ verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' }, 'SUSPEND', 'f', undefined), { permitida: false, motivo: 'SIN_MENSAJE' });
  assert.deepEqual(evaluarDecision({ verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' }, 'WITHDRAW_ENABLEMENT', 'f', null), { permitida: false, motivo: 'SIN_MENSAJE' });
  // Verificar, rehabilitar y conceder llevan un texto fijo: el propio es opcional.
  assert.ok(evaluarDecision({ verificacion: 'PENDIENTE', habilitacion: null }, 'VERIFY', 'f', null).permitida);
  assert.deepEqual(evaluarDecision({ verificacion: null, habilitacion: null }, 'GRANT_ENABLEMENT', 'f', null), { permitida: false, motivo: 'SIN_TRAYECTORIA' });
});

test('puede operar solo verificada y con la habilitación concedida; la situación sale de los dos estados', () => {
  const ops = todos.filter(puedeOperar).map(clave);
  assert.deepEqual(ops, ['VERIFICADO/CONCEDIDA']);
  assert.equal(situacionDelArea({ verificacion: null, habilitacion: 'CONCEDIDA' }), 'NOT_PRESENTED');
  assert.equal(situacionDelArea({ verificacion: 'PENDIENTE', habilitacion: 'CONCEDIDA' }), 'PENDING_REVIEW');
  assert.equal(situacionDelArea({ verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' }), 'CAN_OPERATE');
  assert.equal(situacionDelArea({ verificacion: 'VERIFICADO', habilitacion: 'RETIRADA' }), 'VERIFIED_NOT_ENABLED');
  assert.equal(situacionDelArea({ verificacion: 'VERIFICADO', habilitacion: null }), 'VERIFIED_NOT_ENABLED');
  assert.equal(situacionDelArea({ verificacion: 'SUSPENDIDO', habilitacion: 'CONCEDIDA' }), 'SUSPENDED');
  assert.equal(situacionDelArea({ verificacion: 'RECHAZADO', habilitacion: null }), 'REJECTED');
  assert.equal(cambioDeOperacion({ verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' }, { verificacion: 'SUSPENDIDO', habilitacion: 'CONCEDIDA' }), 'DEJA_DE_OPERAR');
  assert.equal(cambioDeOperacion({ verificacion: 'SUSPENDIDO', habilitacion: 'CONCEDIDA' }, { verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' }), 'VUELVE_A_OPERAR');
  assert.equal(cambioDeOperacion({ verificacion: 'SUSPENDIDO', habilitacion: 'RETIRADA' }, { verificacion: 'VERIFICADO', habilitacion: 'RETIRADA' }), 'SIN_CAMBIO');
  assert.equal(operacionEnPalabras('NUTRICION', { verificacion: 'VERIFICADO', habilitacion: null }), 'No puede operar Nutrición: falta conceder la habilitación.');
  assert.equal(operacionEnPalabras('ENTRENAMIENTO', { verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' }), 'Puede operar Entrenamiento en BE.');
});

test('la versión del área cambia con cualquiera de sus dos filas', () => {
  assert.equal(versionDelArea(null, null), 'a0-0');
  assert.equal(versionDelArea(3, 1), 'a3-1');
  assert.ok(DecidirSobreAreaRequestSchema.safeParse({ expectedVersion: 'a3-1', decision: 'SUSPEND', rationale: '' }).success);
  assert.equal(DecidirSobreAreaRequestSchema.safeParse({ expectedVersion: 'v3', decision: 'SUSPEND', rationale: 'x' }).success, false);
  assert.equal(DecidirSobreAreaRequestSchema.safeParse({ expectedVersion: 'a3-1', decision: 'APROBAR', rationale: 'x' }).success, false);
  assert.equal(DecidirSobreAreaRequestSchema.safeParse({ expectedVersion: 'a3-1', decision: 'SUSPEND', rationale: 'x', role: 'ADMIN' }).success, false, 'un campo de más se rechaza');
});

test('criterios 1 y 10: la vigencia del segundo factor sale de lo guardado (10 min para completarlo, 15 min sin actividad)', () => {
  const inicio = new Date('2026-10-25T12:00:00.000Z');
  const min = (n: number) => new Date(inicio.getTime() + n * 60_000);
  const base = { inicioDeLaSesion: inicio, verificadoEn: null, metodo: null, ultimaActividad: null, tieneAutenticadorActivo: true } as const;
  assert.deepEqual(estadoDelSegundoFactor({ ...base, ahora: min(9) }), { estado: 'REQUERIDO', plazo: min(10) });
  assert.deepEqual(estadoDelSegundoFactor({ ...base, ahora: min(10) }), { estado: 'PLAZO_VENCIDO' });
  assert.deepEqual(estadoDelSegundoFactor({ ...base, tieneAutenticadorActivo: false, ahora: min(5) }), { estado: 'CONFIGURACION_REQUERIDA', plazo: min(10) });
  const verificado = { ...base, verificadoEn: min(2), metodo: 'TOTP' as const };
  assert.deepEqual(estadoDelSegundoFactor({ ...verificado, ahora: min(16) }), { estado: 'VERIFICADO', metodo: 'TOTP', venceSinActividadEn: min(17) });
  assert.deepEqual(estadoDelSegundoFactor({ ...verificado, ahora: min(17) }), { estado: 'REQUERIDO', plazo: null }, '15 minutos sin actividad lo vencen');
  assert.deepEqual(estadoDelSegundoFactor({ ...verificado, ultimaActividad: min(40), ahora: min(54) }), { estado: 'VERIFICADO', metodo: 'TOTP', venceSinActividadEn: min(55) });
  // Sin autenticador activo (lo revocó el operador), una sesión verificada antes no recupera nada.
  assert.deepEqual(estadoDelSegundoFactor({ ...verificado, tieneAutenticadorActivo: false, ahora: min(30) }), { estado: 'PLAZO_VENCIDO' });
  assert.ok(EstadoDelSegundoFactorSchema.safeParse({ state: 'REQUIRED', deadline: null }).success);
});

test('los códigos se leen con tolerancia y se escriben en grupos', () => {
  assert.equal(normalizarCodigoDelAutenticador(' 123 456 '), '123456');
  assert.equal(normalizarCodigoDelAutenticador('12345'), null);
  assert.equal(normalizarCodigoDelAutenticador('12345a'), null);
  assert.equal(normalizarCodigoDeRecuperacion('abcd-efgh-jkmn'), 'ABCDEFGHJKMN');
  assert.equal(normalizarCodigoDeRecuperacion('ABCD EFGH JKLO'), 'ABCDEFGHJK10', 'L e I son 1; O es 0 (Crockford)');
  assert.equal(normalizarCodigoDeRecuperacion('ABCDEFGHJKMU'), null, 'la U no está en el alfabeto');
  assert.equal(normalizarCodigoDeIncorporacion('abcde-fghjk-mnpqr-stvwx'), 'ABCDEFGHJKMNPQRSTVWX');
  assert.equal(codigoEnGrupos('ABCDEFGHJKMN'), 'ABCD-EFGH-JKMN');
  assert.equal(codigoEnGrupos('ABCDEFGHJKMNPQRSTVWX'), 'ABCDE-FGHJK-MNPQR-STVWX');
});

test('la confirmación dice qué cambia, qué sigue igual y a quiénes se avisa, sin prometer lo que no pasa', () => {
  const antes = { verificacion: 'VERIFICADO', habilitacion: 'CONCEDIDA' } as const;
  const susp = evaluarDecision(antes, 'SUSPEND', 'f', 'x');
  assert.ok(susp.permitida);
  const e = efectoDeLaDecision({ decision: 'SUSPEND', alcance: 'NUTRICION', profesional: 'Lic. Paula Ríos', antes, evaluacion: susp, personas: { active: 2, paused: 1 }, mensajeObligatorio: true });
  assert.equal(e.titulo, 'Suspender · Nutrición de Lic. Paula Ríos');
  assert.equal(e.personasAvisadas, 3);
  assert.match(e.cambia.join(' '), /aunque tenga la sesión abierta/);
  assert.match(e.sigueIgual.join(' '), /se conservan/);
  assert.match(e.sigueIgual.join(' '), /Las otras áreas no cambian/);
  assert.match(e.avisos.join(' '), /Las 3 personas vinculadas en Nutrición reciben un aviso con el efecto, sin los motivos/);
  // Una observación no avisa a las personas: no cambia lo que el profesional puede hacer.
  const pend = { verificacion: 'PENDIENTE', habilitacion: null } as const;
  const obs = evaluarDecision(pend, 'OBSERVE', 'f', 'x');
  assert.ok(obs.permitida);
  const eo = efectoDeLaDecision({ decision: 'OBSERVE', alcance: 'ENTRENAMIENTO', profesional: 'P', antes: pend, evaluacion: obs, personas: { active: 4, paused: 0 }, mensajeObligatorio: true });
  assert.equal(eo.personasAvisadas, 0);
  assert.match(eo.sigueIgual.join(' '), /una observación no la rechaza ni la suspende/);
  // Rehabilitar no promete revivir vínculos ni autorizaciones.
  const s = { verificacion: 'SUSPENDIDO', habilitacion: 'CONCEDIDA' } as const;
  const reh = evaluarDecision(s, 'REINSTATE', 'f', null);
  assert.ok(reh.permitida);
  const er = efectoDeLaDecision({ decision: 'REINSTATE', alcance: 'NUTRICION', profesional: 'P', antes: s, evaluacion: reh, personas: { active: 1, paused: 0 }, mensajeObligatorio: false });
  assert.match(er.sigueIgual.join(' '), /No se reactivan vínculos finalizados ni autorizaciones revocadas/);
  assert.match(er.cambia.join(' '), /depende otra vez de su vínculo y su autorización/);
  assert.equal(er.personasAvisadas, 1);
});

/** Todos los textos de Administración, con lo que arman las funciones, para las listas de palabras. */
function textosDeAdministracion(): string[] {
  const textos: string[] = [];
  const juntar = (v: unknown): void => {
    if (typeof v === 'string') textos.push(v);
    else if (typeof v === 'function') {
      for (const arg of [0, 1, 3, '10:30', 'el 25 oct']) {
        try {
          const r = (v as (a: unknown, b: unknown) => unknown)(arg, arg);
          if (typeof r === 'string') textos.push(r);
        } catch {
          // Una función con otra firma: sus textos se juntan por otro camino.
        }
      }
    } else if (v && typeof v === 'object') for (const x of Object.values(v)) juntar(x);
  };
  juntar(COPY_ADMINISTRACION);
  for (const alcance of ALCANCES) {
    for (const e of todos) {
      textos.push(operacionEnPalabras(alcance, e));
      for (const d of decisionesDisponibles(e)) {
        const ev = evaluarDecision(e, d, 'f', 'x');
        if (!ev.permitida) continue;
        const ef = efectoDeLaDecision({ decision: d, alcance, profesional: 'P', antes: e, evaluacion: ev, personas: { active: 1, paused: 1 }, mensajeObligatorio: true });
        textos.push(ef.titulo, ef.confirmar, ...ef.cambia, ...ef.sigueIgual, ...ef.avisos);
      }
    }
  }
  return textos;
}

test('ningún texto de Administración usa lo que B10-03 §20 prohíbe ni califica (también en negación)', () => {
  const textos = textosDeAdministracion();
  assert.ok(textos.length > 150, `se juntaron ${textos.length} textos`);
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeAdministracionEn(t), [], t);
    assert.deepEqual(terminosProhibidosEn(t), [], t);
  }
  // La aclaración que distingue habilitar de certificar está a la vista.
  assert.match(COPY_ADMINISTRACION.noCertifica, /no es certificar una matrícula/);
  // Los términos se detectan (si no, la prueba de arriba no prueba nada).
  assert.deepEqual(terminosProhibidosDeAdministracionEn('Profesional aprobado por Administración'), ['profesional aprobado']);
  assert.deepEqual(terminosProhibidosDeAdministracionEn('No es una sanción'), ['sanción']);
});

test('criterio 8: los avisos nuevos son tipos que las APK leen, con vistas que conocen, y sin el fundamento interno', () => {
  for (const tipo of ['ADMINISTRATIVE_DECISION', 'PROFESSIONAL_ACCESS_SUSPENDED', 'PROFESSIONAL_ACCESS_RESTORED'] as const) {
    assert.ok((TIPOS_DE_NOVEDAD as readonly string[]).includes(tipo));
    for (const alcance of ALCANCES) {
      const vista = vistaDeNovedad(tipo, alcance, tipo === 'ADMINISTRATIVE_DECISION');
      assert.ok((VISTAS_DE_NOVEDAD as readonly string[]).includes(vista), vista);
      assert.ok(vista === 'NEWS' || vista === 'RELATIONSHIPS', 'solo vistas que ya abren la candidata 0.17.0-3 y el website');
    }
  }
  const hechos = ['ObservacionRegistrada', 'AlcanceVerificado', 'AlcanceRechazado', 'AlcanceSuspendido', 'AlcanceRehabilitado', 'HabilitacionConcedida', 'HabilitacionRetirada'];
  const textos: string[] = [];
  for (const alcance of ALCANCES) {
    for (const hecho of hechos) {
      for (const puedeOperarDespues of [true, false]) {
        const t = textoDeNovedad('ADMINISTRATIVE_DECISION', { alcance, fuente: null, decision: { hecho, mensaje: 'Revisá la constancia', puedeOperar: puedeOperarDespues } });
        textos.push(t.title, t.body);
        assert.match(t.body, /Administración te escribió: «Revisá la constancia»/);
        assert.doesNotMatch(t.body, /fundamento/i);
        assert.doesNotMatch(t.body, /respond|subsan/i, 'no promete acciones que no existen');
      }
    }
    const s = textoDeNovedad('PROFESSIONAL_ACCESS_SUSPENDED', { alcance, fuente: null, profesional: 'Lic. Paula Ríos' });
    const r = textoDeNovedad('PROFESSIONAL_ACCESS_RESTORED', { alcance, fuente: null, profesional: 'Lic. Paula Ríos' });
    textos.push(s.title, s.body, r.title, r.body);
    assert.match(s.body, /^Lic\. Paula Ríos tiene suspendido el acceso a .* en BE\./);
    assert.match(r.body, /solo si su vínculo con vos y tu autorización siguen vigentes/);
  }
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeAntropometriaEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeAdministracionEn(t), [], t);
  }
  // La forma que valida la candidata 0.17.0-3 (NovedadSchema, el mismo contrato): kind texto, source null, vista conocida.
  const n = { newsId: 'n1', kind: 'PROFESSIONAL_ACCESS_SUSPENDED', scope: 'NUTRICION', source: null, title: 'x', body: 'y', date: null, occurredAt: null, recordedAt: '2026-10-25T12:00:00.000Z', readAt: null, open: { view: 'RELATIONSHIPS', referenceId: null } };
  assert.ok(NovedadSchema.safeParse(n).success);
});

test('la ficha no admite campos de más: nada que se parezca a un dato de salud entra por error', () => {
  const area = {
    scope: 'NUTRICION',
    situation: 'CAN_OPERATE',
    verification: { state: 'VERIFICADO', since: '2026-10-01T10:00:00.000Z' },
    enablement: { state: 'CONCEDIDA', since: '2026-10-01T10:00:00.000Z' },
    canOperate: true,
    version: 'a2-1',
    availableDecisions: ['SUSPEND', 'WITHDRAW_ENABLEMENT'],
    linkedPeople: { active: 2, paused: 0 },
    lastObservation: null,
  };
  const ficha = {
    data: {
      professional: { professionalId: 'p', displayName: 'Lic. P', profileType: 'HEALTH_PROFESSIONAL', email: 'p@example.invalid', accountState: 'OPERATIVA', profileSince: null },
      scopes: [area],
    },
  };
  assert.ok(FichaDeProfesionalResponseSchema.safeParse(ficha).success);
  const conPersonas = structuredClone(ficha) as { data: { scopes: Record<string, unknown>[] } };
  conPersonas.data.scopes[0]!.people = [{ name: 'Martina' }];
  assert.equal(FichaDeProfesionalResponseSchema.safeParse(conPersonas).success, false);
});
