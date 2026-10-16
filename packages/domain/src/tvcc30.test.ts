/**
 * TVCC-30 (`tvcc30.ts`): las doce pruebas analíticas obligatorias del 11A §21 (TEST-TVCC-001 a 012), con el oráculo
 * SPEC-TVCC30-v1 del Documento 12 y el mapeo de BE de DEUDA_LEGAJO DL-135. Los hechos son sintéticos y se arman a mano:
 * cada prueba dice qué ciclo construye y por qué entra, sale o no se puede clasificar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularTvcc30,
  canonicoTvcc30,
  CRITERIOS_TVCC30,
  INTERPRETACION_TVCC30,
  SPEC_TVCC30_V1,
  ventanaTvcc30,
  type EntradaTvcc30,
  type ExpectativaDeRevisionTvcc30,
  type HistoriaDelAlcanceTvcc30,
  type ProcesoTvcc30,
  type RevisionTvcc30,
} from './tvcc30';

const CORTE = '2026-10-16';
/** Un instante dado en hora de Buenos Aires (UTC−3, sin horario de verano). */
const en = (fechaHora: string): string => new Date(`${fechaHora}:00-03:00`).toISOString();

let siguiente = 0;
const id = (prefijo: string): string => `${prefijo}-${String(++siguiente).padStart(3, '0')}`;

function expectativa(fechaObjetivo: string | null, registradaEn: string, x: Partial<ExpectativaDeRevisionTvcc30> = {}): ExpectativaDeRevisionTvcc30 {
  return { id: id('exp'), predecesoraId: null, fechaObjetivo, registradaEn, revisionId: null, versionDePlanId: id('ver'), ...x };
}

function revision(registradaEn: string, aplicadaEn: string | null, resultado = 'MANTENER'): RevisionTvcc30 {
  return {
    id: id('rev'),
    resultado,
    registradaEn,
    aplicacion: aplicadaEn ? { eventoId: id('evt'), tipo: resultado === 'FINALIZAR' ? 'CIERRE_PROCESO' : 'CONTINUIDAD', registradaEn: aplicadaEn, versionDePlanCreadaId: null } : null,
  };
}

interface Seguimiento {
  readonly proceso: ProcesoTvcc30;
  readonly vinculo: HistoriaDelAlcanceTvcc30;
}

/**
 * Un seguimiento con un plan activado el 1/9 que fija la revisión para `fecha`. Si `revisada` trae momentos, el
 * profesional registra y aplica la revisión, y la aplicación fija la siguiente para el 30/11 (fuera de la ventana).
 */
function seguimiento(
  fecha: string | null,
  o: { revisada?: { registrada: string; aplicada: string | null; resultado?: string }; pro?: string; ase?: string; alcance?: string } = {},
): Seguimiento {
  const pro = o.pro ?? id('pro');
  const ase = o.ase ?? id('ase');
  const alcance = o.alcance ?? 'NUTRICION';
  const e1 = expectativa(fecha, en('2026-09-01T10:00'));
  const revisiones = o.revisada ? [revision(o.revisada.registrada, o.revisada.aplicada, o.revisada.resultado)] : [];
  const r = revisiones[0];
  const expectativas = [e1];
  if (r?.aplicacion && r.resultado !== 'FINALIZAR') {
    expectativas.push(expectativa('2026-11-30', r.aplicacion.registradaEn, { predecesoraId: e1.id, revisionId: r.id, versionDePlanId: null }));
  }
  return {
    proceso: { procesoId: id('proc'), alcance, profesionalId: pro, asesoradoId: ase, expectativas, revisiones, cierreSinRevision: null },
    vinculo: aceptado(pro, ase, alcance),
  };
}

function aceptado(pro: string, ase: string, alcance: string): HistoriaDelAlcanceTvcc30 {
  const desde = en('2026-08-01T09:00');
  return { profesionalId: pro, asesoradoId: ase, alcance, estados: [{ desde, estado: 'ACEPTADO' }], consentimiento: [{ desde, situacion: 'VIGENTE' }] };
}

function entrada(seguimientos: readonly Seguimiento[], extra: Partial<EntradaTvcc30> = {}): EntradaTvcc30 {
  return { corte: CORTE, procesos: seguimientos.map((s) => s.proceso), vinculos: seguimientos.map((s) => s.vinculo), cuentasDemo: [], ...extra };
}

