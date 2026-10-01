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

test('INV-06-177 · un hueco de la serie no tiene dónde poner un valor: el contrato lo rechaza', async () => {
  const { HuecoDeSerieSchema } = await import('./contratos-antropometria');
  // Un hueco honesto entra: un rango de días, con su cantidad, y nada más.
  assert.equal(HuecoDeSerieSchema.safeParse({ from: '2026-09-08', to: '2026-09-10', state: 'NO_DATA', days: 3 }).success, true);
  // Un hueco con un cero disfrazado, no: el objeto es estricto y no hay campo donde ponerlo.
  const conCero = HuecoDeSerieSchema.safeParse({ from: '2026-09-08', to: '2026-09-08', state: 'NO_DATA', days: 1, value: 0, unit: 'kg' });
  assert.equal(conCero.success, false, 'un hueco con valor tiene que ser rechazado por el contrato, no solo por el servicio');
  // Y tampoco puede decir otra cosa que «sin dato»: el estado es un literal.
  assert.equal(HuecoDeSerieSchema.safeParse({ from: '2026-09-08', to: '2026-09-08', state: 'ESTIMATED', days: 1 }).success, false);
});

test('INV-06-176 · un cero medido sí viaja, como punto de la serie', async () => {
  const { PuntoDeSerieSchema } = await import('./contratos-antropometria');
  const r = PuntoDeSerieSchema.safeParse({
    occurredAt: '2026-09-08T12:00:00.000Z',
    recordedAt: '2026-09-08T12:00:00.000Z',
    value: 0,
    unit: 'kg',
    sourceEvaluationId: '11111111-1111-4111-8111-111111111111',
    sourceId: '22222222-2222-4222-8222-222222222222',
    dataClass: 'MEASURED',
    comparabilityGroup: 'cmp-1',
    correctionState: 'EFFECTIVE',
    incomparableWithPrevious: [],
  });
  assert.equal(r.success, true, 'un cero medido es un dato, no un hueco');
});

test('DL-062 · INV-06-167: la referencia de preparación solo corresponde a la importación controlada, y es opaca', async () => {
  const { OrigenDeLaTomaSchema } = await import('./contratos-antropometria');
  assert.equal(OrigenDeLaTomaSchema.safeParse({ type: 'DIRECT_CAPTURE' }).success, true);
  assert.equal(OrigenDeLaTomaSchema.safeParse({ type: 'DIRECT_CAPTURE', preparationReference: 'prep_1' }).success, false);
  assert.equal(OrigenDeLaTomaSchema.safeParse({ type: 'CONTROLLED_IMPORT', preparationReference: 'prep_1' }).success, true);
  // El legajo prohíbe exigirle formato o proveedor: cualquier cadena vale como referencia.
  assert.equal(OrigenDeLaTomaSchema.safeParse({ type: 'CONTROLLED_IMPORT', preparationReference: 'lo-que-sea' }).success, true);
});

test('TEST-PRJ-009 · ningún schema de antropometría ni de cálculo tiene puntaje, porcentaje ni calificación', async () => {
  const antropometria = await import('./contratos-antropometria');
  const calculo = await import('./contratos-calculo');
  const { z } = await import('zod');
  const PROHIBIDO = /adherence|compliance|score|grade|percent|cumplid|adherencia|interpolat|imputed|carriedforward|average|promedio|winner|ganador/i;
  /**
   * Las tres banderas de honestidad existen a propósito y están declaradas en falso literal: eso es lo que las hace
   * una promesa y no un campo. Se admiten **solo** con esa forma; cualquier otra aparición es un hallazgo. La versión
   * anterior de esta prueba apagaba el control entero para el schema que las contenía, que es justo el de la
   * evolución: el único donde un término prohibido tendría dónde esconderse.
   */
  const declaradaEnFalso = (esquema: unknown): boolean => !!esquema && typeof esquema === 'object' && (esquema as { const?: unknown }).const === false;
  const HONESTIDAD = new Set(['interpolated', 'imputed', 'carriedForward']);

  const hallazgos: string[] = [];
  const recorrer = (nodo: unknown, ruta: string): void => {
    if (Array.isArray(nodo)) return nodo.forEach((n, i) => recorrer(n, `${ruta}[${i}]`));
    if (!nodo || typeof nodo !== 'object') return;
    for (const [clave, valor] of Object.entries(nodo as Record<string, unknown>)) {
      if (clave === 'properties' && valor && typeof valor === 'object') {
        for (const [nombre, sub] of Object.entries(valor as Record<string, unknown>)) {
          if (!PROHIBIDO.test(nombre)) continue;
          if (HONESTIDAD.has(nombre) && declaradaEnFalso(sub)) continue;
          hallazgos.push(`${ruta}.${nombre}`);
        }
      }
      if (clave === 'enum' && Array.isArray(valor)) for (const v of valor) if (typeof v === 'string' && PROHIBIDO.test(v)) hallazgos.push(`${ruta}=${v}`);
      recorrer(valor, `${ruta}.${clave}`);
    }
  };

  let revisados = 0;
  for (const modulo of [antropometria, calculo]) {
    for (const [nombre, valor] of Object.entries(modulo)) {
      if (!valor || typeof valor !== 'object' || !('safeParse' in valor)) continue;
      revisados++;
      recorrer(z.toJSONSchema(valor as never, { io: 'output', unrepresentable: 'any' }), nombre);
      recorrer(z.toJSONSchema(valor as never, { io: 'input', unrepresentable: 'any' }), nombre);
    }
  }
  assert.ok(revisados > 20, `se revisaron ${revisados} schemas`);
  assert.deepEqual(hallazgos, []);
});

