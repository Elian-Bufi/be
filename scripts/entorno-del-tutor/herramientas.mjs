// WP-ENTORNO-DEL-TUTOR (DL-184) · las herramientas propias de la profesional (REQ-TUT-09), con su historia: plantillas
// con versiones, alimentos propios (uno corregido y uno retirado), medidas caseras, recetas, habituales y vistas guardadas.
// Solo datos: la carga los crea por la API, como lo haría ella desde el website.
import { EJ, rx } from './personas.mjs';

const cuerpoCompleto = (rango, rir) => [
  { id: 'cuerpo-a', label: 'Cuerpo completo A', rx: [rx(EJ.sentadilla, 3, rango, rir, { calent: 2, descanso: 120 }), rx(EJ.banca, 3, rango, rir, { calent: 2, descanso: 120 }), rx(EJ.remoPolea, 3, rango, rir, { descanso: 90 })] },
  { id: 'cuerpo-b', label: 'Cuerpo completo B', rx: [rx(EJ.pesoMuerto, 3, [8, 10], rir, { calent: 2, descanso: 150 }), rx(EJ.militar, 3, rango, rir, { calent: 1, descanso: 120 }), rx(EJ.jalon, 3, rango, rir, { descanso: 90 })] },
];
const torsoPierna = (accesorio) => [
  { id: 'pierna', label: 'Pierna', rx: [rx(EJ.sentadilla, 4, [6, 8], 2, { calent: 3, descanso: 180 }), rx(EJ.rumano, 3, accesorio, 2, { descanso: 150 }), rx(EJ.prensa, 3, accesorio, 2, { descanso: 120 })] },
  {
    id: 'torso',
    label: 'Torso',
    bloques: [{ groupId: 'brazos', label: 'Brazos', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }],
    rx: [rx(EJ.banca, 4, [6, 8], 2, { calent: 3, descanso: 180 }), rx(EJ.remo, 4, [6, 8], 2, { descanso: 150 }), rx(EJ.curl, 3, [10, 12], 2, { bloque: 'brazos', descanso: 0 }), rx(EJ.triceps, 3, [10, 12], 2, { bloque: 'brazos', descanso: 0 })],
  },
];
const fuerza = (rir) => [
  { id: 'fuerza-a', label: 'Fuerza A', rx: [rx(EJ.sentadilla, 4, [4, 6], rir, { calent: 3, descanso: 210 }), rx(EJ.banca, 4, [4, 6], rir, { calent: 3, descanso: 210 })] },
  { id: 'fuerza-b', label: 'Fuerza B', rx: [rx(EJ.pesoMuerto, 4, [4, 5], rir, { calent: 3, descanso: 240 }), rx(EJ.militar, 4, [4, 6], rir, { calent: 2, descanso: 180 })] },
];
const equilibrio = (series) => [
  { id: 'dia-1', label: 'Día 1', rx: [rx(EJ.prensa, series, [10, 12], 3, { descanso: 120 }), rx(EJ.pechoMaquina, series, [10, 12], 3, { descanso: 90 }), rx(EJ.remoPolea, series, [10, 12], 3, { descanso: 90 })] },
  { id: 'dia-2', label: 'Día 2', rx: [rx(EJ.goblet, series, [10, 12], 3, { descanso: 90 }), rx(EJ.jalon, series, [10, 12], 3, { descanso: 90 }), rx(EJ.birdDog, 2, [8, 10], 3, { descanso: 45, porLado: true })] },
];

