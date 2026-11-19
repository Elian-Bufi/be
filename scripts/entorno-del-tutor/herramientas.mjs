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
  /**
   * Las medidas caseras (NUA-08): en BE van en los alimentos propios de la profesional, con su equivalencia en gramos
   * (una de cada tipo por alimento). 13 en total.
   */
  medidasCaseras: {
    granola: [['CUP', 100], ['TABLESPOON', 10]],
    tarta: [['PORTION', 180]],
    milanesaSoja: [['UNIT', 110]],
    hummus: [['TABLESPOON', 20], ['PORTION', 60]],
    budin: [['PORTION', 60]],
    guiso: [['CUP', 250], ['PORTION', 350]],
    panqueques: [['UNIT', 55]],
    yogurFrutas: [['CUP', 200], ['UNIT', 160]],
    barritas: [['UNIT', 30]],
  },
  /** Las recetas: platos de casa, con sus ingredientes (alimentos del catálogo base) y sus porciones. */
  recetas: [
    ['Tarta de acelga y ricota', 4, [['acelga', 600], ['ricota', 250], ['huevo', 150], ['panFrances', 200], ['queso', 80]], ['Hervir la acelga y escurrir.', 'Mezclar con la ricota, los huevos y el queso.', 'Hornear 35 minutos.']],
    ['Guiso de lentejas con zapallo', 4, [['lentejas', 300], ['zapallo', 500], ['zanahoria', 200], ['papa', 400], ['aceite', 20]], ['Rehogar las verduras.', 'Sumar las lentejas remojadas y cocinar 40 minutos.']],
    ['Ensalada de quinoa y garbanzos', 2, [['quinoa', 300], ['garbanzos', 240], ['tomate', 200], ['lechuga', 100], ['aceite', 15]], ['Mezclar todo en frío.']],
    ['Pollo al horno con batatas', 2, [['pollo', 360], ['batata', 500], ['aceite', 15]], ['Hornear el pollo con las batatas en cubos, 40 minutos.']],
    ['Budín de avena y banana', 8, [['avena', 250], ['banana', 360], ['huevo', 150], ['leche', 200], ['miel', 40]], ['Pisar las bananas y mezclar.', 'Hornear 45 minutos.']],
    ['Wok de tofu y verduras', 2, [['tofu', 300], ['brocoli', 300], ['zanahoria', 150], ['arroz', 300], ['aceite', 15]], ['Saltear el tofu y las verduras a fuego fuerte.', 'Servir con el arroz.']],
    ['Fideos con brócoli', 2, [['fideos', 400], ['brocoli', 300], ['queso', 40], ['aceite', 15]], ['Hervir los fideos con el brócoli.', 'Terminar con aceite y queso.']],
    ['Merluza al horno con papas', 2, [['merluza', 360], ['papa', 500], ['aceite', 15]], ['Hornear la merluza sobre las papas en rodajas, 25 minutos.']],
    ['Omelette de espinaca', 1, [['huevo', 150], ['espinaca', 150], ['queso', 30], ['aceite', 5]], ['Batir los huevos, sumar la espinaca y cocinar a fuego bajo.']],
    ['Pastel de papa y lentejas', 4, [['papa', 800], ['lentejas', 200], ['leche', 150], ['queso', 60]], ['Hacer el puré.', 'Cocinar las lentejas con la cebolla.', 'Armar y gratinar.']],
    ['Yogur con avena y frutillas', 1, [['yogur', 200], ['avena', 30], ['frutillas', 120]], ['Mezclar y servir frío.']],
  ],
  /** Las comidas habituales: una opción con sus cantidades de referencia. */
  comidasHabituales: [
    ['Desayuno con avena', 'Desayuno', [['avena', 50], ['leche', 250], ['banana', 100]]],
    ['Colación después de entrenar', 'Colación', [['yogurGriego', 200], ['banana', 120]]],
    ['Almuerzo de oficina', 'Almuerzo', [['pollo', 150], ['arroz', 180], ['tomate', 100], ['aceite', 10]]],
    ['Cena liviana', 'Cena', [['huevo', 100], ['espinaca', 150], ['papa', 150], ['aceite', 5]]],
    ['Merienda con yogur', 'Merienda', [['yogur', 200], ['manzana', 150]]],
  ],
  sesionesHabituales: [
    { nombre: 'Core y movilidad', sesion: { id: 'core', label: 'Core y movilidad', rx: [rx(EJ.plancha, 3, null, null, { segundos: 30, descanso: 45 }), rx(EJ.birdDog, 3, [8, 10], 2, { descanso: 45, porLado: true }), rx(EJ.pallof, 3, [10, 12], 2, { descanso: 45, porLado: true })] } },
    { nombre: 'Entrada en calor general', sesion: { id: 'calor', label: 'Entrada en calor general', rx: [rx(EJ.caminata, 1, null, null, { minutos: 10, descanso: 0 }), rx(EJ.goblet, 2, [10, 12], 4, { descanso: 60 })] } },
    { nombre: 'Accesorios de tren superior', sesion: { id: 'accesorios', label: 'Accesorios de tren superior', bloques: [{ groupId: 'vueltas', label: 'En vueltas', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }], rx: [rx(EJ.curl, 3, [10, 12], 2, { bloque: 'vueltas', descanso: 0 }), rx(EJ.triceps, 3, [10, 12], 2, { bloque: 'vueltas', descanso: 0 }), rx(EJ.laterales, 3, [12, 15], 2, { bloque: 'vueltas', descanso: 0 })] } },
  ],
  ejerciciosHabituales: [EJ.sentadilla, EJ.banca, EJ.pesoMuerto, EJ.militar, EJ.remo, EJ.rumano, EJ.hipThrust, EJ.jalon, EJ.remoPolea, EJ.prensa, EJ.goblet, EJ.zancadas, EJ.curl, EJ.triceps],
  /** Las recetas que el plan usa como opción (REQ-TUT-34): la opción de la última versión del plan de cada persona. */
  recetasEnElPlan: { tomas: ['Almuerzo', 0], carolina: ['Almuerzo', 0], valeria: ['Cena', 1] },
  vistasDeAnalizar: ['Fuerza de los básicos', 'Peso y cintura', 'Energía y peso por etapa', 'Proteína por semana'],
  enfoques: ['Foco en fuerza', 'Composición corporal', 'Vuelta al entrenamiento'],
};
