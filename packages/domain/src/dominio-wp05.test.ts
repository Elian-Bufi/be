/**
 * Pruebas del dominio de WP-05 (antropometría). Cada una cita el ID del 11A o el invariante del 06 que verifica.
 * Los siete oráculos que el 11A dejó como título de una línea se escriben acá por primera vez (DEUDA_LEGAJO DL-065).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLASE_POR_ORIGEN,
  admiteCorreccion,
  aplicarPrecision,
  checkpointsSinDato,
  consecuenciasDeRecalculo,
  construirSerie,
  convertir,
  dependientesDe,
  evaluarAnulacion,
  evaluarComparabilidad,
  evaluarTransicionDeEvaluacion,
  type EjecucionDeCalculo,
  type FichaDeComparabilidad,
  type ObservacionDeSerie,
  type ReglaDeConversion,
} from './antropometria';

// ─── Evaluación · ANT-DRAFT ─────────────────────────────────────────────────────────────────────

test('REG-06-214 · la evaluación nace EN_PREPARACION y solo un acto explícito la registra', () => {
  assert.equal(evaluarTransicionDeEvaluacion(null, { transicion: 'CrearBorrador' }).permitida, true);
  assert.equal(evaluarTransicionDeEvaluacion('EN_PREPARACION', { transicion: 'GuardarBorrador' }).permitida, true);
  const registrar = evaluarTransicionDeEvaluacion('EN_PREPARACION', { transicion: 'RegistrarEvaluacion', contenidoRegistrable: true });
  assert.equal(registrar.permitida, true);
  assert.ok(registrar.permitida && registrar.transicion.evento === 'EvaluacionAntropometricaRegistrada');
});

test('TEST-ANT-003 · registrar exige contenido registrable: no hay registro vacío', () => {
  const r = evaluarTransicionDeEvaluacion('EN_PREPARACION', { transicion: 'RegistrarEvaluacion', contenidoRegistrable: false });
  assert.deepEqual(r, { permitida: false, motivo: 'CONTENIDO_NO_REGISTRABLE' });
});

test('REG-06-214 inciso 5 · una evaluación REGISTRADA no vuelve a preparación, ni se guarda, ni se registra dos veces', () => {
  for (const transicion of ['CrearBorrador', 'GuardarBorrador', 'RegistrarEvaluacion'] as const) {
    const r = evaluarTransicionDeEvaluacion('REGISTRADA', { transicion, contenidoRegistrable: true });
    assert.deepEqual(r, { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' }, `REGISTRADA no admite ${transicion}`);
  }
});

// ─── Medición · ANT-VOID ────────────────────────────────────────────────────────────────────────

test('REG-06-218 · anular una medición vigente procede y exige motivo', () => {
  assert.deepEqual(evaluarAnulacion('VIGENTE', 'Cinta mal calibrada.'), { procede: true });
  assert.deepEqual(evaluarAnulacion('VIGENTE', '   '), { procede: false, motivo: 'SIN_MOTIVO' });
});

test('TEST-ANT-006 · adversarial 6: la segunda anulación no produce un segundo efecto ni un error nuevo', () => {
  // La primera procede; la segunda no vuelve a anular y no es un rechazo: es «ya está anulada» (DL-059, opción A).
  assert.deepEqual(evaluarAnulacion('VIGENTE', 'Motivo sintético.'), { procede: true });
  const segunda = evaluarAnulacion('ANULADA', 'Motivo sintético.');
  assert.deepEqual(segunda, { procede: false, motivo: 'YA_ANULADA' });
  assert.notEqual(segunda.procede, true, 'no hay segundo efecto');
});

test('TEST-ANT-007 · no existe reversión implícita: ANULADA no admite corrección que la vuelva efectiva', () => {
  assert.equal(admiteCorreccion('VIGENTE'), true);
  assert.equal(admiteCorreccion('ANULADA'), false);
});

// ─── Clase del dato ─────────────────────────────────────────────────────────────────────────────

test('TEST-ANT-001 · medido, reportado y calculado son clases distintas, no una convención de nombre', () => {
  assert.equal(CLASE_POR_ORIGEN.CAPTURA_DIRECTA, 'MEDIDO');
  assert.equal(CLASE_POR_ORIGEN.AUTORREPORTE, 'REPORTADO');
  assert.equal(CLASE_POR_ORIGEN.IMPORTACION_CONTROLADA, 'MEDIDO');
});

// ─── Unidades y conversión ──────────────────────────────────────────────────────────────────────

const REGLAS: readonly ReglaDeConversion[] = [{ id: 'kg→g', version: '1', desde: 'kg', hacia: 'g', factor: 1000 }];

test('REG-06-09 y REG-06-155 · convertir conserva la unidad de origen y la regla que se aplicó', () => {
  const r = convertir({ valor: 72.5, unidad: 'kg' }, 'g', REGLAS);
  assert.ok(r.ok);
  assert.deepEqual(r.valor.origen, { valor: 72.5, unidad: 'kg' });
  assert.deepEqual(r.valor.convertida, { valor: 72500, unidad: 'g' });
  assert.deepEqual(r.valor.regla, { id: 'kg→g', version: '1' });
});

test('REG-06-155 · sin regla declarada no hay conversión: no se inventa un factor', () => {
  assert.deepEqual(convertir({ valor: 10, unidad: 'mm' }, 'kg', REGLAS), { ok: false, motivo: 'SIN_REGLA' });
});

// ─── Cálculo derivado ───────────────────────────────────────────────────────────────────────────

test('REG-06-158 · la precisión y el redondeo son declarados, no implícitos', () => {
  assert.equal(aplicarPrecision(22.456, { decimales: 2, modo: 'MEDIO_ARRIBA' }), 22.46);
  assert.equal(aplicarPrecision(22.456, { decimales: 1, modo: 'ABAJO' }), 22.4);
  assert.equal(aplicarPrecision(22.451, { decimales: 1, modo: 'ARRIBA' }), 22.5);
  // Un valor negativo no se redondea «hacia el infinito» por accidente.
  assert.equal(aplicarPrecision(-22.455, { decimales: 2, modo: 'MEDIO_ARRIBA' }), -22.46);
});

const EJECUCION: EjecucionDeCalculo = {
  ejecucionId: 'run-1',
  metodoId: 'MET-DEMO',
  metodoVersion: '1',
  entradas: [
    { medicionId: 'm-peso', metrica: 'peso', magnitud: { valor: 72.5, unidad: 'kg' } },
    { medicionId: 'm-talla', metrica: 'talla', magnitud: { valor: 1.75, unidad: 'm' } },
  ],
  precision: { decimales: 2, modo: 'MEDIO_ARRIBA' },
  reemplazaA: null,
};

test('REG-06-159 e INV-06-170 · la dependencia es explícita: se resuelve por identificador, nunca por nombre', () => {
  assert.deepEqual(dependientesDe(['m-peso'], [EJECUCION]).map((e) => e.ejecucionId), ['run-1']);
  // Una medición de la misma métrica pero otra identidad no arrastra la ejecución.
  assert.deepEqual(dependientesDe(['otra-medicion-de-peso'], [EJECUCION]), []);
});

test('TEST-ANT-008 · un input anulado obliga a reevaluar dependencias, y sin reemplazo no se inventa sucesor', () => {
  const [sinReemplazo] = consecuenciasDeRecalculo([EJECUCION], ['m-peso']);
  assert.equal(sinReemplazo?.tipo, 'SIN_SUCESOR');
  assert.deepEqual(sinReemplazo?.tipo === 'SIN_SUCESOR' ? sinReemplazo.faltantes : [], ['peso']);

  const [conReemplazo] = consecuenciasDeRecalculo([EJECUCION], ['m-peso'], {
    'm-peso': { medicionId: 'm-peso-2', metrica: 'peso', magnitud: { valor: 71, unidad: 'kg' } },
  });
  assert.equal(conReemplazo?.tipo, 'RECALCULAR');
  assert.deepEqual(
    conReemplazo?.tipo === 'RECALCULAR' ? conReemplazo.entradasVigentes.map((e) => e.medicionId) : [],
    ['m-peso-2', 'm-talla'],
    'la corrida nueva usa el reemplazo y conserva las entradas que siguen vigentes',
  );
});

// ─── Comparabilidad ─────────────────────────────────────────────────────────────────────────────

const FICHA: FichaDeComparabilidad = { protocoloId: 'PROTO-LAB', protocoloVersion: '1', metodoId: null, metodoVersion: null, unidad: 'kg' };

test('REG-06-162/163/164 · solo se compara lo compatible, y la diferencia se nombra en vez de convertirse sola', () => {
  assert.deepEqual(evaluarComparabilidad(FICHA, FICHA), []);
  assert.deepEqual(evaluarComparabilidad(FICHA, { ...FICHA, protocoloVersion: '2' }), ['PROTOCOLO']);
  assert.deepEqual(evaluarComparabilidad(FICHA, { ...FICHA, unidad: 'lb' }), ['UNIDAD']);
  assert.deepEqual(evaluarComparabilidad(FICHA, { ...FICHA, protocoloId: 'OTRO', metodoId: 'MET-DEMO', unidad: 'lb' }), ['PROTOCOLO', 'METODO', 'UNIDAD']);
});

// ─── Serie longitudinal ─────────────────────────────────────────────────────────────────────────

const observacion = (fechaLocal: string, valor: number, extra: Partial<ObservacionDeSerie> = {}): ObservacionDeSerie => ({
  fechaLocal,
  metrica: 'peso',
  magnitud: { valor, unidad: 'kg' },
  clase: 'MEDIDO',
  condicion: 'VIGENTE',
  ficha: FICHA,
  origenId: `m-${fechaLocal}`,
  ...extra,
});

test('TEST-ANT-009 · adversarial 7: SIN_DATO no se transforma en cero y no se interpola', () => {
  const serie = construirSerie('peso', ['2026-09-01', '2026-09-08', '2026-09-15'], [observacion('2026-09-01', 72.5), observacion('2026-09-15', 71)]);
  assert.deepEqual(
    serie.puntos.map((p) => p.disponibilidad),
    ['REGISTRADO', 'SIN_DATO', 'REGISTRADO'],
  );
  const hueco = serie.puntos[1];
  assert.equal(hueco?.disponibilidad, 'SIN_DATO');
  assert.equal('magnitud' in (hueco as object), false, 'el hueco no lleva valor: ni cero, ni interpolado, ni arrastrado');
  assert.deepEqual(checkpointsSinDato(serie), ['2026-09-08']);
});

test('INV-06-176 · un cero medido es un punto REGISTRADO, no un hueco', () => {
  const serie = construirSerie('peso', ['2026-09-01'], [observacion('2026-09-01', 0)]);
  const p = serie.puntos[0];
  assert.equal(p?.disponibilidad, 'REGISTRADO');
  assert.deepEqual(p?.disponibilidad === 'REGISTRADO' ? p.magnitud : null, { valor: 0, unidad: 'kg' });
});

test('REG-06-221 · una medición anulada no aporta un punto registrado a la serie', () => {
  const serie = construirSerie('peso', ['2026-09-01'], [observacion('2026-09-01', 72.5, { condicion: 'ANULADA' })]);
  assert.equal(serie.puntos[0]?.disponibilidad, 'SIN_DATO');
});

test('TEST-ANT-010 · lo no comparable se conserva y se marca: no forma línea continua', () => {
  const serie = construirSerie(
    'peso',
    ['2026-09-01', '2026-09-08'],
    [observacion('2026-09-01', 72.5), observacion('2026-09-08', 160, { ficha: { ...FICHA, unidad: 'lb' } })],
  );
  const segundo = serie.puntos[1];
  assert.equal(segundo?.disponibilidad, 'REGISTRADO', 'el dato no comparable se conserva, no se elimina');
  assert.deepEqual(segundo?.disponibilidad === 'REGISTRADO' ? segundo.incomparableConElAnterior : [], ['UNIDAD']);
});

test('INV-06-178 · cada punto conserva su clase y su origen', () => {
  const serie = construirSerie('peso', ['2026-09-01'], [observacion('2026-09-01', 72.5, { clase: 'REPORTADO' })]);
  const p = serie.puntos[0];
  assert.equal(p?.disponibilidad === 'REGISTRADO' && p.clase, 'REPORTADO');
  assert.equal(p?.disponibilidad === 'REGISTRADO' && p.origenId, 'm-2026-09-01');
});

test('REG-06-165 · la serie devuelve un punto por checkpoint pedido, ni más ni menos', () => {
  const fechas = ['2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22'];
  const serie = construirSerie('peso', fechas, [observacion('2026-09-08', 72), observacion('2026-09-30', 70)]);
  assert.deepEqual(
    serie.puntos.map((p) => p.fechaLocal),
    fechas,
    'una observación fuera del período no agrega un punto',
  );
  assert.equal(serie.puntos.filter((p) => p.disponibilidad === 'REGISTRADO').length, 1);
});

test('REG-06-167 · la serie filtra por métrica: otra métrica no contamina el punto', () => {
  const serie = construirSerie('peso', ['2026-09-01'], [observacion('2026-09-01', 1.75, { metrica: 'talla' })]);
  assert.equal(serie.puntos[0]?.disponibilidad, 'SIN_DATO');
});

// ─── El contrato impide mentir ──────────────────────────────────────────────────────────────────

test('INV-06-177 · un punto SIN_DATO no tiene dónde poner un valor: el contrato lo rechaza', async () => {
  const { PuntoDeSerieSchema } = await import('./contratos-antropometria');
  // Un hueco honesto entra.
  assert.equal(PuntoDeSerieSchema.safeParse({ date: '2026-09-08', availability: 'NO_DATA' }).success, true);
  // Un hueco con un cero disfrazado, no: no hay campo donde ponerlo.
  const conCero = PuntoDeSerieSchema.safeParse({ date: '2026-09-08', availability: 'NO_DATA', magnitude: { value: 0, unit: 'kg' } });
  assert.equal(conCero.success, false, 'NO_DATA con valor tiene que ser rechazado por el contrato, no solo por el servicio');
});

test('INV-06-176 · un cero medido sí viaja, como punto disponible', async () => {
  const { PuntoDeSerieSchema } = await import('./contratos-antropometria');
  const r = PuntoDeSerieSchema.safeParse({
    date: '2026-09-08',
    availability: 'AVAILABLE',
    magnitude: { value: 0, unit: 'kg' },
    dataClass: 'MEASURED',
    sourceId: '11111111-1111-4111-8111-111111111111',
    comparability: { protocolId: '11111111-1111-4111-8111-111111111111', protocolVersionId: '22222222-2222-4222-8222-222222222222', protocolName: 'Demo', methodId: null, methodVersionId: null, unit: 'kg' },
    incomparableWithPrevious: [],
  });
  assert.equal(r.success, true);
});

test('DL-062 · una referencia de preparación sin importación controlada se rechaza en el contrato', async () => {
  const { MedicionEntradaSchema } = await import('./contratos-antropometria');
  const base = { metric: 'peso', magnitude: { value: 72.5, unit: 'kg' }, protocolVersionId: '11111111-1111-4111-8111-111111111111', occurredAt: new Date().toISOString() };
  assert.equal(MedicionEntradaSchema.safeParse({ ...base, origin: 'DIRECT_CAPTURE' }).success, true);
  assert.equal(MedicionEntradaSchema.safeParse({ ...base, origin: 'DIRECT_CAPTURE', preparationReference: 'prep_1' }).success, false);
  assert.equal(MedicionEntradaSchema.safeParse({ ...base, origin: 'CONTROLLED_IMPORT', preparationReference: 'prep_1' }).success, true);
});

test('TEST-PRJ-009 · ningún schema de antropometría tiene puntaje, porcentaje ni calificación', async () => {
  const contratos = await import('./contratos-antropometria');
  const { z } = await import('zod');
  const PROHIBIDO = /adherence|compliance|score|grade|percent|cumplid|adherencia|interpolat|imputed/i;
  const hallazgos: string[] = [];
  for (const [nombre, valor] of Object.entries(contratos)) {
    if (!valor || typeof valor !== 'object' || !('safeParse' in valor)) continue;
    const json = JSON.stringify(z.toJSONSchema(valor as never, { io: 'output', unrepresentable: 'any' }));
    for (const clave of json.matchAll(/"([A-Za-z_][A-Za-z0-9_]*)"\s*:/g)) {
      // `interpolated`, `imputed` y `carriedForward` existen a propósito en `honesty`, declarados en falso.
      if (PROHIBIDO.test(clave[1] as string) && !json.includes('"honesty"')) hallazgos.push(`${nombre}.${clave[1]}`);
    }
  }
  assert.deepEqual(hallazgos, []);
});

// ─── Contrato publicado y copy ──────────────────────────────────────────────────────────────────

test('WP-05 §4 · el OpenAPI publica las once operaciones ANT, con su idempotencia y su 404 no revelable', async () => {
  const { OPERACIONES } = await import('./openapi');
  const ant = OPERACIONES.filter((o) => o.id.startsWith('API-ANT-'));
  assert.equal(ant.length, 11);

  // Las escrituras llevan Idempotency-Key, salvo el PATCH del borrador, que usa expectedVersion (09v9:1051-1068).
  const conClave = ant.filter((o) => o.idempotencia).map((o) => o.id).sort();
  assert.deepEqual(conClave, ['API-ANT-05', 'API-ANT-07', 'API-ANT-11', 'API-ANT-12']);
  assert.equal(ant.find((o) => o.id === 'API-ANT-10')?.metodo, 'patch');

  // Consultar una evaluación ajena no revela nada: su único error de recurso es el 404 (09:213-233).
  const consulta = ant.find((o) => o.id === 'API-ANT-09');
  assert.deepEqual(consulta?.errores[404], ['RESOURCE_NOT_FOUND']);
  assert.equal(consulta?.errores[403], undefined);

  // La anulación declara los dos éxitos: 201 la primera, 200 cuando ya estaba anulada (adversarial 6; DL-059).
  const anular = ant.find((o) => o.id === 'API-ANT-12');
  assert.deepEqual(anular?.exitos.map((e) => e.status).sort(), [200, 201]);
});

test('T13 · el copy de antropometría no dice diagnóstico, ni completa huecos, ni califica el cuerpo', async () => {
  const { COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, ETIQUETA_DE_CONDICION, ETIQUETA_DE_ORIGEN, terminosProhibidosDeAntropometriaEn } = await import('./copy-antropometria');
  const textos = [
    ...Object.values(COPY_ANTROPOMETRIA).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v))),
    ...Object.values(ETIQUETA_DE_CLASE_DE_DATO),
    ...Object.values(ETIQUETA_DE_CONDICION),
    ...Object.values(ETIQUETA_DE_ORIGEN),
  ];
  const hallazgos = textos.flatMap((t) => terminosProhibidosDeAntropometriaEn(t).map((p) => `${p} en «${t}»`));
  assert.deepEqual(hallazgos, []);

  // El detector encuentra lo que tiene que encontrar.
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Diagnóstico: sobrepeso'), ['diagnóstico', 'sobrepeso']);
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('El hueco se completó con el último valor'), ['se completó']);
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Eliminar medición'), ['eliminar medición']);
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Medición registrada con su protocolo'), []);
});

test('08 §56.12 · el copy de anular explicita que preserva la historia y no habla de borrar', async () => {
  const { COPY_ANTROPOMETRIA } = await import('./copy-antropometria');
  assert.match(COPY_ANTROPOMETRIA.explicacionDeAnulacion, /no borra nada/i);
  assert.match(COPY_ANTROPOMETRIA.explicacionDeAnulacion, /se conservan/i);
  assert.match(COPY_ANTROPOMETRIA.sinReversion, /no se reactiva/i);
  // INV-06-176/177 dicho en la pantalla, no solo en el contrato.
  assert.match(COPY_ANTROPOMETRIA.explicacionDeSinDato, /no se completan con cero/i);
});

test('RF-048 · decir que algo NO es un diagnóstico no es lo mismo que presentarlo como tal', async () => {
  const { terminosProhibidosDeAntropometriaEn } = await import('./copy-antropometria');
  // La negación explícita es lo que el legajo pide que se diga (04:575).
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Un resultado calculado no es un diagnóstico.'), []);
  // La afirmación sigue prohibida.
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Diagnóstico del paciente'), ['diagnóstico']);
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('El resultado es un diagnóstico'), ['diagnóstico']);
});