test('TEST-TVCC-001 · ventana exacta: el corte local produce exactamente 30 fechas calendario, incluido el corte', () => {
  const v = ventanaTvcc30(CORTE);
  assert.deepEqual(
    { desde: v.desde, hasta: v.hasta, fechas: v.fechas, inicio: v.inicio, finExclusivo: v.finExclusivo },
    { desde: '2026-09-17', hasta: '2026-10-16', fechas: 30, inicio: '2026-09-17T03:00:00.000Z', finExclusivo: '2026-10-17T03:00:00.000Z' },
  );
  // Contando fecha por fecha, del primero al corte: 30, en un mes de 30 días, en febrero común y en febrero bisiesto.
  for (const [corte, desde] of [[CORTE, '2026-09-17'], ['2026-03-01', '2026-01-31'], ['2028-03-01', '2028-02-01']] as const) {
    const w = ventanaTvcc30(corte);
    assert.equal(w.desde, desde);
    let fechas = 0;
    for (let t = Date.parse(`${w.desde}T12:00:00Z`); t <= Date.parse(`${w.hasta}T12:00:00Z`); t += 86_400_000) fechas++;
    assert.equal(fechas, 30, corte);
  }
  assert.throws(() => ventanaTvcc30('2026-02-30'), RangeError);
  assert.throws(() => ventanaTvcc30('16/10/2026'), RangeError);
});

test('TEST-TVCC-002 · universo: la cuenta demo y el vínculo no elegible quedan excluidos, cada uno con su motivo', () => {
  const elegible = seguimiento('2026-10-01');
  const demo = seguimiento('2026-10-02');
  const pausado = seguimiento('2026-10-03');
  const pausa = { ...pausado.vinculo, estados: [...pausado.vinculo.estados, { desde: en('2026-09-20T08:00'), estado: 'PAUSADO' as const }] };
  const revocado = seguimiento('2026-10-04');
  const revocacion = { ...revocado.vinculo, consentimiento: [...revocado.vinculo.consentimiento, { desde: en('2026-09-25T08:00'), situacion: 'REVOCADO' as const }] };
  // El vínculo terminó el 20/9 y cerró el seguimiento antes de que el ciclo venciera el 5/10.
  const terminado = seguimiento('2026-10-05');
  const cerrado = { ...terminado.proceso, cierreSinRevision: { motivo: 'FINALIZACION_DE_VINCULO', registradoEn: en('2026-09-20T08:00') } };
  const fin = { ...terminado.vinculo, estados: [...terminado.vinculo.estados, { desde: en('2026-09-20T08:00'), estado: 'FINALIZADO' as const }] };
  const r = calcularTvcc30({
    corte: CORTE,
    procesos: [elegible.proceso, demo.proceso, pausado.proceso, revocado.proceso, cerrado],
    vinculos: [elegible.vinculo, demo.vinculo, pausa, revocacion, fin],
    cuentasDemo: [demo.proceso.asesoradoId],
  });
  assert.deepEqual(
    r.universo.map((c) => [c.ancla, c.clasificacion, c.motivo]),
    [
      ['2026-10-01', 'ELEGIBLE', null],
      ['2026-10-02', 'EXCLUIDO', 'CUENTA_DEMO'],
      ['2026-10-03', 'EXCLUIDO', 'VINCULO_PAUSADO_EN_EL_ANCLA'],
      ['2026-10-04', 'EXCLUIDO', 'CONSENTIMIENTO_NO_VIGENTE_EN_EL_ANCLA'],
      ['2026-10-05', 'EXCLUIDO', 'SEGUIMIENTO_CERRADO_ANTES_DEL_ANCLA'],
    ],
  );
  // Cada exclusión cita su criterio de 12 §16 (REG-06-191): nada queda «no contado» sin explicación.
  for (const c of r.universo) assert.equal(c.criterio, CRITERIOS_TVCC30[c.motivo ?? 'ELEGIBLE']);
  assert.deepEqual(r.conteos, { universo: 5, elegibles: 1, excluidos: 4, noResolubles: 0, numerador: 0 });
  // También es demo si la cuenta demo es la del profesional.
  const delProfesional = calcularTvcc30(entrada([elegible], { cuentasDemo: [elegible.proceso.profesionalId] }));
  assert.equal(delProfesional.universo[0]!.motivo, 'CUENTA_DEMO');
});

