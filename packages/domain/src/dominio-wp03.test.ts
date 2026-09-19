/**
 * WP-03 — pruebas unitarias del dominio (docs/paquetes/WP-03.md §6):
 * - TEST-RNF-DAT-001 en el dominio: una prueba por transición declarada y por cada transición prohibida de las máquinas
 *   del 06 §7.3.2, §7.5.2 y §7.7.5, y de la verificación (§6.8.2);
 * - TEST-RF-021 V1…V7 (DV-05) sobre la evaluación pura del PDP: «una condición faltante impide la operación» y
 *   «ninguna dimensión aislada autoriza» (REG-06-53).
 * La base repite las mismas listas blancas con triggers (test/integration/maquinas-wp03.int-spec.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  ALCANCES,
  ETIQUETA_DE_ALCANCE,
  ETIQUETA_DE_FINALIDAD,
  FINALIDAD_DE_ALCANCE,
  Finalidad,
  TIPO_DE_ALCANCE,
  finalidadCorrespondeAlAlcance,
} from './alcance';
import { DIMENSIONES_DE_AUTORIZACION, evaluarAutorizacion, modoDeAcceso, type HechosDeAutorizacion } from './autorizacion';
import {
  SituacionDeConsentimiento,
  TRANSICIONES_DE_CONSENTIMIENTO,
  evaluarTransicionDeConsentimiento,
  transicionDeOtorgamiento,
  type TransicionDeConsentimiento,
} from './consentimiento-profesional';
import {
  AlcanceSchema,
  CrearSolicitudDeVinculoRequestSchema,
  FinalidadSchema,
  OtorgarConsentimientoRequestSchema,
  PausarVinculoRequestSchema,
  TokenDeVersionSchema,
} from './contratos-vinculo';
import { COPY_VINCULO, ETIQUETA_DE_EVENTO_DE_VINCULO, estadoParaMostrar, etiquetaDeActor, etiquetaDeConsentimiento, etiquetaDeEvento } from './copy-vinculo';
import { CATALOGO_DE_TEXTOS, TIPO_DE_TEXTO_DE_B2, VERSION_VIGENTE } from './textos';
import {
  EstadoDeVerificacionProfesional,
  TRANSICIONES_DE_HABILITACION,
  TRANSICIONES_DE_VERIFICACION,
  evaluarTransicionDeHabilitacion,
  evaluarTransicionDeVerificacion,
  type TransicionDeVerificacion,
} from './verificacion-profesional';
import {
  EstadoDeAlcanceDeVinculo,
  EstadoDeSolicitudDeVinculo,
  MotivoDePausa,
  TRANSICIONES_DE_ALCANCE_DE_VINCULO,
  TRANSICIONES_DE_SOLICITUD_DE_VINCULO,
  evaluarTransicionDeAlcance,
  evaluarTransicionDeSolicitud,
  type ContextoDeTransicionDeAlcance,
  type ContextoDeTransicionDeSolicitud,
  type TransicionDeAlcanceDeVinculo,
  type TransicionDeSolicitud,
} from './vinculo';

// ─── Alcance y finalidad ────────────────────────────────────────────────────────────────────────

test('T-06-45 — tres alcances; Especialidad XOR Capacidad (REG-06-32); una finalidad por alcance (DL-039)', () => {
  assert.deepEqual([...ALCANCES], ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']);
  assert.deepEqual([...AlcanceSchema.options], [...ALCANCES]);
  assert.deepEqual(TIPO_DE_ALCANCE, { NUTRICION: 'ESPECIALIDAD', ENTRENAMIENTO: 'ESPECIALIDAD', ANTROPOMETRIA: 'CAPACIDAD_TRANSVERSAL' });
  assert.deepEqual([...FinalidadSchema.options].sort(), Object.values(Finalidad).sort());
  for (const a of ALCANCES) {
    assert.ok(ETIQUETA_DE_ALCANCE[a]);
    assert.ok(ETIQUETA_DE_FINALIDAD[FINALIDAD_DE_ALCANCE[a]]);
    assert.ok(finalidadCorrespondeAlAlcance(a, FINALIDAD_DE_ALCANCE[a]));
    for (const otro of ALCANCES.filter((x) => x !== a)) assert.ok(!finalidadCorrespondeAlAlcance(a, FINALIDAD_DE_ALCANCE[otro]), `${a} no admite la finalidad de ${otro}`);
  }
});

// ─── Verificación profesional (06 §6.8) ─────────────────────────────────────────────────────────

const ESTADOS_DE_VERIFICACION = [null, ...Object.values(EstadoDeVerificacionProfesional)] as const;
const TRANSICIONES_V: readonly TransicionDeVerificacion[] = [
  'PresentarAlcance',
  'RegistrarObservacion',
  'PresentarSubsanacion',
  'VerificarAlcance',
  'RechazarAlcance',
  'VolverAPresentar',
  'SuspenderAlcance',
  'RehabilitarAlcance',
];

test('06 §6.8.2 — la lista blanca de la verificación es la literal del 06', () => {
  assert.deepEqual(
    TRANSICIONES_DE_VERIFICACION.map((t) => `${t.transicion}:${t.origen ?? 'inicio'}->${t.destino}`),
    [
      'PresentarAlcance:inicio->PENDIENTE',
      'RegistrarObservacion:PENDIENTE->PENDIENTE',
      'PresentarSubsanacion:PENDIENTE->PENDIENTE',
      'VerificarAlcance:PENDIENTE->VERIFICADO',
      'RechazarAlcance:PENDIENTE->RECHAZADO',
      'VolverAPresentar:RECHAZADO->PENDIENTE',
      'SuspenderAlcance:VERIFICADO->SUSPENDIDO',
      'RehabilitarAlcance:SUSPENDIDO->VERIFICADO',
    ],
  );
});

test('06 §6.8.2 — cada transición declarada procede; toda otra combinación se rechaza (TEST-RNF-DAT-001)', () => {
  let declaradas = 0;
  let prohibidas = 0;
  for (const estado of ESTADOS_DE_VERIFICACION) {
    for (const t of TRANSICIONES_V) {
      const declarada = TRANSICIONES_DE_VERIFICACION.some((x) => x.transicion === t && x.origen === estado);
      const r = evaluarTransicionDeVerificacion(estado, t, 'resolución sintética');
      if (declarada) {
        declaradas++;
        assert.ok(r.permitida, `${t} desde ${estado ?? 'inicio'}`);
      } else {
        prohibidas++;
        assert.deepEqual(r, { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' }, `${t} desde ${estado ?? 'inicio'}`);
      }
    }
  }
  assert.equal(declaradas, 8);
  assert.equal(prohibidas, ESTADOS_DE_VERIFICACION.length * TRANSICIONES_V.length - 8);
  assert.deepEqual(evaluarTransicionDeVerificacion('PENDIENTE', 'VerificarAlcance', '  '), { permitida: false, motivo: 'SIN_FUNDAMENTO' });
});

test('Habilitación mínima (DL-036): concesión explícita, retiro y nueva concesión; nada más', () => {
  assert.deepEqual(TRANSICIONES_DE_HABILITACION.map((t) => `${t.transicion}:${t.origen ?? 'inicio'}->${t.destino}`), [
    'ConcederHabilitacion:inicio->CONCEDIDA',
    'RetirarHabilitacion:CONCEDIDA->RETIRADA',
    'ConcederHabilitacion:RETIRADA->CONCEDIDA',
  ]);
  assert.ok(evaluarTransicionDeHabilitacion(null, 'ConcederHabilitacion', 'f').permitida);
  assert.deepEqual(evaluarTransicionDeHabilitacion('CONCEDIDA', 'ConcederHabilitacion', 'f'), { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
  assert.deepEqual(evaluarTransicionDeHabilitacion(null, 'RetirarHabilitacion', 'f'), { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
  assert.deepEqual(evaluarTransicionDeHabilitacion('RETIRADA', 'RetirarHabilitacion', 'f'), { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
});

// ─── Solicitud de vínculo (06 §7.3.2) ───────────────────────────────────────────────────────────

const ESTADOS_DE_SOLICITUD = [null, ...Object.values(EstadoDeSolicitudDeVinculo)] as const;
const TRANSICIONES_S: readonly TransicionDeSolicitud[] = ['CrearSolicitud', 'AceptarSolicitud', 'RechazarSolicitud', 'CaducarSolicitud', 'InvalidarSolicitud'];

function contextoFavorableDeSolicitud(t: TransicionDeSolicitud): ContextoDeTransicionDeSolicitud {
  switch (t) {
    case 'CrearSolicitud':
      return { transicion: t, actor: 'PROFESIONAL', alcanceYFinalidadValidos: true, elegibilidadEstructural: true };
    case 'AceptarSolicitud':
      return { transicion: t, actor: 'ASESORADO', confirmacionExplicita: true, reevaluacionFavorable: true };
    case 'RechazarSolicitud':
      return { transicion: t, actor: 'ASESORADO', confirmacionExplicita: true };
    case 'CaducarSolicitud':
      return { transicion: t, actor: 'SISTEMA', vencida: true };
    case 'InvalidarSolicitud':
      return { transicion: t, actor: 'SISTEMA', incompatible: true };
  }
}

test('06 §7.3.2 — la lista blanca de la solicitud es la literal del 06', () => {
  assert.deepEqual(
    TRANSICIONES_DE_SOLICITUD_DE_VINCULO.map((t) => `${t.transicion}:${t.origen ?? 'inicio'}->${t.destino}:${t.actores.join('|')}`),
    [
      'CrearSolicitud:inicio->PENDIENTE:PROFESIONAL|ASESORADO',
      'AceptarSolicitud:PENDIENTE->ACEPTADA:ASESORADO',
      'RechazarSolicitud:PENDIENTE->RECHAZADA:ASESORADO',
      'CaducarSolicitud:PENDIENTE->CADUCADA:SISTEMA',
      'InvalidarSolicitud:PENDIENTE->INVALIDADA:SISTEMA',
    ],
  );
});

test('06 §7.3.2 — cada transición declarada procede; toda otra combinación se rechaza; los terminales no tienen salida', () => {
  let declaradas = 0;
  for (const estado of ESTADOS_DE_SOLICITUD) {
    for (const t of TRANSICIONES_S) {
      const r = evaluarTransicionDeSolicitud(estado, contextoFavorableDeSolicitud(t));
      const declarada = TRANSICIONES_DE_SOLICITUD_DE_VINCULO.some((x) => x.transicion === t && x.origen === estado);
      if (declarada) {
        declaradas++;
        assert.ok(r.permitida, `${t} desde ${estado ?? 'inicio'}`);
      } else {
        assert.deepEqual(r, { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' }, `${t} desde ${estado ?? 'inicio'}`);
      }
    }
  }
  assert.equal(declaradas, 5);
});

test('06 §7.3.2 — guardas: actor, confirmación, reevaluación (REG-06-49), vencimiento e incompatibilidad', () => {
  assert.deepEqual(evaluarTransicionDeSolicitud('PENDIENTE', { ...contextoFavorableDeSolicitud('AceptarSolicitud'), actor: 'PROFESIONAL' }), {
    permitida: false,
    motivo: 'ACTOR_NO_HABILITADO',
  });
  assert.deepEqual(evaluarTransicionDeSolicitud('PENDIENTE', { ...contextoFavorableDeSolicitud('RechazarSolicitud'), actor: 'PROFESIONAL' }), {
    permitida: false,
    motivo: 'ACTOR_NO_HABILITADO',
  });
  assert.deepEqual(evaluarTransicionDeSolicitud('PENDIENTE', { transicion: 'AceptarSolicitud', actor: 'ASESORADO', confirmacionExplicita: false, reevaluacionFavorable: true }), {
    permitida: false,
    motivo: 'SIN_CONFIRMACION_EXPLICITA',
  });
  assert.deepEqual(evaluarTransicionDeSolicitud('PENDIENTE', { transicion: 'AceptarSolicitud', actor: 'ASESORADO', confirmacionExplicita: true, reevaluacionFavorable: false }), {
    permitida: false,
    motivo: 'REEVALUACION_DESFAVORABLE',
  });
  assert.deepEqual(evaluarTransicionDeSolicitud(null, { transicion: 'CrearSolicitud', actor: 'SISTEMA', alcanceYFinalidadValidos: true, elegibilidadEstructural: true }), {
    permitida: false,
    motivo: 'ACTOR_NO_HABILITADO',
  });
  assert.deepEqual(evaluarTransicionDeSolicitud(null, { transicion: 'CrearSolicitud', actor: 'ASESORADO', alcanceYFinalidadValidos: false, elegibilidadEstructural: true }), {
    permitida: false,
    motivo: 'ALCANCE_O_FINALIDAD_INVALIDOS',
  });
  assert.deepEqual(evaluarTransicionDeSolicitud(null, { transicion: 'CrearSolicitud', actor: 'PROFESIONAL', alcanceYFinalidadValidos: true, elegibilidadEstructural: false }), {
    permitida: false,
    motivo: 'NO_ELEGIBLE',
  });
  assert.deepEqual(evaluarTransicionDeSolicitud('PENDIENTE', { transicion: 'CaducarSolicitud', actor: 'SISTEMA', vencida: false }), { permitida: false, motivo: 'NO_VENCIDA' });
  assert.deepEqual(evaluarTransicionDeSolicitud('PENDIENTE', { transicion: 'InvalidarSolicitud', actor: 'SISTEMA', incompatible: false }), {
    permitida: false,
    motivo: 'SIN_INCOMPATIBILIDAD',
  });
  assert.deepEqual(evaluarTransicionDeSolicitud('PENDIENTE', { transicion: 'CaducarSolicitud', actor: 'ASESORADO', vencida: true }), {
    permitida: false,
    motivo: 'ACTOR_NO_HABILITADO',
  });
});

// ─── Vínculo por Alcance (06 §7.5.2) ────────────────────────────────────────────────────────────

const ESTADOS_DE_ALCANCE = [null, ...Object.values(EstadoDeAlcanceDeVinculo)] as const;
const TRANSICIONES_A: readonly TransicionDeAlcanceDeVinculo[] = ['AceptarAlcanceDeVinculo', 'PausarAlcance', 'ReanudarAlcance', 'FinalizarAlcance'];

function contextoFavorableDeAlcance(t: TransicionDeAlcanceDeVinculo): ContextoDeTransicionDeAlcance {
  switch (t) {
    case 'AceptarAlcanceDeVinculo':
      return { transicion: t, actor: 'ASESORADO', solicitudAceptada: true };
    case 'PausarAlcance':
      return { transicion: t, actor: 'ASESORADO', decisionExplicita: true, motivo: 'DECISION_PERSONAL' };
    case 'ReanudarAlcance':
      return { transicion: t, actor: 'ASESORADO', decisionExplicita: true, actorEsQuienPauso: true };
    case 'FinalizarAlcance':
      return { transicion: t, actor: 'ASESORADO', decisionExplicita: true, motivo: 'OBJETIVO_CUMPLIDO' };
  }
}

test('06 §7.5.2 — la lista blanca del vínculo por alcance es la literal del 06 (FinalizarAlcance desde ACEPTADO y PAUSADO)', () => {
  assert.deepEqual(TRANSICIONES_DE_ALCANCE_DE_VINCULO.map((t) => `${t.transicion}:${t.origen ?? 'inicio'}->${t.destino}`), [
    'AceptarAlcanceDeVinculo:inicio->ACEPTADO',
    'PausarAlcance:ACEPTADO->PAUSADO',
    'ReanudarAlcance:PAUSADO->ACEPTADO',
    'FinalizarAlcance:ACEPTADO->FINALIZADO',
    'FinalizarAlcance:PAUSADO->FINALIZADO',
  ]);
});

test('06 §7.5.2 — cada transición declarada procede; toda otra se rechaza; FINALIZADO no tiene salida (INV-06-58)', () => {
  let declaradas = 0;
  for (const estado of ESTADOS_DE_ALCANCE) {
    for (const t of TRANSICIONES_A) {
      const r = evaluarTransicionDeAlcance(estado, contextoFavorableDeAlcance(t));
      const declarada = TRANSICIONES_DE_ALCANCE_DE_VINCULO.some((x) => x.transicion === t && x.origen === estado);
      if (declarada) {
        declaradas++;
        assert.ok(r.permitida, `${t} desde ${estado ?? 'inicio'}`);
      } else {
        assert.deepEqual(r, { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' }, `${t} desde ${estado ?? 'inicio'}`);
      }
    }
  }
  assert.equal(declaradas, 5);
  for (const t of TRANSICIONES_A) assert.equal(evaluarTransicionDeAlcance('FINALIZADO', contextoFavorableDeAlcance(t)).permitida, false);
});

test('DL-033 — motivo obligatorio y de lista cerrada; reanuda quien pausó; el sistema solo finaliza por cierre de cuenta', () => {
  const pausar = (motivo: string | null, actor: 'ASESORADO' | 'PROFESIONAL' | 'SISTEMA' = 'PROFESIONAL') =>
    evaluarTransicionDeAlcance('ACEPTADO', { transicion: 'PausarAlcance', actor, decisionExplicita: true, motivo });
  for (const m of Object.values(MotivoDePausa)) assert.ok(pausar(m).permitida, m);
  assert.deepEqual(pausar(null), { permitida: false, motivo: 'SIN_MOTIVO' });
  assert.deepEqual(pausar('me dolía la rodilla'), { permitida: false, motivo: 'MOTIVO_NO_ADMITIDO' });
  assert.deepEqual(pausar('DECISION_PERSONAL', 'SISTEMA'), { permitida: false, motivo: 'ACTOR_NO_HABILITADO' });

  const finalizar = (motivo: string, actor: 'ASESORADO' | 'PROFESIONAL' | 'SISTEMA') =>
    evaluarTransicionDeAlcance('PAUSADO', { transicion: 'FinalizarAlcance', actor, decisionExplicita: true, motivo });
  assert.ok(finalizar('CIERRE_DE_CUENTA', 'SISTEMA').permitida);
  assert.deepEqual(finalizar('OBJETIVO_CUMPLIDO', 'SISTEMA'), { permitida: false, motivo: 'MOTIVO_NO_ADMITIDO' });
  assert.deepEqual(finalizar('CIERRE_DE_CUENTA', 'ASESORADO'), { permitida: false, motivo: 'MOTIVO_NO_ADMITIDO' });
  assert.ok(finalizar('CAMBIO_DE_PROFESIONAL', 'PROFESIONAL').permitida);

  assert.deepEqual(
    evaluarTransicionDeAlcance('PAUSADO', { transicion: 'ReanudarAlcance', actor: 'PROFESIONAL', decisionExplicita: true, actorEsQuienPauso: false }),
    { permitida: false, motivo: 'SOLO_REANUDA_QUIEN_PAUSO' },
  );
  assert.deepEqual(evaluarTransicionDeAlcance(null, { transicion: 'AceptarAlcanceDeVinculo', actor: 'PROFESIONAL', solicitudAceptada: true }), {
    permitida: false,
    motivo: 'ACTOR_NO_HABILITADO',
  });
});

// ─── Consentimiento B2 (06 §7.7.5) ──────────────────────────────────────────────────────────────

const SITUACIONES = [null, ...Object.values(SituacionDeConsentimiento)] as const;
const TRANSICIONES_C: readonly TransicionDeConsentimiento[] = ['OtorgarConsentimiento', 'AceptarNuevaVersion', 'RevocarConsentimiento', 'OtorgarNuevamente'];
const favorableC = (t: TransicionDeConsentimiento) => ({
  transicion: t,
  actorEsTitular: true,
  decisionExplicita: true,
  versionPresentadaAplicable: true,
  versionPresentadaEsSucesora: true,
  alcanceDeVinculoAceptado: true,
});

test('06 §7.7.5 — la lista blanca del consentimiento es la literal del 06', () => {
  assert.deepEqual(TRANSICIONES_DE_CONSENTIMIENTO.map((t) => `${t.transicion}:${t.origen ?? 'inicio'}->${t.destino}`), [
    'OtorgarConsentimiento:inicio->VIGENTE',
    'AceptarNuevaVersion:VIGENTE->VIGENTE',
    'RevocarConsentimiento:VIGENTE->REVOCADO',
    'OtorgarNuevamente:REVOCADO->VIGENTE',
  ]);
});

test('06 §7.7.5 — cada transición declarada procede; toda otra se rechaza (p. ej. REVOCADO → REVOCADO)', () => {
  let declaradas = 0;
  for (const s of SITUACIONES) {
    for (const t of TRANSICIONES_C) {
      const r = evaluarTransicionDeConsentimiento(s, favorableC(t));
      const declarada = TRANSICIONES_DE_CONSENTIMIENTO.some((x) => x.transicion === t && x.origen === s);
      if (declarada) {
        declaradas++;
        assert.ok(r.permitida, `${t} desde ${s ?? 'inicio'}`);
      } else {
        assert.deepEqual(r, { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' }, `${t} desde ${s ?? 'inicio'}`);
      }
    }
  }
  assert.equal(declaradas, 4);
});

test('INV-06-62, INV-06-60, REG-06-50 — solo el titular; versión aplicable; aceptar una versión no acepta futuras', () => {
  assert.deepEqual(evaluarTransicionDeConsentimiento(null, { ...favorableC('OtorgarConsentimiento'), actorEsTitular: false }), {
    permitida: false,
    motivo: 'ACTOR_NO_TITULAR',
  });
  assert.deepEqual(evaluarTransicionDeConsentimiento('VIGENTE', { ...favorableC('RevocarConsentimiento'), actorEsTitular: false }), {
    permitida: false,
    motivo: 'ACTOR_NO_TITULAR',
  });
  assert.deepEqual(evaluarTransicionDeConsentimiento(null, { ...favorableC('OtorgarConsentimiento'), versionPresentadaAplicable: false }), {
    permitida: false,
    motivo: 'VERSION_NO_APLICABLE',
  });
  assert.deepEqual(evaluarTransicionDeConsentimiento('VIGENTE', { ...favorableC('AceptarNuevaVersion'), versionPresentadaEsSucesora: false }), {
    permitida: false,
    motivo: 'VERSION_NO_SUCESORA',
  });
  assert.deepEqual(evaluarTransicionDeConsentimiento(null, { ...favorableC('OtorgarConsentimiento'), alcanceDeVinculoAceptado: false }), {
    permitida: false,
    motivo: 'VINCULO_NO_ACEPTADO',
  });
  // Revocar no exige vínculo aceptado: se puede revocar con el vínculo pausado o finalizado.
  assert.ok(evaluarTransicionDeConsentimiento('VIGENTE', { ...favorableC('RevocarConsentimiento'), alcanceDeVinculoAceptado: false }).permitida);
});

test('DL-038 — CON-02 elige la transición según la situación actual', () => {
  assert.equal(transicionDeOtorgamiento(null, null, 'c1'), 'OtorgarConsentimiento');
  assert.equal(transicionDeOtorgamiento('VIGENTE', 'c1', 'c1'), 'SIN_CAMBIO');
  assert.equal(transicionDeOtorgamiento('VIGENTE', 'c1', 'c2'), 'AceptarNuevaVersion');
  assert.equal(transicionDeOtorgamiento('REVOCADO', 'c1', 'c1'), 'OtorgarNuevamente');
});

// ─── PDP: evaluación pura (RF-021; TEST-RF-021 V1…V7 de DV-05) ─────────────────────────────────

const base: HechosDeAutorizacion = {
  operacion: { alcance: 'NUTRICION', finalidad: 'ACOMPANAMIENTO_NUTRICIONAL' },
  actor: { identidadId: 'pn', cuentaOperativa: true, tienePerfilProfesional: true },
  titular: { identidadId: 'a01', cuentaOperativa: true, a3Vigente: true },
  verificacion: 'VERIFICADO',
  habilitacion: 'CONCEDIDA',
  alcanceDeVinculo: { id: 'rel-n1', alcance: 'NUTRICION', finalidad: 'ACOMPANAMIENTO_NUTRICIONAL', estado: 'ACEPTADO' },
  consentimiento: { id: 'b2-n1', finalidad: 'ACOMPANAMIENTO_NUTRICIONAL', situacion: 'VIGENTE', versionVigenteId: 'v-c1' },
};

test('PDP — contexto positivo: las siete dimensiones favorables permiten y registran componente y versión (REG-06-50)', () => {
  const d = evaluarAutorizacion(base);
  assert.deepEqual(d, {
    permitida: true,
    dimensionesDesfavorables: [],
    alcanceDeVinculoId: 'rel-n1',
    consentimientoId: 'b2-n1',
    versionDeConsentimientoId: 'v-c1',
  });
  assert.equal(modoDeAcceso(d), 'CONTEXTUAL');
  assert.deepEqual([...DIMENSIONES_DE_AUTORIZACION], ['ROL', 'ESPECIALIDAD_O_CAPACIDAD', 'SITUACION', 'VINCULO', 'CONSENTIMIENTO', 'FINALIDAD', 'ALCANCE']);
});

const variantes: readonly [string, Partial<HechosDeAutorizacion>, string][] = [
  ['V1 rol inadecuado: sin perfil profesional', { actor: { ...base.actor, tienePerfilProfesional: false } }, 'ROL'],
  ['V1 rol inadecuado: el titular pide su propio dashboard', { titular: { ...base.titular!, identidadId: 'pn' } }, 'ROL'],
  ['V2 alcance no verificado (PENDIENTE)', { verificacion: 'PENDIENTE' }, 'ESPECIALIDAD_O_CAPACIDAD'],
  ['V2 alcance rechazado', { verificacion: 'RECHAZADO' }, 'ESPECIALIDAD_O_CAPACIDAD'],
  ['V2 sin trayectoria de verificación', { verificacion: null }, 'ESPECIALIDAD_O_CAPACIDAD'],
  ['V3 alcance suspendido', { verificacion: 'SUSPENDIDO' }, 'SITUACION'],
  ['V3 habilitación retirada', { habilitacion: 'RETIRADA' }, 'SITUACION'],
  ['V3 sin habilitación (INV-06-87)', { habilitacion: null }, 'SITUACION'],
  ['V3 A3 del titular no vigente (TEST-AUTH-005)', { titular: { ...base.titular!, a3Vigente: false } }, 'SITUACION'],
  ['V3 cuenta del titular no operativa', { titular: { ...base.titular!, cuentaOperativa: false } }, 'SITUACION'],
  ['V3 cuenta del actor no operativa', { actor: { ...base.actor, cuentaOperativa: false } }, 'SITUACION'],
  ['V4 vínculo PAUSADO (TEST-AUTH-007)', { alcanceDeVinculo: { ...base.alcanceDeVinculo!, estado: 'PAUSADO' } }, 'VINCULO'],
  ['V4 vínculo FINALIZADO (TEST-AUTH-008)', { alcanceDeVinculo: { ...base.alcanceDeVinculo!, estado: 'FINALIZADO' } }, 'VINCULO'],
  ['V5 B2 REVOCADO (TEST-RF-022)', { consentimiento: { ...base.consentimiento!, situacion: 'REVOCADO' } }, 'CONSENTIMIENTO'],
  ['V5 sin B2 (TEST-AUTH-006)', { consentimiento: null }, 'CONSENTIMIENTO'],
  ['V5 B2 sin versión identificable (INV-06-60)', { consentimiento: { ...base.consentimiento!, versionVigenteId: null } }, 'CONSENTIMIENTO'],
  ['V6 finalidad ajena', { operacion: { alcance: 'NUTRICION', finalidad: 'PLANIFICACION_DEL_ENTRENAMIENTO' } }, 'FINALIDAD'],
  ['V7 alcance pedido Entrenamiento con vínculo de Nutrición', { operacion: { alcance: 'ENTRENAMIENTO', finalidad: 'PLANIFICACION_DEL_ENTRENAMIENTO' } }, 'ALCANCE'],
];

for (const [nombre, cambio, dimension] of variantes) {
  test(`PDP — ${nombre}: se deniega y la auditoría atribuye ${dimension}`, () => {
    const d = evaluarAutorizacion({ ...base, ...cambio });
    assert.equal(d.permitida, false);
    assert.ok(d.dimensionesDesfavorables.includes(dimension as never), JSON.stringify(d.dimensionesDesfavorables));
    assert.equal(modoDeAcceso(d), 'BLOCKED');
  });
}

test('PDP — titular inexistente o no revelable: deniega igual (UC-I02 E05), sin distinguirlo en la decisión', () => {
  const d = evaluarAutorizacion({ ...base, titular: null });
  assert.equal(d.permitida, false);
});

test('REG-06-53 — ninguna dimensión aislada autoriza: con todo lo demás ausente, cada hecho favorable solo no alcanza', () => {
  const vacio: HechosDeAutorizacion = {
    operacion: base.operacion,
    actor: { identidadId: 'pn', cuentaOperativa: false, tienePerfilProfesional: false },
    titular: null,
    verificacion: null,
    habilitacion: null,
    alcanceDeVinculo: null,
    consentimiento: null,
  };
  const aislados: Partial<HechosDeAutorizacion>[] = [
    { actor: base.actor },
    { titular: base.titular },
    { verificacion: 'VERIFICADO' },
    { habilitacion: 'CONCEDIDA' },
    { alcanceDeVinculo: base.alcanceDeVinculo },
    { consentimiento: base.consentimiento },
  ];
  for (const a of aislados) assert.equal(evaluarAutorizacion({ ...vacio, ...a }).permitida, false, JSON.stringify(a));
  // Y todas menos una tampoco: cada dimensión es necesaria.
  for (const [, cambio] of variantes) assert.equal(evaluarAutorizacion({ ...base, ...cambio }).permitida, false);
});

// ─── Contratos: lo que el cliente declara no llega al PDP (TEST-AUTH-009) ───────────────────────

test('TEST-AUTH-009 — campos autoritativos del cliente se rechazan por schema estricto (409 → 400 UNKNOWN_FIELD en la API)', () => {
  const rel01 = { target: { type: 'ADVISEE', identityId: 'x' }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' };
  assert.ok(CrearSolicitudDeVinculoRequestSchema.safeParse(rel01).success);
  for (const extra of [{ professionalId: 'otro' }, { actorCapabilities: ['PRO'] }, { accessMode: 'CONTEXTUAL' }]) {
    const r = CrearSolicitudDeVinculoRequestSchema.safeParse({ ...rel01, ...extra });
    assert.equal(r.success, false);
    assert.equal(r.error?.issues[0]?.code, 'unrecognized_keys');
  }
  for (const extra of [{ professionalId: 'x' }, { scope: 'ENTRENAMIENTO' }, { textHash: 'x' }]) {
    assert.equal(OtorgarConsentimientoRequestSchema.safeParse({ consentVersionId: 'c1', ...extra }).success, false);
  }
  assert.equal(PausarVinculoRequestSchema.safeParse({ expectedVersion: 'v1', reason: 'texto libre' }).success, false);
  assert.ok(TokenDeVersionSchema.safeParse('v12').success);
  for (const malo of ['v0', '12', 'v-1', 'vx']) assert.equal(TokenDeVersionSchema.safeParse(malo).success, false, malo);
});

// ─── Textos B2 (08 §12.3; DL-028) y copy (10-B04 §44-§46) ───────────────────────────────────────

test('08 §12.3 — textos B2 diferenciados por perfil, versionados, con hash real y sin aceptar versiones futuras', () => {
  const san = VERSION_VIGENTE[TIPO_DE_TEXTO_DE_B2.SANITARIO];
  const nosan = VERSION_VIGENTE[TIPO_DE_TEXTO_DE_B2.NO_SANITARIO];
  assert.match(san.texto, /secreto profesional/);
  assert.match(nosan.texto, /no es un profesional de la salud/);
  assert.match(nosan.texto, /mínimo detalle suficiente/);
  for (const v of [san, nosan]) {
    assert.equal(createHash('sha256').update(v.texto, 'utf8').digest('hex'), v.hash);
    assert.match(v.texto, /Aceptar esta versión no acepta versiones futuras/);
    assert.match(v.texto, /no finaliza el vínculo/);
    assert.equal(v.reemplazaA, null);
  }
  assert.equal(new Set(CATALOGO_DE_TEXTOS.map((v) => v.id)).size, CATALOGO_DE_TEXTOS.length);
});

test('10-B04 §44-§46 — el copy de WP-03 no usa términos prohibidos ni códigos internos', () => {
  const todo = Object.values(COPY_VINCULO)
    .flatMap((v) => (typeof v === 'function' ? [(v as (...a: string[]) => string)('X', 'Y')] : typeof v === 'string' ? [v] : Object.values(v as Record<string, string>)))
    .join('\n');
  for (const prohibido of [
    /Aceptar y compartir/i,
    /puede ver todos tus datos/i,
    /Bloquear profesional/i,
    /Eliminar datos/i,
    /Restaurar acceso/i,
    /Escrib[ií] FINALIZAR/i,
    /paciente/i,
    /PDP|B2=|SCOPE_MISMATCH|DENY/,
    /modo lectura hist[oó]rica/i,
    /Datos ocultos/i,
    /borrad|eliminad/i,
  ]) {
    assert.doesNotMatch(todo, prohibido);
  }
  assert.equal(COPY_VINCULO.aclaracionDeConsentimiento, 'Solo podrá acceder a la información autorizada mientras el vínculo y este consentimiento sigan vigentes.');
  assert.equal(COPY_VINCULO.autorizarAcceso, 'Autorizar acceso');
});

// ─── Estados y historial para mostrar (10-B04 §15, §20, §28-§29; H10-04-04) ────────────────────

test('10-B04:627-638 — cada evento de las tres máquinas tiene etiqueta humana; uno desconocido no se muestra crudo', () => {
  const eventos = new Set([
    ...TRANSICIONES_DE_SOLICITUD_DE_VINCULO.map((t) => t.evento),
    ...TRANSICIONES_DE_ALCANCE_DE_VINCULO.map((t) => t.evento),
    ...TRANSICIONES_DE_CONSENTIMIENTO.map((t) => t.evento),
  ]);
  assert.deepEqual([...eventos].sort(), Object.keys(ETIQUETA_DE_EVENTO_DE_VINCULO).sort());
  for (const e of eventos) assert.notEqual(etiquetaDeEvento(e), e);
  assert.equal(etiquetaDeEvento('EventoFuturo'), 'Cambio registrado');
  assert.equal(etiquetaDeEvento('toString'), 'Cambio registrado');
  assert.equal(etiquetaDeActor('SYSTEM', 'ADVISEE'), 'BE');
  assert.equal(etiquetaDeActor('ADVISEE', 'ADVISEE'), 'Vos');
  assert.equal(etiquetaDeActor('ADVISEE', 'PROFESSIONAL'), 'El asesorado');
  assert.equal(etiquetaDeActor('PROFESSIONAL', 'ADVISEE'), 'El profesional');
});

test('10-B04 §28-§29 y H10-04-04 — el profesional ve el estado mínimo, nunca la razón del bloqueo', () => {
  const pro = (relationshipState: 'ACEPTADO' | 'PAUSADO' | 'FINALIZADO', consentState: 'REQUIRED' | 'ACTIVE' | 'REVOKED', accessMode: 'BLOCKED' | 'CONTEXTUAL') =>
    estadoParaMostrar({ relationshipState, consentState, accessMode }, 'PROFESSIONAL');
  assert.deepEqual(pro('ACEPTADO', 'ACTIVE', 'CONTEXTUAL'), { estado: 'Activo · acceso contextual', detalle: null });
  assert.deepEqual(pro('ACEPTADO', 'REQUIRED', 'BLOCKED'), { estado: 'Vínculo activo', detalle: 'Acceso pendiente de autorización del asesorado' });
  assert.deepEqual(pro('ACEPTADO', 'REVOKED', 'BLOCKED'), { estado: 'Consentimiento revocado', detalle: 'Acceso no disponible' });
  // A3 revocada, cuenta suspendida o habilitación retirada: lo mismo, sin distinguir la causa (UC-I02 E05).
  assert.deepEqual(pro('ACEPTADO', 'ACTIVE', 'BLOCKED'), { estado: 'Vínculo activo', detalle: 'Acceso no disponible' });
  assert.deepEqual(pro('PAUSADO', 'ACTIVE', 'BLOCKED'), { estado: 'Pausado · sin acceso', detalle: null });
  assert.deepEqual(pro('FINALIZADO', 'REVOKED', 'BLOCKED'), { estado: 'Finalizado', detalle: null });
});

test('10-B04:538-553 — el asesorado ve «No efectivo» cuando su consentimiento activo hoy no habilita el acceso', () => {
  assert.equal(etiquetaDeConsentimiento('ACTIVE', 'CONTEXTUAL'), 'Activo');
  assert.equal(etiquetaDeConsentimiento('ACTIVE', 'BLOCKED'), 'No efectivo');
  assert.equal(etiquetaDeConsentimiento('REVOKED', 'BLOCKED'), 'Revocado');
  assert.equal(etiquetaDeConsentimiento('REQUIRED', 'BLOCKED'), 'Pendiente de tu decisión');
  assert.deepEqual(estadoParaMostrar({ relationshipState: 'PAUSADO', consentState: 'ACTIVE', accessMode: 'BLOCKED' }, 'ADVISEE'), {
    estado: 'Pausado',
    detalle: 'Consentimiento: no efectivo',
  });
  const todo = [
    ...Object.values(ETIQUETA_DE_EVENTO_DE_VINCULO),
    ...(['ACEPTADO', 'PAUSADO', 'FINALIZADO'] as const).flatMap((r) =>
      (['REQUIRED', 'ACTIVE', 'REVOKED'] as const).flatMap((c) =>
        (['BLOCKED', 'CONTEXTUAL'] as const).flatMap((m) =>
          (['PROFESSIONAL', 'ADVISEE'] as const).flatMap((p) => {
            const e = estadoParaMostrar({ relationshipState: r, consentState: c, accessMode: m }, p);
            return [e.estado, e.detalle ?? ''];
          }),
        ),
      ),
    ),
  ].join('\n');
  assert.doesNotMatch(todo, /PDP|B2|DENY|BLOCKED|CONTEXTUAL|REQUIRED|ACTIVE|REVOKED|paciente/);
});