test('TEST-PRJ-009 · el control de cero juicio detecta un campo prohibido, también dentro del schema de la evolución', async () => {
  // Prueba del control: una bandera de honestidad que no esté declarada en falso tiene que salir como hallazgo, y la
  // regla vale también en el schema que legítimamente las contiene.
  const { z } = await import('zod');
  const PROHIBIDO = /interpolat|imputed|carriedforward/i;
  const HONESTIDAD = new Set(['interpolated', 'imputed', 'carriedForward']);
  const declaradaEnFalso = (e: unknown): boolean => !!e && typeof e === 'object' && (e as { const?: unknown }).const === false;
  const mentiroso = z.strictObject({ honesty: z.strictObject({ interpolated: z.boolean(), imputed: z.literal(false), carriedForward: z.literal(false) }) });
  const json = z.toJSONSchema(mentiroso, { io: 'output', unrepresentable: 'any' }) as unknown as { properties: { honesty: { properties: Record<string, unknown> } } };
  const hallazgos = Object.entries(json.properties.honesty.properties)
    .filter(([n, sub]) => PROHIBIDO.test(n) && !(HONESTIDAD.has(n) && declaradaEnFalso(sub)))
    .map(([n]) => n);
  assert.deepEqual(hallazgos, ['interpolated']);
});

// ─── Contrato publicado y copy ──────────────────────────────────────────────────────────────────

test('WP-05 §4 · el OpenAPI publica las doce operaciones ANT en las rutas que declara el 09', async () => {
  const { OPERACIONES } = await import('./openapi');
  const ant = OPERACIONES.filter((o) => o.id.startsWith('API-ANT-') && o.id !== 'API-ANT-06-PROPIA');
  assert.equal(ant.length, 12, 'el inventario declara doce operaciones ANT en P0');

  // Las dos colecciones que el legajo mantiene separadas: la evaluación y el borrador (09v16 §23).
  const ruta = (id: string) => ant.find((o) => o.id === id);
  assert.equal(ruta('API-ANT-02')?.ruta, '/advisees/{adviseeId}/anthropometry/evaluations');
  assert.equal(ruta('API-ANT-07')?.ruta, '/advisees/{adviseeId}/anthropometry/evaluation-drafts');
  assert.equal(ruta('API-ANT-04')?.ruta, '/anthropometry/evaluations/{evaluationId}');
  assert.equal(ruta('API-ANT-09')?.ruta, '/anthropometry/evaluation-drafts/{evaluationId}');
  // «Reemplaza la versión de trabajo» (09v16 §23.5): el verbo es PUT, no PATCH.
  assert.equal(ruta('API-ANT-10')?.metodo, 'put');
  // La corrección va sobre la evaluación (09v11 §9) y la anulación, sobre la medición, en plural (09v16 §24.1).
  assert.equal(ruta('API-ANT-05')?.ruta, '/anthropometry/evaluations/{evaluationId}/corrections');
  assert.equal(ruta('API-ANT-12')?.ruta, '/anthropometry/measurements/{measurementId}/annulments');

  // Las escrituras llevan Idempotency-Key, salvo el guardado del borrador, que usa expectedVersion (09v9:1051-1068).
  const conClave = ant.filter((o) => o.idempotencia).map((o) => o.id).sort();
  assert.deepEqual(conClave, ['API-ANT-02', 'API-ANT-05', 'API-ANT-07', 'API-ANT-11', 'API-ANT-12']);

  // Consultar algo ajeno no revela nada: su único error de recurso es el 404 (09:213-233).
  for (const id of ['API-ANT-04', 'API-ANT-09']) {
    assert.deepEqual(ruta(id)?.errores[404], ['RESOURCE_NOT_FOUND'], id);
    assert.equal(ruta(id)?.errores[403], undefined, id);
  }

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

/**
 * DL-072, decidida: el catálogo declara el estado de cada versión. El contrato lo vuelve obligatorio y cerrado, así
 * que una respuesta sin estado —o con uno inventado— no pasa. El estado se deriva de la cadena en el servicio; lo
 * que el contrato garantiza es que **siempre viaja y solo puede ser uno de los dos**.
 */
test('DL-072 · REG-06-203: la especificación declara su estado, y solo admite vigente o histórica', async () => {
  const { EspecificacionSchema } = await import('./contratos-antropometria');
  const base = {
    specificationId: 'e1',
    versionId: 'v1',
    key: 'MET-DEMO',
    kind: 'METHOD' as const,
    name: 'Método de demostración',
    content: {},
    provenanceNote: 'Valores sintéticos de demostración.',
    effectiveSince: '2026-09-20T00:00:00.000Z',
  };
  assert.equal(EspecificacionSchema.safeParse({ ...base, status: 'CURRENT' }).success, true);
  assert.equal(EspecificacionSchema.safeParse({ ...base, status: 'HISTORICAL' }).success, true);
  // Sin estado no valida: que viaje es parte del contrato, no algo opcional que la pantalla pueda suponer.
  assert.equal(EspecificacionSchema.safeParse(base).success, false);
  // Un tercer valor tampoco: la cadena solo produce estos dos, y un «BORRADOR» o un «APROBADO» serían otra cosa.
  assert.equal(EspecificacionSchema.safeParse({ ...base, status: 'VIGENTE' }).success, false);
});