test('TEST-TVCC-003 · denominador: un ciclo elegible entra una sola vez, aunque se haya reprogramado o revisado dos veces', () => {
  const pro = id('pro');
  const ase = id('ase');
  // El plan fija el 5/10; antes de esa fecha, una versión nueva lo pasa al 10/10. Es el mismo ciclo, reprogramado.
  const e1 = expectativa('2026-10-05', en('2026-09-01T10:00'));
  const e2 = expectativa('2026-10-10', en('2026-10-01T10:00'), { predecesoraId: e1.id });
  // La revisión del 11/10 lo cierra sin fijar otra fecha; la del 12/10 revisa lo mismo y no abre ni cierra otro ciclo.
  const r1 = revision(en('2026-10-11T09:00'), en('2026-10-11T09:05'));
  const r2 = revision(en('2026-10-12T09:00'), en('2026-10-12T09:05'));
  const proceso: ProcesoTvcc30 = { procesoId: id('proc'), alcance: 'ENTRENAMIENTO', profesionalId: pro, asesoradoId: ase, expectativas: [e1, e2], revisiones: [r1, r2], cierreSinRevision: null };
  const r = calcularTvcc30({ corte: CORTE, procesos: [proceso], vinculos: [aceptado(pro, ase, 'ENTRENAMIENTO')], cuentasDemo: [] });
  assert.equal(r.universo.length, 1);
  const [ciclo] = r.universo;
  assert.deepEqual(
    { ancla: ciclo!.ancla, origen: ciclo!.origenDelAncla, expectativas: ciclo!.expectativas, cierre: ciclo!.cierre?.revisionId },
    { ancla: '2026-10-10', origen: 'VENCIO', expectativas: [e1.id, e2.id], cierre: r1.id },
  );
  assert.equal(ciclo!.cicloId, `${proceso.procesoId}#1`);
  assert.deepEqual(r.valor, { estado: 'CALCULADO', n: 1, d: 1, tasa: 1, porcentaje: 100 });
});

test('TEST-TVCC-004 · numerador: N ⊆ D, y solo entra el ciclo con revisión válida y su continuidad o cierre aplicados', () => {
  const aplicada = seguimiento('2026-10-01', { revisada: { registrada: en('2026-10-03T10:00'), aplicada: en('2026-10-03T10:10') } });
  const finalizada = seguimiento('2026-10-02', { revisada: { registrada: en('2026-10-04T10:00'), aplicada: en('2026-10-04T10:10'), resultado: 'FINALIZAR' } });
  // Registrada sin aplicar: no hay continuidad consumada (REG-06-149). Queda a la vista, pero no suma.
  const sinAplicar = seguimiento('2026-10-03', { revisada: { registrada: en('2026-10-05T10:00'), aplicada: null } });
  // Aplicada después del corte: para el corte del 16/10 todavía no estaba cerrado.
  const tarde = seguimiento('2026-10-04', { revisada: { registrada: en('2026-10-17T10:00'), aplicada: en('2026-10-17T10:10') } });
  const ningunaRevision = seguimiento('2026-10-05');
  // Una cuenta demo con su revisión aplicada no puede entrar a N porque no está en D.
  const demo = seguimiento('2026-10-06', { revisada: { registrada: en('2026-10-07T10:00'), aplicada: en('2026-10-07T10:10') } });
  const r = calcularTvcc30(entrada([aplicada, finalizada, sinAplicar, tarde, ningunaRevision, demo], { cuentasDemo: [demo.proceso.asesoradoId] }));
  const porAncla = new Map(r.universo.map((c) => [c.ancla, c]));
  assert.equal(porAncla.get('2026-10-01')!.numerador, 'INCLUIDO');
  assert.equal(porAncla.get('2026-10-02')!.numerador, 'INCLUIDO');
  assert.equal(porAncla.get('2026-10-02')!.cierre!.tipo, 'CIERRE_PROCESO');
  assert.equal(porAncla.get('2026-10-03')!.numerador, 'NO_INCLUIDO');
  assert.deepEqual(porAncla.get('2026-10-03')!.revisionesSinAplicar, [sinAplicar.proceso.revisiones[0]!.id]);
  assert.equal(porAncla.get('2026-10-04')!.numerador, 'NO_INCLUIDO');
  assert.equal(porAncla.get('2026-10-05')!.numerador, 'NO_INCLUIDO');
  assert.equal(porAncla.get('2026-10-06')!.numerador, 'NO_INCLUIDO');
  for (const c of r.universo) if (c.numerador === 'INCLUIDO') assert.equal(c.clasificacion, 'ELEGIBLE');
  assert.deepEqual(r.valor, { estado: 'CALCULADO', n: 2, d: 5, tasa: 0.4, porcentaje: 40 });
});

