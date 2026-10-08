// El escenario sintético de 12 semanas de WP-DASHBOARD-PROFESIONAL: una definición pura y determinista, relativa al día
// de la generación (D0). No toca la base ni la API: lo usan `generar.mjs`, que lo escribe, y DATOS-SINTETICOS.md, que
// da sus resultados esperados calculados a mano. Ningún dato es de una persona real.
//
// Convenciones: D-k es el día civil k días antes de D0 en America/Argentina/Buenos_Aires. La semana 1 es D-83..D-77; la
// 9, D-27..D-21; la 10, D-20..D-14; la 12, D-6..D0. Las horas son locales.

export const ZONA = 'America/Argentina/Buenos_Aires';
export const DIAS = 84; // D-83..D0

/** La fecha civil `k` días antes de `hoy` (YYYY-MM-DD). */
export function diaMenos(hoy, k) {
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - k);
  return d.toISOString().slice(0, 10);
}

/** 0 = lunes … 6 = domingo. */
export const diaDeLaSemana = (fecha) => (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7;

/** La semana del escenario (1 a 12) de D-k. */
export const semanaDe = (k) => Math.floor((83 - k) / 7) + 1;

/** El instante de una hora local en una fecha civil de Buenos Aires (UTC−3, sin horario de verano). */
export const instante = (fecha, hora) => new Date(`${fecha}T${hora}:00-03:00`);

// ─── Catálogo (elementos sembrados por las migraciones; composición por 100 g o 100 ml) ─────────────────────────────

export const ALIMENTOS = {
  avena: { id: '1d73a14d-1fa1-4a10-84c2-3b7537c5b520', nombre: 'Avena arrollada', kcal: 379, sinFibra: true },
  leche: { id: '77ace701-cd14-49c6-877c-1a858da71bcd', nombre: 'Leche descremada', kcal: 35, sinFibra: true, ml: true },
  arroz: { id: '65bbfed9-71d1-5d61-9a23-9c89d0b92455', nombre: 'Arroz blanco de grano largo, cocido', kcal: 130 },
  pollo: { id: '08066caa-6e08-5763-a943-5642212d8f83', nombre: 'Pechuga de pollo sin piel, asada', kcal: 165 },
  brocoli: { id: 'ed2d76ab-1993-5258-9496-0527315cd530', nombre: 'Brócoli hervido', kcal: 35 },
  lentejas: { id: '0a3c813e-a2f9-5a36-9155-f86166b96085', nombre: 'Lentejas hervidas', kcal: 116 },
  zanahoria: { id: 'c93180fb-82d8-53c4-a82d-e44c3c486504', nombre: 'Zanahoria hervida', kcal: 35 },
  aceite: { id: 'd527cfae-c081-5e95-ad20-8a0cad9ba70c', nombre: 'Aceite de oliva', kcal: 884 },
  yogur: { id: '121f8f5f-4aa2-4ab9-8f7e-327f85ce5cf1', nombre: 'Yogur natural', kcal: 61, sinFibra: true },
  manzana: { id: 'eaf534d4-f839-4acc-8a6d-53d8dc359e29', nombre: 'Manzana', kcal: 52, sinFibra: true },
  salmon: { id: '1df55f96-f436-53f2-9a2e-3803fb87bece', nombre: 'Salmón atlántico, cocido', kcal: 206 },
  papa: { id: 'd61e4970-8d1e-503c-bf93-5ea236ce5223', nombre: 'Papa hervida', kcal: 87 },
  panIntegral: { id: '14a1912d-d5e1-42b7-87e2-a1508aa947bf', nombre: 'Pan integral', kcal: 247, sinFibra: true },
  queso: { id: '025d7e5b-124c-416f-83e1-bbdd1cf78f20', nombre: 'Queso fresco', kcal: 264, sinFibra: true },
};

const item = (a, cantidad, estado) => ({ catalogItemId: ALIMENTOS[a].id, quantity: { value: cantidad, unit: ALIMENTOS[a].ml ? 'ml' : 'g' }, preparationState: estado });

/** Las dos etapas del plan nutricional. Cada opción dice su energía calculada a mano (DATOS-SINTETICOS.md §3). */
export const PLANES_NUTRICIONALES = {
  v1: {
    dayTypes: [
      {
        label: 'Día habitual',
        meals: [
          { label: 'Desayuno', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Avena con leche', items: [item('avena', 50, 'RAW'), item('leche', 200, 'RAW')] }] },
          {
            label: 'Almuerzo',
            prescriptionMode: 'DISH_OPTIONS',
            options: [
              { label: 'Arroz con pollo y brócoli', items: [item('arroz', 150, 'COOKED'), item('pollo', 120, 'COOKED'), item('brocoli', 100, 'COOKED')] },
              { label: 'Lentejas con zanahoria', items: [item('lentejas', 200, 'COOKED'), item('zanahoria', 100, 'COOKED'), item('aceite', 10, 'RAW')] },
            ],
          },
          { label: 'Merienda', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Yogur con manzana', items: [item('yogur', 200, 'RAW'), item('manzana', 150, 'RAW')] }] },
          { label: 'Cena', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Salmón con papa', items: [item('salmon', 150, 'COOKED'), item('papa', 200, 'COOKED'), item('aceite', 5, 'RAW')] }] },
        ],
      },
    ],
  },
  v2: {
    dayTypes: [
      {
        label: 'Día habitual',
        meals: [
          {
            label: 'Desayuno',
            prescriptionMode: 'DISH_OPTIONS',
            options: [
              { label: 'Avena con leche', items: [item('avena', 40, 'RAW'), item('leche', 200, 'RAW')] },
              { label: 'Tostadas con queso', items: [item('panIntegral', 60, 'AS_PURCHASED'), item('queso', 30, 'AS_PURCHASED')] },
            ],
          },
          {
            label: 'Almuerzo',
            prescriptionMode: 'DISH_OPTIONS',
            options: [
              { label: 'Arroz con pollo y brócoli', items: [item('arroz', 120, 'COOKED'), item('pollo', 140, 'COOKED'), item('brocoli', 150, 'COOKED')] },
              { label: 'Lentejas con zanahoria', items: [item('lentejas', 200, 'COOKED'), item('zanahoria', 100, 'COOKED'), item('aceite', 5, 'RAW')] },
            ],
          },
          { label: 'Merienda', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Yogur con manzana', items: [item('yogur', 200, 'RAW'), item('manzana', 150, 'RAW')] }] },
          { label: 'Cena', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Salmón con papa', items: [item('salmon', 150, 'COOKED'), item('papa', 150, 'COOKED'), item('aceite', 5, 'RAW')] }] },
        ],
      },
    ],
  },
};

export const HORA_DE_COMIDA = { Desayuno: '08:00', Almuerzo: '13:00', Merienda: '17:00', Cena: '21:00' };

/**
 * Las comidas históricas (D-83..D-2), por SQL. Cada una: fecha, comida, opción (índice), cantidades y casos.
 * - S1-S3: cuatro comidas con las porciones del plan; la merienda de los miércoles sin confirmar (subtotal).
 * - S4: D-62..D-59 sin registros (hueco); después, como S1.
 * - S5-S7: sin merienda; la cena de los martes informada (papa a la mitad, sin aceite); la de los sábados, una comida
 *   diferente solo con texto (sin calorías inventadas).
 * - D-35 en adelante, la etapa 2 (el desayuno de D-35 todavía es de la etapa 1: la v2 se activa a las 09:30).
 * - S8-S12: cuatro comidas; los lunes se cargan al día siguiente (carga tardía); S10 solo almuerzo y cena.
 * - D-30: almuerzo sin confirmar, rectificado el D-29 a las porciones del plan (cuenta una vez).
 * - D-11: merienda registrada y anulada esa noche (queda en el historial, fuera de los agregados).
 */
export function comidasHistoricas(hoy) {
  const salida = [];
  for (let k = 83; k >= 2; k--) {
    const fecha = diaMenos(hoy, k);
    const semana = semanaDe(k);
    const dds = diaDeLaSemana(fecha);
    if (k >= 59 && k <= 62) continue; // hueco de cuatro días
    const etapa2Desde = (comida) => k < 35 || (k === 35 && comida !== 'Desayuno');
    const comidas = semana >= 5 && semana <= 7 ? ['Desayuno', 'Almuerzo', 'Cena'] : semana === 10 ? ['Almuerzo', 'Cena'] : ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
    for (const comida of comidas) {
      const plan = etapa2Desde(comida) ? 'v2' : 'v1';
      const r = { fecha, comida, plan, opcion: 0, consumo: { status: 'PLAN_PORTIONS' }, ocurrio: instante(fecha, HORA_DE_COMIDA[comida]), registrado: null, rectificacion: null, anulacion: null, diferente: null };
      if (comida === 'Almuerzo') r.opcion = k % 2 === 0 ? 0 : 1;
      if (comida === 'Desayuno' && plan === 'v2') r.opcion = k % 3 === 0 ? 1 : 0;
      if (comida === 'Merienda' && dds === 2 && semana <= 4) r.consumo = { status: 'UNCONFIRMED' };
      if (comida === 'Cena' && semana >= 5 && semana <= 7 && dds === 1) r.consumo = { status: 'REPORTED', informado: { salmon: 150, papa: 100, aceite: 'NO_COMIDO' } };
      if (comida === 'Cena' && semana >= 5 && semana <= 7 && dds === 5) {
        r.diferente = { descripcion: semana === 6 ? 'Asado familiar' : 'Pizza con amigos', aproximada: semana === 6 ? 'Un plato' : 'Tres porciones' };
      }
      if (k === 30 && comida === 'Almuerzo') {
        r.consumo = { status: 'UNCONFIRMED' };
        r.rectificacion = { consumo: { status: 'PLAN_PORTIONS' }, momento: instante(diaMenos(hoy, 29), '10:00') };
      }
      if (k === 11 && comida === 'Merienda') r.anulacion = { motivo: 'La registré por error', momento: instante(fecha, '21:30') };
      // Carga tardía: lo de los lunes de la etapa 2 se registra el martes a las 09:00.
      r.registrado = semana >= 8 && dds === 0 ? instante(diaMenos(hoy, k - 1), '09:00') : new Date(r.ocurrio.getTime() + 10 * 60 * 1000);
      salida.push(r);
    }
  }
  return salida;
}

// ─── Entrenamiento ─────────────────────────────────────────────────────────────────────────────────────────────────

export const EJERCICIOS = {
  sentadilla: { version: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01', ejercicio: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01', nombre: 'Sentadilla' },
  pesoMuerto: { version: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e04', ejercicio: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e04', nombre: 'Peso muerto' },
  zancadas: { version: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e08', ejercicio: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e08', nombre: 'Zancadas' },
  hipThrust: { version: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e12', ejercicio: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e12', nombre: 'Hip thrust' },
  banca: { version: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02', ejercicio: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02', nombre: 'Press de banca' },
  remo: { version: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e05', ejercicio: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e05', nombre: 'Remo con barra' },
  dominadas: { version: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e06', ejercicio: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e06', nombre: 'Dominadas' },
};

const series = (n, reps, extra = {}) => Array.from({ length: n }, () => ({ repetitions: { value: reps }, ...extra }));
const rx = (id, ejercicio, n, reps, rir, carga) => ({
  prescriptionId: id,
  exerciseVersionId: EJERCICIOS[ejercicio].version,
  sets: series(n, reps),
  intensity: rir === null ? null : { criterion: 'RIR', target: { value: rir } },
  ...(carga ? { suggestedLoad: { value: carga, unit: 'kg' } } : {}),
});

/** Las dos etapas del plan de entrenamiento: A (tren inferior) y B (tren superior), sin objetivos por serie. */
export const PLANES_DE_ENTRENAMIENTO = {
  v1: {
    blocks: [
      {
        label: 'Fuerza base',
        purpose: 'Técnica y volumen moderado',
        sessions: [
          { sessionId: 'ses-a', label: 'A · Tren inferior', prescriptions: [rx('rx-sentadilla', 'sentadilla', 3, 8, 2, 60), rx('rx-peso-muerto', 'pesoMuerto', 3, 6, 2, 70), rx('rx-zancadas', 'zancadas', 3, 10, null, null)] },
          { sessionId: 'ses-b', label: 'B · Tren superior', prescriptions: [rx('rx-banca', 'banca', 3, 8, 2, 50), rx('rx-remo', 'remo', 3, 10, 2, 40), rx('rx-dominadas', 'dominadas', 3, 6, null, null)] },
        ],
      },
    ],
  },
  v2: {
    blocks: [
      {
        label: 'Fuerza progresión',
        purpose: 'Más carga, menos repeticiones',
        sessions: [
          { sessionId: 'ses-a', label: 'A · Tren inferior', prescriptions: [rx('rx-sentadilla', 'sentadilla', 4, 6, 1, 77.5), rx('rx-peso-muerto', 'pesoMuerto', 3, 5, 2, 85), rx('rx-zancadas', 'zancadas', 3, 10, 2, 10)] },
          { sessionId: 'ses-b', label: 'B · Tren superior', prescriptions: [rx('rx-banca', 'banca', 4, 6, 1, 60), rx('rx-remo', 'remo', 4, 8, 2, 47.5), rx('rx-dominadas', 'dominadas', 4, 6, null, null)] },
        ],
      },
    ],
  },
};

const serie = (setIndex, carga, reps, rir, unidad = 'kg') => ({ setIndex, load: carga === null ? null : { value: carga, unit: unidad }, completedRepetitions: reps, rir, perceivedExertion: null });

/**
 * Las sesiones históricas (D-83..D-1), por SQL: A los lunes y B los jueves, a las 18:30, registradas a las 19:45.
 * - Etapa 1 (S1-S7): sentadilla 60 kg + 2,5 por semana; peso muerto 70 + 2,5; banca 50 + 1,25; remo 40 + 1,25. La serie 3
 *   de la sentadilla sin RIR informado en las semanas impares (RIR nulo, no cero).
 * - Etapa 2 (D-35 en adelante): sentadilla 77,5 + 2,5 por semana desde S8, cuatro series.
 * - S3 lunes: la carga de la serie 2 de la sentadilla se tipeó 650; el profesional la corrige a 65.
 * - S4 lunes: realizada con cambios (las zancadas, reemplazadas por hip thrust).
 * - S5 jueves: el press de banca, registrado en libras (115, 115 y 120 lb): no se mezcla con los kg.
 * - S6 jueves: registrada como no realizada (viaje laboral).
 * - S7 lunes: registro resumido, sin series.
 * - S9 jueves: cargada al día siguiente.
 * - S10: sin sesiones (vacaciones).
 */
export function sesionesHistoricas(hoy) {
  const salida = [];
  for (let k = 83; k >= 1; k--) {
    const fecha = diaMenos(hoy, k);
    const dds = diaDeLaSemana(fecha);
    if (dds !== 0 && dds !== 3) continue;
    const semana = semanaDe(k);
    if (semana === 10) continue;
    const plan = k <= 35 ? 'v2' : 'v1';
    const sesion = dds === 0 ? 'ses-a' : 'ses-b';
    const s = { fecha, semana, plan, sesion, ocurrio: instante(fecha, '18:30'), registrado: instante(fecha, '19:45'), condicion: 'REALIZADA', granularidad: 'SERIE', motivo: null, ejercicios: [], resumen: null, correccion: null };
    const w = semana - 1;
    const w2 = Math.max(0, semana - 8);
    if (sesion === 'ses-a') {
      if (plan === 'v1') {
        const cs = 60 + 2.5 * w;
        s.ejercicios = [
          { prescriptionId: 'rx-sentadilla', ejercicio: 'sentadilla', sets: [serie(1, cs, 8, 2), serie(2, cs, 8, 2), serie(3, cs, 7, semana % 2 === 1 ? null : 1)] },
          { prescriptionId: 'rx-peso-muerto', ejercicio: 'pesoMuerto', sets: [1, 2, 3].map((i) => serie(i, 70 + 2.5 * w, 6, 2)) },
          { prescriptionId: 'rx-zancadas', ejercicio: semana === 4 ? 'hipThrust' : 'zancadas', sets: [1, 2, 3].map((i) => serie(i, null, 10, null)) },
        ];
        if (semana === 3) {
          s.correccion = { motivo: 'Error de tipeo en la carga: 650 en lugar de 65', momento: instante(diaMenos(hoy, k - 1), '11:00') };
          s.cargaTipeada = 650;
        }
        if (semana === 4) {
          s.condicion = 'REALIZADA_CON_DESVIO';
          s.motivo = 'Zancadas reemplazadas por hip thrust: el banco de zancadas estaba ocupado';
        }
        if (semana === 7) {
          s.granularidad = 'EJERCICIO_O_SESION';
          s.ejercicios = s.ejercicios.map((e) => ({ prescriptionId: e.prescriptionId, ejercicio: e.ejercicio, resumen: 'Hecho completo, sin anotar las series' }));
        }
      } else {
        const cs = 77.5 + 2.5 * w2;
        s.ejercicios = [
          { prescriptionId: 'rx-sentadilla', ejercicio: 'sentadilla', sets: [serie(1, cs, 6, 2), serie(2, cs, 6, 1), serie(3, cs, 6, 1), serie(4, cs, 5, 0)] },
          { prescriptionId: 'rx-peso-muerto', ejercicio: 'pesoMuerto', sets: [1, 2, 3].map((i) => serie(i, 85 + 2.5 * w2, 5, 2)) },
          { prescriptionId: 'rx-zancadas', ejercicio: 'zancadas', sets: [1, 2, 3].map((i) => serie(i, 10, 10, 2)) },
        ];
      }
    } else {
      if (plan === 'v1') {
        const cb = 50 + 1.25 * w;
        s.ejercicios = [
          { prescriptionId: 'rx-banca', ejercicio: 'banca', sets: semana === 5 ? [serie(1, 115, 8, 2, 'lb'), serie(2, 115, 8, 2, 'lb'), serie(3, 120, 7, 1, 'lb')] : [serie(1, cb, 8, 2), serie(2, cb, 8, 2), serie(3, cb, 7, 1)] },
          { prescriptionId: 'rx-remo', ejercicio: 'remo', sets: [1, 2, 3].map((i) => serie(i, 40 + 1.25 * w, 10, 2)) },
          { prescriptionId: 'rx-dominadas', ejercicio: 'dominadas', sets: [serie(1, null, 6, null), serie(2, null, 5, null), serie(3, null, 5, null)] },
        ];
        if (semana === 6) {
          s.condicion = 'NO_REALIZADA';
          s.granularidad = null;
          s.motivo = 'Viaje laboral';
          s.ejercicios = [];
        }
      } else {
        const cb = 60 + 1.25 * w2;
        s.ejercicios = [
          { prescriptionId: 'rx-banca', ejercicio: 'banca', sets: [1, 2, 3, 4].map((i) => serie(i, cb, 6, i === 4 ? 0 : 1)) },
          { prescriptionId: 'rx-remo', ejercicio: 'remo', sets: [1, 2, 3, 4].map((i) => serie(i, 47.5 + 1.25 * w2, 8, 2)) },
          { prescriptionId: 'rx-dominadas', ejercicio: 'dominadas', sets: [1, 2, 3, 4].map((i) => serie(i, null, 6, null)) },
        ];
        if (semana === 9) s.registrado = instante(diaMenos(hoy, k - 1), '10:30');
      }
    }
    salida.push(s);
  }
  return salida;
}

// ─── Antropometría ─────────────────────────────────────────────────────────────────────────────────────────────────

export const PROTOCOLOS = {
  perfil: { version: '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f10', nombre: 'Perfil antropométrico completo' },
  lab: { version: '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f01', nombre: 'Protocolo de laboratorio (demostración)' },
};

const pliegues = (t, s, sp, a, m, p) => [
  ['pliegue-triceps', t, 'mm'],
  ['pliegue-subescapular', s, 'mm'],
  ['pliegue-supraespinal', sp, 'mm'],
  ['pliegue-abdominal', a, 'mm'],
  ['pliegue-muslo-frontal', m, 'mm'],
  ['pliegue-pantorrilla', p, 'mm'],
];

/**
 * Las tomas históricas, por SQL, con la fecha del hecho y la de registro explícitas.
 * - D-61: la cintura se tipeó 95,0 y se corrige a 90,5 al día siguiente (cuenta la corrección).
 * - D-40: otro protocolo (laboratorio), que parece un salto de 2,2 kg: el peso abre otro grupo comparable, la línea se
 *   corta y no se calcula una diferencia a través del corte.
 * - D-19: dos tomas el mismo día (08:00 y 19:30): dos puntos, no un promedio. El pliegue del bíceps se anula (sitio mal
 *   marcado): queda en el historial, sin punto.
 * La toma de D-1 la registra el generador por la API, hoy: es la carga tardía de antropometría.
 */
export function tomasHistoricas(hoy) {
  return [
    {
      fecha: diaMenos(hoy, 82),
      hora: '08:00',
      protocolo: 'perfil',
      mediciones: [['peso', 82.4, 'kg'], ['talla', 178, 'cm'], ['perimetro-cintura', 92.0, 'cm'], ['perimetro-cadera', 101.0, 'cm'], ...pliegues(14.0, 16.5, 13.0, 24.0, 18.0, 9.5)],
    },
    {
      fecha: diaMenos(hoy, 61),
      hora: '08:00',
      protocolo: 'perfil',
      mediciones: [['peso', 81.6, 'kg'], ['perimetro-cintura', 95.0, 'cm'], ['perimetro-cadera', 100.2, 'cm'], ...pliegues(13.2, 15.8, 12.0, 22.5, 17.2, 9.0)],
      correcciones: [{ metrica: 'perimetro-cintura', valor: 90.5, unidad: 'cm', motivo: 'Valor tipeado mal: era 90,5', momento: instante(diaMenos(hoy, 60), '09:00') }],
    },
    { fecha: diaMenos(hoy, 40), hora: '08:00', protocolo: 'lab', mediciones: [['peso', 79.4, 'kg']] },
    {
      fecha: diaMenos(hoy, 19),
      hora: '08:00',
      protocolo: 'perfil',
      mediciones: [['peso', 80.2, 'kg'], ['perimetro-cintura', 89.0, 'cm'], ['perimetro-cadera', 99.5, 'cm'], ...pliegues(12.4, 15.0, 11.2, 21.0, 16.5, 8.8), ['pliegue-biceps', 6.0, 'mm']],
      anulaciones: [{ metrica: 'pliegue-biceps', motivo: 'Sitio mal marcado', momento: instante(diaMenos(hoy, 19), '08:40') }],
    },
    { fecha: diaMenos(hoy, 19), hora: '19:30', protocolo: 'perfil', mediciones: [['peso', 80.9, 'kg']] },
  ];
}

/** La toma de ayer, que el profesional carga hoy por la API (API-ANT-02). */
export const tomaReciente = (hoy) => ({ fecha: diaMenos(hoy, 1), hora: '08:00', protocolo: 'perfil', mediciones: [['peso', 79.8, 'kg'], ['perimetro-cintura', 88.2, 'cm']] });
