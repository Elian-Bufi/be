// Los datos de los escenarios de la prueba breve, sin lógica: los planes, los objetivos y las comidas de cada día.
// Las cantidades son fijas (no se escalan) para que lo indicado y lo registrado se puedan calcular a mano. Los
// alimentos son del catálogo base de BE, con su composición cada 100 g; todos en gramos, para que ningún ítem quede sin
// el dato del nutriente por una unidad sin equivalencia.
//
// Días relativos al día de la carga (H): `hace: 3` es H-3. H es la fecha civil de Buenos Aires del día en que se cargó.

/** Ítems: [alimento del catálogo (catalogo.mjs), gramos, estado de preparación]. */
const YOGUR_AVENA_BANANA = ['Yogur con avena y banana', [['yogur', 200, 'AS_PURCHASED'], ['avena', 40, 'RAW'], ['banana', 100, 'RAW']]];
const TOSTADAS_QUESO_NARANJA = ['Tostadas con queso y naranja', [['panIntegral', 60, 'AS_PURCHASED'], ['quesoFresco', 30, 'AS_PURCHASED'], ['naranja', 150, 'RAW']]];
const POLLO_ARROZ = ['Pollo con arroz y ensalada', [['pollo', 150, 'COOKED'], ['arroz', 150, 'COOKED'], ['lechuga', 60, 'RAW'], ['tomate', 100, 'RAW'], ['aceite', 10, 'RAW']]];
const CARNE_ZAPALLO = ['Carne con puré de zapallo', [['carne', 150, 'COOKED'], ['zapallo', 250, 'COOKED'], ['aceite', 5, 'RAW']]];
const LENTEJAS = ['Lentejas guisadas', [['lentejas', 220, 'COOKED'], ['cebolla', 50, 'COOKED'], ['zanahoria', 80, 'COOKED'], ['aceite', 10, 'RAW']]];
const FRUTA_NUECES = ['Fruta y nueces', [['manzana', 150, 'RAW'], ['nueces', 15, 'RAW']]];
const MERLUZA_PAPA = ['Merluza con papa y brócoli', [['merluza', 180, 'COOKED'], ['papa', 200, 'COOKED'], ['brocoli', 150, 'COOKED'], ['aceite', 10, 'RAW']]];
const TORTILLA = ['Tortilla de espinaca', [['huevo', 150, 'COOKED'], ['espinaca', 150, 'COOKED'], ['papa', 150, 'COOKED'], ['aceite', 10, 'RAW']]];

export const DIA_TIPO = 'Día habitual';

/**
 * Prueba Dos: **una sola opción por comida**, un solo día tipo y una sola versión vigente. El día tiene «Indicado en el
 * plan»: la suma de las cuatro opciones. El objetivo (1800 kcal) es distinto de lo indicado a propósito, para que las
 * tres capas no se superpongan.
 */
export const PLAN_DOS = [
  ['Desayuno', [YOGUR_AVENA_BANANA]],
  ['Almuerzo', [POLLO_ARROZ]],
  ['Merienda', [FRUTA_NUECES]],
  ['Cena', [MERLUZA_PAPA]],
];

/** Prueba Tres: **alternativas** en desayuno (2), almuerzo (3) y cena (2); la merienda tiene una sola. Sin indicado del día. */
export const PLAN_TRES = [
  ['Desayuno', [YOGUR_AVENA_BANANA, TOSTADAS_QUESO_NARANJA]],
  ['Almuerzo', [POLLO_ARROZ, CARNE_ZAPALLO, LENTEJAS]],
  ['Merienda', [FRUTA_NUECES]],
  ['Cena', [MERLUZA_PAPA, TORTILLA]],
];

/** El objetivo de cada una: kcal por día y los macros en gramos por día (la fibra no tiene objetivo, DL-158). */
export const OBJETIVO_DOS = { kcal: 1800, proteina: 100, carbohidratos: 220, grasas: 60, fundamento: 'Objetivo sintético de la prueba breve: mantener el peso con una alimentación ordenada.' };
export const OBJETIVO_TRES = { kcal: 1900, proteina: 95, carbohidratos: 240, grasas: 62, fundamento: 'Objetivo sintético de la prueba breve: sostener la energía con opciones para elegir.' };

/** Cuándo pasó cada cosa (días antes de H, hora de Buenos Aires). */
export const FECHAS = {
  vinculo: { hace: 9, hora: '09:00' },
  evaluacion: { hace: 8, hora: '09:00' },
  objetivo: { hace: 8, hora: '09:10' },
  activacion: { hace: 8, hora: '10:00' },
};
export const HORA_DE_LA_COMIDA = { Desayuno: '08:30', Almuerzo: '13:15', Merienda: '17:30', Cena: '21:00' };

