/**
 * B-08 en función pura: las garantías del circuito de entrenamiento, sin base, sin reloj y sin framework.
 *
 * Cada prueba cita la regla que verifica. Los oráculos completos, con los trece campos que exige 11A §6, están en
 * `docs/paquetes/WP-06-ORACULOS.md` (DL-075): acá está la parte que se puede probar sin infraestructura.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  claveDeOcurrencia,
  CondicionDeSesion,
  CriterioDeIntensidad,
  EstadoDeEjecucion,
  evaluarCriterioDeIntensidad,
  evaluarSerieEjecutada,
  evaluarTransicionDeEjecucion,
  evaluarTransicionDePlanDeEntrenamiento,
  GranularidadDeRegistro,
  huboSustitucion,
  resultadoDeProgresion,
  SIN_REGISTRO,
  TRANSICIONES_DE_EJECUCION,
  TRANSICIONES_DE_VERSION_DE_PLAN_DE_ENTRENAMIENTO,
  vistaDeSesion,
} from './entrenamiento';

// ─── TEST-TRN-002 · el borrador de ejecución no es evidencia ────────────────────────────────────

test('TEST-TRN-002 · la ejecución registrada es terminal: no existe transición que la devuelva a borrador (06:5221)', () => {
  // La lista blanca es literal: tres transiciones, ninguna sale de REGISTRADA.
  assert.equal(TRANSICIONES_DE_EJECUCION.length, 3);
  assert.equal(
    TRANSICIONES_DE_EJECUCION.some((t) => t.origen === 'REGISTRADA'),
    false,
  );

  // Y la evaluación lo confirma para cada intento posible de salir.
  for (const transicion of ['CrearBorradorEjecucion', 'GuardarBorradorEjecucion', 'ConfirmarEjecucion'] as const) {
    const r = evaluarTransicionDeEjecucion(
      'REGISTRADA',
      transicion === 'CrearBorradorEjecucion'
        ? { transicion, sesionYVersionIdentificables: true }
        : transicion === 'ConfirmarEjecucion'
          ? { transicion, contenidoMinimoCoherente: true }
          : { transicion },
    );
    assert.deepEqual(r, { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' }, `${transicion} desde REGISTRADA`);
  }
});

test('TEST-TRN-002 · confirmar exige contenido mínimo coherente; el borrador se guarda sin exigirlo (06:5217-5219)', () => {
  const borrador = evaluarTransicionDeEjecucion(null, { transicion: 'CrearBorradorEjecucion', sesionYVersionIdentificables: true });
  assert.equal(borrador.permitida, true);

  // Un borrador admite captura incompleta: es justamente para lo que existe.
  assert.equal(evaluarTransicionDeEjecucion('BORRADOR', { transicion: 'GuardarBorradorEjecucion' }).permitida, true);

  // Confirmar, no.
  assert.deepEqual(evaluarTransicionDeEjecucion('BORRADOR', { transicion: 'ConfirmarEjecucion', contenidoMinimoCoherente: false }), {
    permitida: false,
    motivo: 'CONDICION_NO_CUMPLIDA',
  });
  assert.equal(evaluarTransicionDeEjecucion('BORRADOR', { transicion: 'ConfirmarEjecucion', contenidoMinimoCoherente: true }).permitida, true);
});

test('INV-06-121 · el borrador de ejecución no nace sin sesión y versión identificables', () => {
  assert.deepEqual(evaluarTransicionDeEjecucion(null, { transicion: 'CrearBorradorEjecucion', sesionYVersionIdentificables: false }), {
    permitida: false,
    motivo: 'CONDICION_NO_CUMPLIDA',
  });
});

// ─── La versión de plan: sin VALIDADO y sin salida de ACTIVADA ──────────────────────────────────

test('06:5149-5162 · la versión de plan tiene exactamente dos estados, y VALIDADO no es uno', () => {
  const estados = new Set<string>();
  for (const t of TRANSICIONES_DE_VERSION_DE_PLAN_DE_ENTRENAMIENTO) {
    if (t.origen) estados.add(t.origen);
    estados.add(t.destino);
  }
  // Validar es una condición de activar, no un estado por el que la versión pase.
  assert.deepEqual([...estados].sort(), ['ACTIVADA', 'BORRADOR']);
  assert.equal([...estados].includes('VALIDADO' as never), false);
});

test('INV-06-109 · no existe transición que edite una versión ACTIVADA ni que la devuelva a BORRADOR (06:4307)', () => {
  assert.equal(
    TRANSICIONES_DE_VERSION_DE_PLAN_DE_ENTRENAMIENTO.some((t) => t.origen === 'ACTIVADA'),
    false,
  );
  assert.deepEqual(evaluarTransicionDePlanDeEntrenamiento('ACTIVADA', { transicion: 'GuardarBorrador', cambiosValidosComoBorrador: true }), {
    permitida: false,
    motivo: 'TRANSICION_NO_DECLARADA',
  });
  assert.deepEqual(
    evaluarTransicionDePlanDeEntrenamiento('ACTIVADA', { transicion: 'ActivarVersion', borradorValido: true, instantaneaPreservable: true }),
    { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' },
  );
});

test('REG-06-104 · «si no puede preservarse la instantánea, el plan no se activa» (05:8878)', () => {
  const base = { transicion: 'ActivarVersion' } as const;
  assert.equal(evaluarTransicionDePlanDeEntrenamiento('BORRADOR', { ...base, borradorValido: true, instantaneaPreservable: true }).permitida, true);
  // Las dos condiciones son necesarias, por separado.
  assert.equal(evaluarTransicionDePlanDeEntrenamiento('BORRADOR', { ...base, borradorValido: true, instantaneaPreservable: false }).permitida, false);
  assert.equal(evaluarTransicionDePlanDeEntrenamiento('BORRADOR', { ...base, borradorValido: false, instantaneaPreservable: true }).permitida, false);
});

// ─── TEST-TRN-006 · el criterio de intensidad conserva su semántica ─────────────────────────────

test('TEST-TRN-006 · REG-06-128: el criterio es exactamente uno de los dos, y puede no declararse', () => {
  assert.deepEqual(evaluarCriterioDeIntensidad({ criterio: CriterioDeIntensidad.PORCENTAJE_RM, valor: 75 }), { valido: true });
  assert.deepEqual(evaluarCriterioDeIntensidad({ criterio: CriterioDeIntensidad.RIR, valor: 2 }), { valido: true });

  // REG-06-128 es CONDICIONAL: «cada Prescripción **que declare** criterio» (06:5413). No declarar es legítimo, y
  // por eso el enum efectivo de persistencia es PORCENTAJE_RM | RIR | null, no dos valores. Implementarlo como
  // NOT NULL sería inventar una exigencia que el 06 no hace.
  assert.deepEqual(evaluarCriterioDeIntensidad({ criterio: null, valor: null }), { valido: true });

  // Pero un objetivo cuantitativo sin criterio es un número sin significado declarado.
  assert.deepEqual(evaluarCriterioDeIntensidad({ criterio: null, valor: 75 }), { valido: false, motivo: 'VALOR_SIN_CRITERIO' });

  // Un tercer criterio no existe.
  assert.deepEqual(evaluarCriterioDeIntensidad({ criterio: 'RPE' as never, valor: 8 }), { valido: false, motivo: 'CRITERIO_DESCONOCIDO' });
});

test('TEST-TRN-006 · REG-06-129: el esfuerzo percibido no es un tercer criterio, es dato de la ejecución', () => {
  assert.deepEqual(evaluarCriterioDeIntensidad({ criterio: CriterioDeIntensidad.RIR, valor: 2, esfuerzoPercibidoComoCriterio: true }), {
    valido: false,
    motivo: 'ESFUERZO_COMO_CRITERIO',
  });
});

test('REG-06-129 · no hay conversión automática entre criterios: el dominio no expone ninguna (06:5431)', async () => {
  const mod = await import('./entrenamiento');
  const nombres = Object.keys(mod).join(' ').toLowerCase();
  // Si algún día aparece una función que convierta RIR a %RM o estime una repetición máxima, esta prueba lo dice.
  for (const prohibido of ['convertir', 'estimarrm', 'rmestimad', 'arir', 'aporcentaje']) {
    assert.equal(nombres.includes(prohibido), false, `el dominio no puede exponer «${prohibido}»`);
  }
});

// ─── TEST-TRN-004 · sin registro no es lo mismo que no realizado ────────────────────────────────

test('TEST-TRN-004 · REG-06-131: la ausencia de registro produce SIN_REGISTRO, que no es una condición', () => {
  // La garantía central del dominio, declarada siete veces entre el 06 y el 10.
  assert.equal(vistaDeSesion(null), SIN_REGISTRO);

  // SIN_REGISTRO no es ninguno de los tres valores de la condición: es de otra clase.
  const condiciones: string[] = Object.values(CondicionDeSesion);
  assert.equal(condiciones.includes(SIN_REGISTRO), false);

  // NO_REALIZADA solo aparece si alguien la registró explícitamente.
  assert.equal(vistaDeSesion({ condicion: CondicionDeSesion.NO_REALIZADA }), 'NO_REALIZADA');
  assert.equal(vistaDeSesion({ condicion: CondicionDeSesion.REALIZADA }), 'REALIZADA');
  assert.equal(vistaDeSesion({ condicion: CondicionDeSesion.REALIZADA_CON_DESVIO }), 'REALIZADA_CON_DESVIO');
});

test('INV-06-141 · la condición de sesión es un conjunto cerrado de exactamente tres valores', () => {
  assert.deepEqual(Object.values(CondicionDeSesion).sort(), ['NO_REALIZADA', 'REALIZADA', 'REALIZADA_CON_DESVIO']);
});

// ─── TEST-TRN-003 · la sustitución conserva las dos puntas ──────────────────────────────────────

test('TEST-TRN-003 · REG-06-130: sustituir conserva prescripto y realizado, y no es un error', () => {
  const prescripto = 'exv-press-banca';
  const conSustitucion = { prescripcionId: 'rx-1', ejercicioRealizadoVersionId: 'exv-press-mancuernas' };
  const sinSustitucion = { prescripcionId: 'rx-1', ejercicioRealizadoVersionId: prescripto };

  assert.equal(huboSustitucion(conSustitucion, prescripto), true);
  assert.equal(huboSustitucion(sinSustitucion, prescripto), false);

  // Los dos identificadores siguen ahí después de detectarla: la sustitución es un hecho con dos puntas, no un
  // reemplazo. Colapsarlos en un solo campo destruiría qué se había indicado.
  assert.equal(conSustitucion.prescripcionId, 'rx-1');
  assert.equal(conSustitucion.ejercicioRealizadoVersionId, 'exv-press-mancuernas');
});

// ─── Serie ejecutada (REG-06-140; INV-06-152) ───────────────────────────────────────────────────

test('INV-06-152 · si hay carga registrada tiene que haber unidad; los demás campos son opcionales', () => {
  const base = { indice: 1, repeticiones: 8, rir: null, esfuerzoPercibido: null };

  // REG-06-140 dice «puede conservar» e INV-06-152 se viola «si falta unidad para una carga registrada» (06:5710).
  // La lectura conciliada: opcionales, pero un número sin unidad no es una carga.
  assert.deepEqual(evaluarSerieEjecutada({ ...base, carga: { valor: 80, unidad: 'kg' } }), { valida: true });
  assert.deepEqual(evaluarSerieEjecutada({ ...base, carga: { valor: 80, unidad: '  ' } }), { valida: false, motivo: 'CARGA_SIN_UNIDAD' });

  // Sin carga es legítimo: no se inventa lo que no se capturó.
  assert.deepEqual(evaluarSerieEjecutada({ ...base, carga: null }), { valida: true });
  // Y sin RIR también: una serie sin RIR no se clasifica (TEST-PRJ-004; INV-06-190).
  assert.deepEqual(evaluarSerieEjecutada({ ...base, carga: null, repeticiones: null, rir: null }), { valida: true });

  assert.deepEqual(evaluarSerieEjecutada({ ...base, carga: null, indice: 0 }), { valida: false, motivo: 'INDICE_INVALIDO' });
});

test('REG-06-132 · las dos granularidades son un conjunto cerrado, y se conserva cuál se usó', () => {
  assert.deepEqual(Object.values(GranularidadDeRegistro).sort(), ['EJERCICIO_O_SESION', 'SERIE']);
});

// ─── TEST-TRN-001 · la progresión no crea un séptimo resultado ──────────────────────────────────

test('REG-06-117 · la progresión mapea a AJUSTAR o SUSTITUIR; no existe el token PROGRESAR', async () => {
  assert.equal(resultadoDeProgresion('PROGRESAR_CONSERVANDO_ESTRUCTURA'), 'AJUSTAR');
  assert.equal(resultadoDeProgresion('REQUERIR_PLANIFICACION_SUCESORA'), 'SUSTITUIR');

  // Los seis resultados salen de revision.ts, compartidos con nutrición: REG-06-07 pide patrón común sin
  // vocabularios paralelos, y el 05 exige que UC-P18 «no redefina DEC-043» (05:9437).
  const { RESULTADOS_DE_REVISION } = await import('./revision');
  assert.equal(RESULTADOS_DE_REVISION.length, 6);
  assert.equal(RESULTADOS_DE_REVISION.includes('PROGRESAR' as never), false);
});

// ─── La ocurrencia (REG-06-115; DL-077) ─────────────────────────────────────────────────────────

test('REG-06-115 · la ocurrencia se identifica por sesión y fecha local, no por timestamp (06:5235)', () => {
  const sesion = 'ses-lunes-a';

  // Dos ejecuciones de la misma sesión el mismo día son la misma ocurrencia: chocan, que es lo que la regla pide.
  assert.equal(claveDeOcurrencia(sesion, '2026-09-21'), claveDeOcurrencia(sesion, '2026-09-21'));
  // En días distintos, no.
  assert.notEqual(claveDeOcurrencia(sesion, '2026-09-21'), claveDeOcurrencia(sesion, '2026-09-22'));
  // Y dos sesiones distintas el mismo día tampoco chocan.
  assert.notEqual(claveDeOcurrencia(sesion, '2026-09-21'), claveDeOcurrencia('ses-lunes-b', '2026-09-21'));

  // La fecha es local: una sesión de las 21:41 en Buenos Aires pertenece a ese día, no al siguiente en UTC. Es la
  // lección de WP-05, donde el período de la evolución se recortaba en UTC mientras los puntos iban en hora local.
  assert.equal(claveDeOcurrencia(sesion, '2026-09-20'), `${sesion}:2026-09-20`);
});

// ─── Cero juicio: lo que el dominio no calcula (INV-06-153; control falsable sin_M11) ───────────

test('INV-06-153 · B-08 captura, no calcula: el dominio no expone volumen, marcas ni progresiones', async () => {
  const mod = await import('./entrenamiento');
  const nombres = Object.keys(mod).join(' ').toLowerCase();
  // El control falsable `sin_M11` del 06 falla «si aparece cálculo de volumen, efectividad, progresión, marca o
  // mapa» (06:5736). Acá se verifica lo mismo sobre la superficie que el dominio publica.
  for (const prohibido of ['volumen', 'efectividad', 'marca', 'mapa', 'score', 'puntaje', 'adherencia']) {
    assert.equal(nombres.includes(prohibido), false, `el dominio no puede exponer «${prohibido}»`);
  }
});

test('la ejecución y el plan son dos máquinas distintas, con terminales distintas', () => {
  // Las dos arrancan en BORRADOR, y ahí se termina el parecido: el plan termina en ACTIVADA y la ejecución en
  // REGISTRADA. Que sus transiciones no se crucen no hace falta probarlo en runtime — los dos tipos no tienen
  // ningún valor en común, así que el compilador rechaza la comparación antes de que exista una prueba.
  assert.equal(EstadoDeEjecucion.REGISTRADA, 'REGISTRADA');
  const terminalesDeEjecucion = TRANSICIONES_DE_EJECUCION.map((t) => t.destino);
  const terminalesDePlan = TRANSICIONES_DE_VERSION_DE_PLAN_DE_ENTRENAMIENTO.map((t) => t.destino);
  assert.equal(terminalesDeEjecucion.includes('REGISTRADA'), true);
  assert.equal(terminalesDePlan.includes('ACTIVADA' as never), true);
  assert.equal(terminalesDePlan.includes('REGISTRADA' as never), false);
});