test('TEST-TVCC-005 · actividad en la interfaz: reprogramar después del vencimiento o revisar dos veces no suma', () => {
  // Venció el 1/10 sin revisión; el 8/10 una versión nueva del plan pasa la revisión al 30/10. Es solo un cambio de fecha
  // fuera del circuito de revisión (06 §12.8.3): el ciclo sigue anclado al 1/10 y sigue sin cerrar.
  const pro = id('pro');
  const ase = id('ase');
  const e1 = expectativa('2026-10-01', en('2026-09-01T10:00'));
  const e2 = expectativa('2026-10-30', en('2026-10-08T10:00'), { predecesoraId: e1.id });
  const replan: ProcesoTvcc30 = { procesoId: id('proc'), alcance: 'NUTRICION', profesionalId: pro, asesoradoId: ase, expectativas: [e1, e2], revisiones: [], cierreSinRevision: null };
  const r = calcularTvcc30({ corte: CORTE, procesos: [replan], vinculos: [aceptado(pro, ase, 'NUTRICION')], cuentasDemo: [] });
  assert.deepEqual(r.universo.map((c) => [c.ancla, c.origenDelAncla, c.numerador]), [['2026-10-01', 'VENCIO', 'NO_INCLUIDO']]);
  assert.deepEqual(r.valor, { estado: 'CALCULADO', n: 0, d: 1, tasa: 0, porcentaje: 0 });

  // Dos revisiones aplicadas sobre la misma expectativa: un solo ciclo, una sola vez en N.
  const doble = seguimiento('2026-10-01', { revisada: { registrada: en('2026-10-02T10:00'), aplicada: en('2026-10-02T10:10') } });
  const segunda = revision(en('2026-10-02T11:00'), en('2026-10-02T11:05'));
  // Sin expectativa nueva entre las dos: la segunda no revisa nada que no estuviera ya revisado.
  const sinSiguiente = { ...doble.proceso, expectativas: [doble.proceso.expectativas[0]!], revisiones: [...doble.proceso.revisiones, segunda] };
  const d = calcularTvcc30({ corte: CORTE, procesos: [sinSiguiente], vinculos: [doble.vinculo], cuentasDemo: [] });
  assert.equal(d.universo.length, 1);
  assert.deepEqual(d.valor, { estado: 'CALCULADO', n: 1, d: 1, tasa: 1, porcentaje: 100 });
  // Abrir la ficha, mirar el tablero o escribir una nota no deja hechos que este cálculo lea: la entrada no los tiene.
  assert.deepEqual(Object.keys(sinSiguiente).sort(), ['alcance', 'asesoradoId', 'cierreSinRevision', 'expectativas', 'procesoId', 'profesionalId', 'revisiones']);
});

test('TEST-TVCC-006 · fórmula: el valor es N/D y el numerador nunca va solo', () => {
  const s = [
    seguimiento('2026-09-20', { revisada: { registrada: en('2026-09-21T10:00'), aplicada: en('2026-09-21T10:05') } }),
    seguimiento('2026-09-25', { revisada: { registrada: en('2026-09-24T10:00'), aplicada: en('2026-09-24T10:05') } }),
    seguimiento('2026-10-10'),
  ];
  const r = calcularTvcc30(entrada(s));
  assert.equal(r.valor.estado, 'CALCULADO');
  if (r.valor.estado !== 'CALCULADO') return;
  assert.deepEqual([r.valor.n, r.valor.d], [2, 3]);
  assert.equal(r.valor.tasa, 2 / 3);
  assert.equal(r.valor.porcentaje, 200 / 3);
  // La revisión del 24/9 llegó antes de que el ciclo del 25/9 venciera: se cerró antes, y cuenta con su fecha prevista.
  assert.equal(r.universo.find((c) => c.ancla === '2026-09-25')!.origenDelAncla, 'REVISADO_ANTES_DE_VENCER');
  assert.deepEqual([r.conteos.numerador, r.conteos.elegibles], [2, 3]);
});