/**
 * Las comidas de cada día. Por comida:
 * - `porciones`: «Comí lo del plan» (PLAN_PORTIONS): las cantidades de la opción;
 * - `{ gramos: [..] }`: cantidades informadas (REPORTED), una por ítem de la opción, en el mismo orden; `null` es «no lo
 *   comí» (aporta cero porque se declaró);
 * - `sinCantidades`: registrada sin confirmar cantidades (UNCONFIRMED): **el registro incompleto**, sin número registrado
 *   aunque su opción tenga indicado;
 * - `{ diferente: '…' }`: «Comí algo diferente», con descripción: no es una opción del plan y no tiene indicado.
 * `opcion` es el índice de la opción elegida (0 si la comida tiene una sola).
 * Un día que no está en la lista es **un hueco**: no se registró nada (no es cero).
 */
export const COMIDAS_DOS = [
  { hace: 7, comidas: { Desayuno: { opcion: 0, porciones: true }, Almuerzo: { opcion: 0, gramos: [180, 200, 60, 100, 10] }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 0, gramos: [180, 250, 150, 10] } } },
  { hace: 6, comidas: { Desayuno: { opcion: 0, porciones: true }, Almuerzo: { opcion: 0, porciones: true }, Merienda: { opcion: 0, gramos: [150, null] }, Cena: { opcion: 0, gramos: [140, 200, 90, 10] } } },
  { hace: 5, comidas: { Desayuno: { opcion: 0, gramos: [200, 60, 100] }, Almuerzo: { opcion: 0, gramos: [150, 225, 60, 100, 10] }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 0, porciones: true } } },
  // H-4: el hueco.
  { hace: 3, comidas: { Desayuno: { opcion: 0, porciones: true }, Almuerzo: { opcion: 0, gramos: [120, 150, 60, 100, 5] }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 0, gramos: [180, 150, 150, 10] } } },
  // H-2: el registro incompleto (el almuerzo, sin cantidades).
  { hace: 2, comidas: { Desayuno: { opcion: 0, porciones: true }, Almuerzo: { opcion: 0, sinCantidades: true }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 0, gramos: [200, 200, 150, 10] } } },
  { hace: 1, comidas: { Desayuno: { opcion: 0, gramos: [200, 40, 120] }, Almuerzo: { opcion: 0, porciones: true }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 0, porciones: true } } },
];
export const HUECO_DOS = 4;
export const INCOMPLETO_DOS = { hace: 2, comida: 'Almuerzo' };

export const COMIDAS_TRES = [
  { hace: 6, comidas: { Desayuno: { opcion: 0, porciones: true }, Almuerzo: { opcion: 0, porciones: true }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 0, porciones: true } } },
  { hace: 5, comidas: { Desayuno: { opcion: 1, porciones: true }, Almuerzo: { opcion: 1, porciones: true }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 1, gramos: [150, 150, 100, 10] } } },
  { hace: 4, comidas: { Desayuno: { opcion: 0, porciones: true }, Almuerzo: { opcion: 2, porciones: true }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 0, porciones: true } } },
  { hace: 3, comidas: { Desayuno: { opcion: 1, porciones: true }, Almuerzo: { opcion: 0, gramos: [150, 200, 60, 100, 10] }, Merienda: { opcion: 0, porciones: true }, Cena: { diferente: 'Pizza con amigos, dos porciones' } } },
  { hace: 2, comidas: { Desayuno: { opcion: 0, porciones: true }, Almuerzo: { opcion: 1, porciones: true }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 1, porciones: true } } },
  { hace: 1, comidas: { Desayuno: { opcion: 1, porciones: true }, Almuerzo: { opcion: 2, gramos: [250, 50, 80, 10] }, Merienda: { opcion: 0, porciones: true }, Cena: { opcion: 0, porciones: true } } },
];

// ─── Entrenamiento: la sesión del teléfono (Prueba Uno) ────────────────────────────────────────────────────────

/** Dos ejercicios de tres series, con descanso indicado (guion del teléfono, «Preparación»). */
export const SESION_UNO = {
  bloque: 'Bloque de prueba',
  proposito: 'Probar en el teléfono la sustitución de un ejercicio (prueba breve del 2026-10-26).',
  sesion: 'Sesión de prueba',
  ejercicios: [
    { ejercicio: 'banca', repeticiones: 10, series: 3, cargaKg: 40, descansoS: 90, rir: 2 },
    { ejercicio: 'sentadilla', repeticiones: 8, series: 3, cargaKg: 50, descansoS: 120, rir: 2 },
  ],
  objetivo: 'Ganar fuerza con técnica estable (objetivo sintético de la prueba breve).',
  fundamento: 'Fundamento sintético: decisión del profesional, sin cálculo de BE.',
};