export const HERRAMIENTAS = {
  plantillasDeEntrenamiento: {
    fullBody: { nombre: 'Full body inicial', descripcion: 'Dos sesiones de cuerpo completo para empezar.', versiones: [{ semanasAtras: 60, sesiones: cuerpoCompleto([10, 12], 3) }, { semanasAtras: 33, sesiones: cuerpoCompleto([8, 10], 3) }] },
    torsoPierna: { nombre: 'Torso y pierna · 4 días', descripcion: 'Cuatro días, con un bloque de brazos en vueltas.', versiones: [{ semanasAtras: 56, sesiones: torsoPierna([8, 10]) }, { semanasAtras: 41, sesiones: torsoPierna([10, 12]) }] },
    fuerzaConDescarga: { nombre: 'Fuerza con descarga', descripcion: 'Seis semanas de fuerza en los básicos.', versiones: [{ semanasAtras: 48, sesiones: fuerza(2) }, { semanasAtras: 20, sesiones: fuerza(1) }, { semanasAtras: 8, sesiones: fuerza(1) }] },
    fuerzaEquilibrio: { nombre: 'Fuerza y equilibrio · +55', descripcion: 'Máquinas y mancuernas, con cargas bajas.', versiones: [{ semanasAtras: 40, sesiones: equilibrio(3) }, { semanasAtras: 30, sesiones: equilibrio(2) }] },
  },
  plantillasNutricionales: {
    mantenimiento: { nombre: 'Mantenimiento con días de entrenamiento', dieta: 'comun', kcal: 2300, versiones: 2 },
    vegetariana: { nombre: 'Vegetariana · descenso gradual', dieta: 'vegetariana', kcal: 1700, versiones: 1 },
  },
  /** Preparaciones caseras, sin marca (R-NUT-06), por 100 g. Una corregida (versión nueva) y una retirada. */
  alimentosPropios: [
    { clave: 'granola', nombre: 'Granola casera de avena y miel', kcal: 452, p: 11, c: 62, g: 17, f: 7, corregido: { kcal: 438, p: 11, c: 60, g: 16, f: 7 } },
    { clave: 'tarta', nombre: 'Tarta de acelga casera', kcal: 214, p: 9, c: 18, g: 12, f: 2.5 },
    { clave: 'milanesaSoja', nombre: 'Milanesa de soja casera', kcal: 238, p: 17, c: 20, g: 10, f: 5 },
    { clave: 'hummus', nombre: 'Hummus casero', kcal: 177, p: 8, c: 14, g: 10, f: 6 },
    { clave: 'budin', nombre: 'Budín de avena y banana casero', kcal: 268, p: 7, c: 41, g: 8, f: 4 },
    { clave: 'guiso', nombre: 'Guiso de lentejas casero', kcal: 118, p: 7, c: 16, g: 3, f: 4 },
    { clave: 'panqueques', nombre: 'Panqueques de avena caseros', kcal: 196, p: 9, c: 26, g: 6, f: 3 },
    { clave: 'yogurFrutas', nombre: 'Yogur con frutas casero', kcal: 82, p: 4, c: 13, g: 1.5, f: 1 },
    { clave: 'barritas', nombre: 'Barritas de cereal caseras', kcal: 402, p: 8, c: 64, g: 13, f: 5, retirado: true },
  ],
  /** Las medidas caseras de los alimentos de uso diario, con su equivalencia en gramos. */
  medidasCaseras: [
    ['arroz', '1 taza de arroz cocido', 160],
    ['fideos', '1 taza de fideos cocidos', 140],
    ['avena', '1 cucharada sopera de avena', 10],
    ['leche', '1 taza de leche', 240],
    ['yogur', '1 pote de yogur', 190],
    ['queso', '1 feta de queso', 20],
    ['panFrances', '1 pan francés', 60],
    ['panIntegral', '1 rebanada de pan integral', 30],
    ['huevo', '1 huevo', 50],
    ['banana', '1 banana mediana', 120],
    ['manzana', '1 manzana mediana', 150],
    ['aceite', '1 cucharada sopera de aceite', 13],
    ['papa', '1 papa mediana', 170],
  ],
  recetas: [
    'Tarta de acelga y ricota',
    'Guiso de lentejas con zapallo',
    'Milanesas de berenjena al horno',
    'Ensalada de quinoa y garbanzos',
    'Pollo al horno con batatas',
    'Budín de avena y banana',
    'Wok de tofu y verduras',
    'Fideos integrales con brócoli',
    'Merluza al horno con papas',
    'Omelette de espinaca',
    'Pastel de papa y lentejas',
  ],
  comidasHabituales: ['Desayuno con avena', 'Colación después de entrenar', 'Almuerzo de oficina', 'Cena liviana', 'Merienda con yogur'],
  sesionesHabituales: [
    { nombre: 'Core y movilidad', ejercicios: [EJ.plancha, EJ.birdDog, EJ.pallof] },
    { nombre: 'Entrada en calor general', ejercicios: [EJ.caminata, EJ.goblet] },
    { nombre: 'Accesorios de tren superior', ejercicios: [EJ.curl, EJ.triceps, EJ.laterales], enVueltas: true },
  ],
  ejerciciosHabituales: [EJ.sentadilla, EJ.banca, EJ.pesoMuerto, EJ.militar, EJ.remo, EJ.rumano, EJ.hipThrust, EJ.jalon, EJ.remoPolea, EJ.prensa, EJ.goblet, EJ.zancadas, EJ.curl, EJ.triceps],
  vistasDeAnalizar: ['Fuerza de los básicos', 'Peso y cintura', 'Energía y peso por etapa', 'Proteína por semana'],
  enfoques: ['Foco en fuerza', 'Composición corporal', 'Vuelta al entrenamiento'],
};