test('TEST-TVCC-007 · D = 0: no se publica 0 %, se publica la ausencia de valor con N = 0 y D = 0', () => {
  const solo = seguimiento('2026-10-01');
  for (const r of [calcularTvcc30(entrada([solo], { cuentasDemo: [solo.proceso.asesoradoId] })), calcularTvcc30(entrada([]))]) {
    assert.deepEqual(r.valor, { estado: 'SIN_VALOR', motivo: 'DENOMINADOR_CERO', n: 0, d: 0 });
    assert.equal('tasa' in r.valor, false);
    assert.equal('porcentaje' in r.valor, false);
  }
});

test('TEST-TVCC-008 · evidencia incompleta: un candidato que no se puede clasificar impide fabricar el valor', () => {
  const bien = seguimiento('2026-10-01', { revisada: { registrada: en('2026-10-02T10:00'), aplicada: en('2026-10-02T10:05') } });
  // Sin historia del vínculo para esa terna: no se infiere que estaba vigente.
  const sinHistoria = seguimiento('2026-10-03');
  const r = calcularTvcc30({ corte: CORTE, procesos: [bien.proceso, sinHistoria.proceso], vinculos: [bien.vinculo], cuentasDemo: [] });
  assert.deepEqual(r.universo.map((c) => [c.clasificacion, c.motivo]), [['ELEGIBLE', null], ['NO_RESOLUBLE', 'SIN_HISTORIA_DEL_VINCULO_EN_EL_ANCLA']]);
  assert.deepEqual(r.valor, { estado: 'SIN_VALOR', motivo: 'CANDIDATOS_NO_RESOLUBLES', n: null, d: null });
  assert.deepEqual(r.conteos, { universo: 2, elegibles: 1, excluidos: 0, noResolubles: 1, numerador: 1 });

  // Una cadena con dos raíces no se puede ordenar: si toca la ventana, tampoco hay valor.
  const pro = id('pro');
  const ase = id('ase');
  const rota: ProcesoTvcc30 = {
    procesoId: id('proc'),
    alcance: 'NUTRICION',
    profesionalId: pro,
    asesoradoId: ase,
    expectativas: [expectativa('2026-10-05', en('2026-09-01T10:00')), expectativa('2026-10-06', en('2026-09-02T10:00'))],
    revisiones: [],
    cierreSinRevision: null,
  };
  const q = calcularTvcc30({ corte: CORTE, procesos: [rota], vinculos: [aceptado(pro, ase, 'NUTRICION')], cuentasDemo: [] });
  assert.deepEqual(q.universo.map((c) => [c.cicloId.endsWith('#?'), c.clasificacion, c.motivo]), [[true, 'NO_RESOLUBLE', 'CADENA_DE_EXPECTATIVAS_INCONSISTENTE']]);
  assert.equal(q.valor.estado, 'SIN_VALOR');
  // Si la cadena rota no toca la ventana, no bloquea el corte.
  assert.deepEqual(calcularTvcc30({ corte: '2027-01-15', procesos: [rota], vinculos: [], cuentasDemo: [] }).universo, []);
});

test('TEST-TVCC-009 · reproducción: mismas fuentes, misma versión y mismo corte dan el mismo N/D, aunque después haya más hechos', () => {
  const s = [
    seguimiento('2026-10-01', { revisada: { registrada: en('2026-10-02T10:00'), aplicada: en('2026-10-02T10:05') } }),
    seguimiento('2026-10-08'),
    seguimiento('2026-10-12', { revisada: { registrada: en('2026-10-13T10:00'), aplicada: null } }),
  ];
  const primero = calcularTvcc30(entrada(s));
  assert.equal(canonicoTvcc30(calcularTvcc30(entrada(s))), canonicoTvcc30(primero));
  // El orden en que llegan los hechos no cambia nada.
  assert.equal(canonicoTvcc30(calcularTvcc30(entrada([...s].reverse()))), canonicoTvcc30(primero));
  // Lo que se registra después del corte (una revisión aplicada el 17/10) no cambia el resultado del corte del 16/10.
  const despues = s.map((x, i) =>
    i === 1
      ? { ...x, proceso: { ...x.proceso, revisiones: [revision(en('2026-10-17T09:00'), en('2026-10-17T09:05'))] } }
      : x,
  );
  assert.equal(canonicoTvcc30(calcularTvcc30(entrada(despues))), canonicoTvcc30(primero));
  // Para el corte del 17/10, sí: es otro corte.
  const del17 = calcularTvcc30(entrada(despues, { corte: '2026-10-17' }));
  assert.equal(del17.universo.find((c) => c.ancla === '2026-10-08')!.numerador, 'INCLUIDO');
});

test('TEST-TVCC-010 · versionado: otra especificación da otro resultado, con su referencia, y no toca el anterior', () => {
  const s = [seguimiento('2026-10-01', { revisada: { registrada: en('2026-10-02T10:00'), aplicada: en('2026-10-02T10:05') } })];
  const v1 = calcularTvcc30(entrada(s));
  const antes = canonicoTvcc30(v1);
  const v2 = calcularTvcc30(entrada(s, { especificacion: { ...SPEC_TVCC30_V1, id: 'SPEC-TVCC30-v2-PRUEBA', mapeo: 'BE-TVCC30-MAPEO-2 · prueba' } }));
  assert.equal(v1.especificacion.id, 'SPEC-TVCC30-v1');
  assert.equal(v1.especificacion.mapeo, 'BE-TVCC30-MAPEO-1 · DEUDA_LEGAJO DL-135');
  assert.equal(v2.especificacion.id, 'SPEC-TVCC30-v2-PRUEBA');
  assert.notEqual(canonicoTvcc30(v2), antes);
  assert.equal(canonicoTvcc30(v1), antes);
});

test('TEST-TVCC-011 · zona horaria: los límites se resuelven en America/Argentina/Buenos_Aires, no en UTC', () => {
  const v = ventanaTvcc30(CORTE);
  assert.equal(v.zona, 'America/Argentina/Buenos_Aires');
  // Aplicada a las 23:30 del 16/10 en Buenos Aires (02:30 del 17/10 en UTC): está antes del corte.
  const justo = seguimiento('2026-10-10', { revisada: { registrada: en('2026-10-16T23:20'), aplicada: en('2026-10-16T23:30') } });
  // Aplicada a las 00:30 del 17/10 en Buenos Aires: ya es después del corte.
  const pasada = seguimiento('2026-10-11', { revisada: { registrada: en('2026-10-17T00:20'), aplicada: en('2026-10-17T00:30') } });
  const r = calcularTvcc30(entrada([justo, pasada]));
  assert.deepEqual(r.universo.map((c) => [c.ancla, c.numerador]), [['2026-10-10', 'INCLUIDO'], ['2026-10-11', 'NO_INCLUIDO']]);
  // Una expectativa sin fecha vence al registrarse, y su fecha es la de Buenos Aires: las 23:59 del 16/9 quedan
  // afuera (en UTC ya sería el 17/9) y las 00:01 del 17/9 quedan adentro.
  const pro = id('pro');
  const ase = id('ase');
  const afuera: ProcesoTvcc30 = { procesoId: id('proc'), alcance: 'NUTRICION', profesionalId: pro, asesoradoId: ase, expectativas: [expectativa(null, en('2026-09-16T23:59'))], revisiones: [], cierreSinRevision: null };
  const adentro: ProcesoTvcc30 = { ...afuera, procesoId: id('proc'), expectativas: [expectativa(null, en('2026-09-17T00:01'))] };
  const z = calcularTvcc30({ corte: CORTE, procesos: [afuera, adentro], vinculos: [aceptado(pro, ase, 'NUTRICION')], cuentasDemo: [] });
  assert.deepEqual(z.universo.map((c) => [c.procesoId, c.ancla]), [[adentro.procesoId, '2026-09-17']]);
});

test('TEST-TVCC-012 · interpretación: no se presenta como retención, adherencia, salud ni score', () => {
  const r = calcularTvcc30(entrada([seguimiento('2026-10-01')]));
  assert.match(r.nombre, /^TVCC-30 · Tasa de ciclos cerrados trazables en ventana de 30 días$/);
  assert.equal(r.interpretacion, INTERPRETACION_TVCC30);
  assert.match(r.interpretacion, /No es retención, adherencia, resultado corporal, resultado de salud, score clínico ni ranking\./);
  // Ninguna clave del resultado nombra esas lecturas.
  const claves: string[] = [];
  const recorrer = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(recorrer);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) (claves.push(k), recorrer(x));
  };
  recorrer(r);
  assert.deepEqual(claves.filter((k) => /reten|adheren|score|ranking|salud|health|clinic/i.test(k)), []);
});

test('DL-135 D-3 · lo que fija la revisión al aplicarse ya es el ciclo siguiente, también la versión de plan que crea un AJUSTAR', () => {
  const pro = id('pro');
  const ase = id('ase');
  // El plan fija el 10/10. El 3/10 el profesional revisa antes de tiempo con AJUSTAR: la aplicación activa la versión 2
  // del plan, que fija el 20/11, y la revisión fija después el 30/11. Las dos expectativas nacen de esa revisión.
  const e1 = expectativa('2026-10-10', en('2026-09-01T10:00'));
  const r1: RevisionTvcc30 = {
    id: id('rev'),
    resultado: 'AJUSTAR',
    registradaEn: en('2026-10-03T09:00'),
    aplicacion: { eventoId: id('evt'), tipo: 'CONTINUIDAD', registradaEn: en('2026-10-03T09:05'), versionDePlanCreadaId: 'version-ajustada' },
  };
  const e2 = expectativa('2026-11-20', en('2026-10-03T09:05'), { predecesoraId: e1.id, versionDePlanId: 'version-ajustada' });
  const e3 = expectativa('2026-11-30', en('2026-10-03T09:05'), { predecesoraId: e2.id, revisionId: r1.id, versionDePlanId: null });
  const proceso: ProcesoTvcc30 = { procesoId: id('proc'), alcance: 'NUTRICION', profesionalId: pro, asesoradoId: ase, expectativas: [e1, e2, e3], revisiones: [r1], cierreSinRevision: null };
  const vinculos = [aceptado(pro, ase, 'NUTRICION')];
  // La revisión cerró el ciclo del 10/10, antes de que venciera; no «revisó» lo que ella misma fijó.
  const oct = calcularTvcc30({ corte: CORTE, procesos: [proceso], vinculos, cuentasDemo: [] });
  assert.deepEqual(
    oct.universo.map((c) => [c.cicloId, c.ancla, c.origenDelAncla, c.expectativas, c.numerador, c.cierre?.revisionId]),
    [[`${proceso.procesoId}#1`, '2026-10-10', 'REVISADO_ANTES_DE_VENCER', [e1.id], 'INCLUIDO', r1.id]],
  );
  // El ciclo siguiente rige con la última fecha que quedó vigente, el 30/11 (la del 20/11 se reemplazó en el mismo acto).
  // Con el corte del 30/11 venció sin revisión: entra en D y no en N.
  const nov = calcularTvcc30({ corte: '2026-11-30', procesos: [proceso], vinculos, cuentasDemo: [] });
  assert.deepEqual(nov.universo.map((c) => [c.cicloId, c.ancla, c.expectativas, c.numerador]), [[`${proceso.procesoId}#2`, '2026-11-30', [e2.id, e3.id], 'NO_INCLUIDO']]);
});

test('DL-135 D-6 · si el vínculo termina después del vencimiento, el ciclo vencido queda en D y no en N', () => {
  const s = seguimiento('2026-10-01');
  // Venció el 1/10 sin revisión, y el 5/10 la persona terminó el vínculo, lo que cerró el seguimiento.
  const proceso: ProcesoTvcc30 = { ...s.proceso, cierreSinRevision: { motivo: 'FINALIZACION_DE_VINCULO', registradoEn: en('2026-10-05T10:00') } };
  const vinculo: HistoriaDelAlcanceTvcc30 = { ...s.vinculo, estados: [...s.vinculo.estados, { desde: en('2026-10-05T10:00'), estado: 'FINALIZADO' }] };
  const r = calcularTvcc30({ corte: CORTE, procesos: [proceso], vinculos: [vinculo], cuentasDemo: [] });
  assert.deepEqual(r.universo.map((c) => [c.ancla, c.origenDelAncla, c.clasificacion, c.numerador]), [['2026-10-01', 'VENCIO', 'ELEGIBLE', 'NO_INCLUIDO']]);
  assert.deepEqual(r.valor, { estado: 'CALCULADO', n: 0, d: 1, tasa: 0, porcentaje: 0 });
});
