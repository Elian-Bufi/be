// WP-ENTORNO-DEL-TUTOR (DL-184) · quiénes son. La profesional de demostración, sus dos colegas mínimas y las quince
// personas de su cartera: cinco en profundidad (Tomás, Valeria, Gustavo, Carolina y Silvia) y diez livianas (decisión de
// Elián del 19 de noviembre). Todas son ficticias. Cada nombre lleva la inicial del apellido, como distinción (TUT-D02).
//
// Todo se define relativo al día en que se arma la muestra: semanas desde el inicio de cada persona, nunca fechas fijas
// (REQ-TUT-63). La historia día por día la arma `historia.mjs` con azar reproducible (REQ-TUT-61).

export const SEMILLA = 'BE-TUTOR-v1';

/** La marca de todo lo que escribe el generador (REQ-TUT-43): la procedencia de cada fila y el dominio de los correos. */
export const OPERACION = 'SIEMBRA-TUTOR';
export const CASO_DE_USO = 'DATOS-SINTETICOS';
export const DOMINIO_DE_CORREO = 'example.invalid';

/** Ejercicios del catálogo base, por su nombre exacto (REQ-TUT-30). */
export const EJ = {
  sentadilla: 'Sentadilla trasera con barra',
  frontal: 'Sentadilla frontal con barra',
  banca: 'Press de banca plano con barra',
  pesoMuerto: 'Peso muerto convencional',
  militar: 'Press de hombros con barra',
  remo: 'Remo inclinado con barra, agarre prono',
  rumano: 'Peso muerto rumano con barra',
  hipThrust: 'Hip thrust con barra',
  bancaMancuernas: 'Press de banca con mancuernas',
  inclinadoMancuernas: 'Press inclinado con mancuernas',
  remoMancuerna: 'Remo con mancuerna a un brazo',
  jalon: 'Jalón al pecho',
  remoPolea: 'Remo sentado en polea baja',
  prensa: 'Prensa de piernas',
  extension: 'Extensión de cuádriceps en máquina',
  femoral: 'Curl femoral sentado',
  goblet: 'Sentadilla goblet con mancuerna',
  zancadas: 'Zancadas con mancuernas',
  laterales: 'Elevaciones laterales con mancuernas',
  hombrosMancuernas: 'Press de hombros con mancuernas',
  curl: 'Curl de bíceps con mancuernas',
  triceps: 'Extensión de tríceps en polea con soga',
  facePull: 'Face pull en polea',
  talones: 'Elevación de talones de pie',
  pechoMaquina: 'Press de pecho en máquina',
  plancha: 'Plancha sobre antebrazos',
  birdDog: 'Bird dog',
  puente: 'Puente de glúteos',
  pallof: 'Press Pallof',
  caminata: 'Caminata',
};

/** Una prescripción: ejercicio, series, rango de repeticiones [mín, máx], RIR indicado y extras (calentamiento, descanso, bloque). */
export const rx = (ej, series, reps, rir, extra = {}) => ({ ej, series, reps, rir, descanso: extra.descanso ?? 120, ...extra });

// ─── La profesional y sus colegas ──────────────────────────────────────────────────────────────────────────────

/**
 * La Lic. Julieta Arce (REQ-TUT-06): licenciada en Nutrición, profesora de Educación Física y antropometrista, con las
 * tres áreas. 14 meses de uso (REQ-TUT-08). La matrícula es un valor que no puede existir (REQ-TUT-07).
 */
export const PROFESIONAL = {
  clave: 'julieta',
  nombre: 'Lic. Julieta Arce',
  correo: 'julieta.arce',
  matricula: 'MN 0000 · DEMO',
  semanas: 70,
  alcances: [
    ['NUTRICION', 'SANITARIO'],
    ['ENTRENAMIENTO', 'NO_SANITARIO'],
    ['ANTROPOMETRIA', 'SANITARIO'],
  ],
};

/** Las otras dos profesionales, ficticias y mínimas (REQ-TUT-26): solo lo necesario para compartir y la historia anterior. */
export const COLEGAS = {
  nutricionista: { clave: 'natalia', nombre: 'Lic. Natalia Y.', correo: 'natalia.y', alcances: [['NUTRICION', 'SANITARIO']] },
  entrenadorAnterior: { clave: 'esteban', nombre: 'Prof. Esteban I.', correo: 'esteban.i', alcances: [['ENTRENAMIENTO', 'NO_SANITARIO']] },
};

// ─── Comidas tipo (casa argentina, sin marcas; R-NUT-06) ──────────────────────────────────────────────────────

/** Opciones por comida: [rótulo, [[alimento, gramos], …]]. Las de `vegetariana` no tienen carne ni pescado. */
const COMIDAS = {
  comun: {
    Desayuno: [
      ['Avena con leche y banana', [['avena', 50], ['leche', 250], ['banana', 100]]],
      ['Tostadas con queso y fruta', [['panIntegral', 70], ['queso', 30], ['naranja', 150]]],
      ['Yogur con granola', [['yogurGriego', 200], ['granola', 40], ['frutillas', 100]]],
    ],
    Almuerzo: [
      ['Pollo con arroz y ensalada', [['pollo', 150], ['arroz', 180], ['lechuga', 60], ['tomate', 100], ['aceite', 10]]],
      ['Carne con papas y zapallo', [['cuadril', 150], ['papa', 200], ['zapallo', 150], ['aceite', 8]]],
      ['Fideos con atún y brócoli', [['fideos', 200], ['atun', 100], ['brocoli', 100], ['aceite', 10]]],
    ],
    Merienda: [
      ['Yogur con fruta', [['yogur', 200], ['manzana', 150]]],
      ['Tostadas con ricota y miel', [['panFrances', 60], ['ricota', 50], ['miel', 10]]],
    ],
    Cena: [
      ['Merluza con batata y verduras', [['merluza', 180], ['batata', 200], ['acelga', 150], ['aceite', 10]]],
      ['Tarta de verdura y ensalada', [['huevo', 100], ['acelga', 200], ['panFrances', 60], ['tomate', 100], ['queso', 30]]],
      ['Nalga a la parrilla con ensalada y arroz', [['nalga', 150], ['arroz', 150], ['lechuga', 60], ['zanahoria', 80], ['aceite', 8]]],
    ],
    Colación: [
      ['Fruta y frutos secos', [['banana', 120], ['almendras', 20]]],
      ['Yogur', [['yogur', 200]]],
    ],
  },
  vegetariana: {
    Desayuno: [
      ['Avena con leche y banana', [['avena', 40], ['leche', 250], ['banana', 100]]],
      ['Yogur griego con granola', [['yogurGriego', 200], ['granola', 30], ['frutillas', 80]]],
      ['Tostadas con ricota y fruta', [['panIntegral', 70], ['ricota', 60], ['naranja', 150]]],
    ],
    Almuerzo: [
      ['Lentejas guisadas con arroz', [['lentejas', 45], ['arroz', 170], ['zanahoria', 60], ['huevo', 50], ['aceite', 8]]],
      ['Tofu salteado con arroz', [['tofu', 150], ['arroz', 180], ['brocoli', 80], ['aceite', 10]]],
      ['Tarta de acelga y huevo', [['huevo', 100], ['acelga', 200], ['panFrances', 60], ['queso', 40]]],
    ],
    Merienda: [
      ['Yogur con fruta y nueces', [['yogur', 200], ['manzana', 150], ['nueces', 10]]],
      ['Tostadas con queso', [['panIntegral', 60], ['queso', 30]]],
    ],
    Cena: [
      ['Garbanzos con quinoa', [['garbanzos', 110], ['quinoa', 150], ['espinaca', 80], ['queso', 20], ['aceite', 8]]],
      ['Omelette de espinaca con papa', [['huevo', 150], ['espinaca', 150], ['papa', 200], ['aceite', 8]]],
      ['Tofu con batata y tomate', [['tofu', 150], ['batata', 180], ['tomate', 100], ['aceite', 8]]],
    ],
    Colación: [
      ['Fruta y queso', [['mandarina', 150], ['queso', 25]]],
      ['Yogur griego', [['yogurGriego', 170]]],
    ],
  },
};

/** Las comidas del día de un plan, con los horarios que declaró la persona (R-NUT-07). */
export const HORARIO_DE_COMIDAS = {
  Desayuno: [390, 570],
  Colación: [600, 690],
  Almuerzo: [720, 870],
  Merienda: [960, 1080],
  Cena: [1200, 1350],
};

/** Lo que la persona come fuera del plan (R-NUT-05): [descripción, cantidad aproximada o null, lleva carne]. */
export const DIFERENTES = {
  comun: [
    ['Asado con la familia: vacío, chorizo y ensalada', 'Un plato abundante', true],
    ['Pizza casera de muzzarella', '3 porciones', false],
    ['Empanadas de carne', '3 empanadas', true],
    ['Milanesa con puré', 'Una milanesa grande', true],
    ['Hamburguesa casera con papas', null, true],
    ['Pastas con salsa en la casa de mi mamá', 'Un plato hondo', false],
    ['Sándwich de miga en un cumpleaños', null, true],
    ['Helado', '1/4 kg compartido', false],
  ],
  vegetariana: [
    ['Pizza casera de muzzarella', '3 porciones', false],
    ['Empanadas de verdura y de humita', '3 empanadas', false],
    ['Ñoquis con salsa de tomate', 'Un plato hondo', false],
    ['Sushi vegetariano', '10 piezas', false],
    ['Helado', '1/4 kg compartido', false],
    ['Tarta de calabaza en un cumpleaños', null, false],
    ['Hamburguesa de lentejas con papas', null, false],
  ],
};

export const comidasDe = (dieta) => COMIDAS[dieta];

// ─── Las cinco en profundidad ─────────────────────────────────────────────────────────────────────────────────

const L = 'J'; // la Lic. Julieta Arce

/** Las sesiones del plan de Tomás, según la fase. */
const tomas = {
  adaptacion: [
    { id: 'cuerpo-a', label: 'Cuerpo completo A', rx: [rx(EJ.sentadilla, 3, [10, 12], 3, { calent: 2, descanso: 120 }), rx(EJ.banca, 3, [10, 12], 3, { calent: 2, descanso: 120 }), rx(EJ.remoPolea, 3, [10, 12], 3, { descanso: 90 }), rx(EJ.plancha, 3, null, null, { segundos: 30, descanso: 60 })] },
    { id: 'cuerpo-b', label: 'Cuerpo completo B', rx: [rx(EJ.pesoMuerto, 3, [8, 10], 3, { calent: 2, descanso: 150 }), rx(EJ.militar, 3, [10, 12], 3, { calent: 1, descanso: 120 }), rx(EJ.jalon, 3, [10, 12], 3, { descanso: 90 }), rx(EJ.zancadas, 2, [10, 12], 3, { descanso: 90, porLado: true })] },
  ],
  hipertrofia: (rangoBarra, rangoAccesorio, rir = 2) => [
    { id: 'pierna-a', label: 'Pierna A', rx: [rx(EJ.sentadilla, 4, rangoBarra, rir, { calent: 3, descanso: 180 }), rx(EJ.rumano, 3, rangoAccesorio, rir, { calent: 1, descanso: 150 }), rx(EJ.prensa, 3, rangoAccesorio, rir, { descanso: 120 }), rx(EJ.talones, 3, [12, 15], rir, { descanso: 60 })] },
    {
      id: 'torso-a',
      label: 'Torso A',
      bloques: [{ groupId: 'brazos-a', label: 'Brazos', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }],
      rx: [rx(EJ.banca, 4, rangoBarra, rir, { calent: 3, descanso: 180 }), rx(EJ.remo, 4, rangoBarra, rir, { calent: 1, descanso: 150 }), rx(EJ.inclinadoMancuernas, 3, rangoAccesorio, rir, { descanso: 90 }), rx(EJ.curl, 3, [10, 12], rir, { bloque: 'brazos-a', descanso: 0 }), rx(EJ.triceps, 3, [10, 12], rir, { bloque: 'brazos-a', descanso: 0 })],
    },
    { id: 'pierna-b', label: 'Pierna B', rx: [rx(EJ.pesoMuerto, 3, [5, 6], rir, { calent: 3, descanso: 210 }), rx(EJ.zancadas, 3, rangoAccesorio, rir, { descanso: 90, porLado: true }), rx(EJ.femoral, 3, rangoAccesorio, rir, { descanso: 75 })] },
    {
      id: 'torso-b',
      label: 'Torso B',
      bloques: [{ groupId: 'brazos-b', label: 'Brazos', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 90 }],
      rx: [rx(EJ.militar, 4, rangoBarra, rir, { calent: 2, descanso: 150 }), rx(EJ.jalon, 4, rangoAccesorio, rir, { descanso: 90 }), rx(EJ.laterales, 3, [12, 15], rir, { descanso: 60 }), rx(EJ.curl, 3, [10, 12], rir, { bloque: 'brazos-b', descanso: 0 }), rx(EJ.triceps, 3, [10, 12], rir, { bloque: 'brazos-b', descanso: 0 })],
    },
  ],
  fuerza: (rango, rir) => [
    { id: 'pierna-a', label: 'Pierna A', rx: [rx(EJ.sentadilla, 4, rango, rir, { calent: 3, descanso: 210 }), rx(EJ.rumano, 3, [6, 8], 2, { calent: 1, descanso: 150 }), rx(EJ.talones, 3, [10, 12], 2, { descanso: 60 })] },
    { id: 'torso-a', label: 'Torso A', rx: [rx(EJ.banca, 4, rango, rir, { calent: 3, descanso: 210 }), rx(EJ.remo, 4, [5, 6], rir, { calent: 1, descanso: 150 }), rx(EJ.facePull, 3, [12, 15], 2, { descanso: 60 })] },
    { id: 'pierna-b', label: 'Pierna B', rx: [rx(EJ.pesoMuerto, 4, [4, 5], rir, { calent: 3, descanso: 240 }), rx(EJ.zancadas, 3, [8, 10], 2, { descanso: 90, porLado: true })] },
    { id: 'torso-b', label: 'Torso B', rx: [rx(EJ.militar, 4, rango, rir, { calent: 2, descanso: 180 }), rx(EJ.jalon, 3, [6, 8], 2, { descanso: 90 }), rx(EJ.laterales, 3, [12, 15], 2, { descanso: 60 })] },
  ],
};

const valeria = {
  base: (rango, rir) => [
    { id: 'inferior-a', label: 'Inferior A', rx: [rx(EJ.sentadilla, 4, rango, rir, { calent: 2, descanso: 180 }), rx(EJ.hipThrust, 3, [8, 10], 2, { calent: 1, descanso: 120 }), rx(EJ.femoral, 3, [10, 12], 2, { descanso: 75 })] },
    { id: 'superior-a', label: 'Superior A', rx: [rx(EJ.banca, 4, rango, rir, { calent: 2, descanso: 180 }), rx(EJ.remo, 4, [6, 8], 2, { calent: 1, descanso: 150 }), rx(EJ.laterales, 3, [12, 15], 2, { descanso: 60 })] },
    { id: 'inferior-b', label: 'Inferior B', rx: [rx(EJ.pesoMuerto, 3, [5, 6], rir, { calent: 2, descanso: 210 }), rx(EJ.zancadas, 3, [8, 10], 2, { descanso: 90, porLado: true }), rx(EJ.pallof, 3, [10, 12], 2, { descanso: 60, porLado: true })] },
    {
      id: 'superior-b',
      label: 'Superior B',
      bloques: [{ groupId: 'accesorios', label: 'Accesorios de torso', kind: 'ROUNDS', rounds: 3, restAfterRoundSeconds: 75 }],
      rx: [rx(EJ.militar, 4, rango, rir, { calent: 2, descanso: 150 }), rx(EJ.jalon, 3, [8, 10], 2, { descanso: 90 }), rx(EJ.facePull, 3, [12, 15], 2, { bloque: 'accesorios', descanso: 0 }), rx(EJ.curl, 3, [10, 12], 2, { bloque: 'accesorios', descanso: 0 })],
    },
  ],
};

const gustavo = {
  base: (rango, rir) => [
    { id: 'dia-a', label: 'Día A', rx: [rx(EJ.sentadilla, 3, rango, rir, { calent: 2, descanso: 150 }), rx(EJ.bancaMancuernas, 3, [8, 10], rir, { descanso: 90 }), rx(EJ.remoPolea, 3, [10, 12], rir, { descanso: 90 }), rx(EJ.birdDog, 2, [8, 10], 2, { descanso: 45, porLado: true })] },
    { id: 'dia-b', label: 'Día B', rx: [rx(EJ.rumano, 3, rango, rir, { calent: 2, descanso: 150 }), rx(EJ.hombrosMancuernas, 3, [8, 10], rir, { descanso: 90 }), rx(EJ.jalon, 3, [10, 12], rir, { descanso: 90 }), rx(EJ.plancha, 3, null, null, { segundos: 30, descanso: 45 })] },
  ],
};

const carolina = {
  base: (rango, rir) => [
    { id: 'dia-1', label: 'Día 1', rx: [rx(EJ.sentadilla, 3, rango, rir, { calent: 2, descanso: 150 }), rx(EJ.bancaMancuernas, 3, [8, 10], 2, { descanso: 90 }), rx(EJ.remoMancuerna, 3, [8, 10], 2, { descanso: 75, porLado: true }), rx(EJ.plancha, 3, null, null, { segundos: 35, descanso: 45 })] },
    { id: 'dia-2', label: 'Día 2', rx: [rx(EJ.hipThrust, 3, rango, rir, { calent: 1, descanso: 120 }), rx(EJ.hombrosMancuernas, 3, [8, 10], 2, { descanso: 90 }), rx(EJ.jalon, 3, [10, 12], 2, { descanso: 75 }), rx(EJ.zancadas, 2, [10, 12], 2, { descanso: 75, porLado: true })] },
    { id: 'dia-3', label: 'Día 3', rx: [rx(EJ.rumano, 3, rango, rir, { calent: 2, descanso: 150 }), rx(EJ.goblet, 3, [10, 12], 2, { descanso: 90 }), rx(EJ.remoPolea, 3, [10, 12], 2, { descanso: 75 }), rx(EJ.laterales, 2, [12, 15], 2, { descanso: 60 })] },
  ],
};

const silvia = {
  plan1: [
    { id: 'dia-1', label: 'Día 1', rx: [rx(EJ.prensa, 3, [10, 12], 3, { descanso: 120 }), rx(EJ.pechoMaquina, 3, [10, 12], 3, { descanso: 90 }), rx(EJ.remoPolea, 3, [10, 12], 3, { descanso: 90 }), rx(EJ.puente, 2, [10, 12], 3, { descanso: 60 })] },
    { id: 'dia-2', label: 'Día 2', rx: [rx(EJ.goblet, 3, [10, 12], 3, { descanso: 90 }), rx(EJ.hombrosMancuernas, 3, [10, 12], 3, { descanso: 90 }), rx(EJ.jalon, 3, [10, 12], 3, { descanso: 90 }), rx(EJ.birdDog, 2, [8, 10], 3, { descanso: 45, porLado: true })] },
  ],
};

/**
 * Cada persona en profundidad. `semanas`: cuánto hace que está con Julieta. Las versiones (`trn`, `nut`) empiezan en una
 * semana de su historia; `fuerza` es la capacidad real (el 1RM) de cada ejercicio, semana a semana, de la que salen las
 * cargas con el RIR (R-TRN-04); `ant` son las curvas de las tomas. `pausas` son las semanas sin registrar, con su motivo.
 */
export const PROFUNDAS = [
  {
    clave: 'tomas',
    nombre: 'Tomás M.',
    sexo: 'H',
    edad: 31,
    talla: 178,
    ocupacion: 'Analista de sistemas',
    semanas: 61,
    experiencia: 'NOVATO',
    actividad: 1.725,
    horario: [19 * 60, 20 * 60 + 30],
    sustitucion: { semana: 24, de: EJ.remo, a: EJ.remoMancuerna },
    rareza: { semana: 33 },
    dieta: 'comun',
    areas: { NUTRICION: L, ENTRENAMIENTO: L, ANTROPOMETRIA: L },
    lesiones: 'Ninguna.',
    medicacion: 'Ninguna.',
    objetivoPersonal: 'Ganar fuerza y algo de masa muscular; nunca entrené en serio.',
    trn: [
      { semana: 0, nombre: 'Adaptación', proposito: 'Técnica de los básicos y el hábito de venir tres días', dias: [0, 2, 4], sesiones: tomas.adaptacion, plantilla: ['fullBody', 1] },
      { semana: 6, nombre: 'Hipertrofia', proposito: 'Torso y pierna, cuatro días', dias: [0, 1, 3, 4], sesiones: tomas.hipertrofia([6, 8], [8, 10]), plantilla: ['torsoPierna', 1] },
      { semana: 14, nombre: 'Fuerza', proposito: 'Menos repeticiones y más carga en los básicos', dias: [0, 1, 3, 4], sesiones: tomas.fuerza([5, 6], 2) },
      { semana: 20, nombre: 'Descarga', proposito: 'Una semana con menos carga y menos series', dias: [0, 1, 3, 4], sesiones: tomas.fuerza([5, 6], 4).map((s) => ({ ...s, rx: s.rx.map((x) => ({ ...x, series: Math.max(2, x.series - 1) })) })), descarga: 0.85 },
      { semana: 21, nombre: 'Hipertrofia 2', proposito: 'Volver al volumen con otros rangos', dias: [0, 1, 3, 4], sesiones: tomas.hipertrofia([6, 8], [10, 12]), plantilla: ['torsoPierna', 2] },
      { semana: 39, nombre: 'Hipertrofia 3', proposito: 'Más volumen de espalda y de pierna', dias: [0, 1, 3, 4], sesiones: tomas.hipertrofia([6, 8], [8, 10]) },
      { semana: 55, nombre: 'Fuerza 2', proposito: 'Fase de fuerza de seis semanas, con la descarga al final', dias: [0, 1, 3, 4], sesiones: tomas.fuerza([4, 6], 1), plantilla: ['fuerzaConDescarga', 2] },
    ],
    fuerza: {
      [EJ.sentadilla]: [[0, 80], [9, 89], [13, 93], [61, 117]],
      [EJ.banca]: [[0, 60], [9, 66.5], [13, 69], [61, 81]],
      [EJ.pesoMuerto]: [[0, 100], [9, 111], [13, 115], [61, 142]],
      [EJ.militar]: [[0, 40], [13, 46], [61, 54]],
      [EJ.remo]: [[0, 55], [13, 64], [61, 77]],
      [EJ.rumano]: [[0, 75], [13, 88], [61, 112]],
      [EJ.remoPolea]: [[0, 55], [13, 65], [61, 80]],
      [EJ.jalon]: [[0, 55], [13, 63], [61, 76]],
      [EJ.prensa]: [[0, 140], [13, 170], [61, 230]],
      [EJ.inclinadoMancuernas]: [[0, 20], [13, 24], [61, 30]],
      [EJ.curl]: [[0, 12], [13, 14], [61, 18]],
      [EJ.triceps]: [[0, 25], [13, 30], [61, 38]],
      [EJ.zancadas]: [[0, 16], [13, 20], [61, 28]],
      [EJ.femoral]: [[0, 45], [13, 52], [61, 65]],
      [EJ.talones]: [[0, 80], [13, 95], [61, 120]],
      [EJ.laterales]: [[0, 8], [13, 10], [61, 13]],
      [EJ.facePull]: [[0, 25], [13, 30], [61, 36]],
    },
    nut: [
      { semana: 0, nombre: 'Superávit chico', kcal: 2750, proteina: 1.9, grasa: 0.95, peso: 73.8, dias: 'ENTRENA', razon: 'Primer objetivo: un superávit chico para acompañar el entrenamiento de fuerza.' },
      { semana: 30, nombre: 'Superávit chico · ajuste', kcal: 2850, proteina: 1.9, grasa: 0.95, peso: 76.2, dias: 'ENTRENA', razon: 'Más energía para sostener cuatro días de entrenamiento y el peso estable de las últimas semanas.' },
    ],
    ant: { cada: 5, peso: [[0, 73.8], [30, 76.2], [61, 77.6]], suma6: [[0, 84], [30, 80], [61, 76]], cintura: [[0, 81], [61, 82]], cadera: [[0, 95], [61, 97]], brazoRelajado: [[0, 30], [61, 32.2]], brazoFlex: [[0, 32.5], [61, 35.1]], muslo: [[0, 54], [61, 56.5]], pantorrilla: [[0, 36], [61, 37]], humero: 7.0, femur: 9.9 },
    pausas: [{ semana: 30, dias: 9, motivo: 'Viaje', nota: 'Viaja nueve días por trabajo: retoma el lunes siguiente con las mismas cargas.' }],
    registra: { comidasPorDia: 4, fotos: 0 },
  },
  {
    clave: 'valeria',
    nombre: 'Valeria Q.',
    sexo: 'M',
    edad: 38,
    talla: 164,
    ocupacion: 'Docente',
    semanas: 69,
    experiencia: 'INTERMEDIO',
    actividad: 1.725,
    horario: [18 * 60, 19 * 60 + 30],
    rareza: { semana: 20 },
    dieta: 'comun',
    areas: { NUTRICION: L, ENTRENAMIENTO: L, ANTROPOMETRIA: L },
    lesiones: 'Ninguna actual.',
    medicacion: 'Levotiroxina 75 mcg por hipotiroidismo, estable desde hace años.',
    objetivoPersonal: 'Seguir progresando en fuerza; vengo de otro entrenador.',
    historiaAnterior: { semanas: 43 },
    trn: [
      { semana: 0, nombre: 'Continuidad', proposito: 'Retomar el trabajo del entrenador anterior con cuatro días', dias: [0, 1, 3, 4], sesiones: valeria.base([6, 8], 2) },
      { semana: 14, nombre: 'Más series', proposito: 'Una serie más en los básicos', dias: [0, 1, 3, 4], sesiones: valeria.base([6, 8], 2).map((s) => ({ ...s, rx: s.rx.map((x, i) => (i === 0 ? { ...x, series: 5 } : x)) })) },
      { semana: 30, nombre: 'Fuerza de torso', proposito: 'Más frecuencia de press', dias: [0, 1, 3, 4], sesiones: valeria.base([6, 8], 2) },
      { semana: 50, nombre: 'Descarga', proposito: 'Una semana más liviana después de diez semanas sin cambios en el press', dias: [0, 1, 3, 4], sesiones: valeria.base([6, 8], 4).map((s) => ({ ...s, rx: s.rx.map((x) => ({ ...x, series: Math.max(2, x.series - 1) })) })), descarga: 0.85 },
      { semana: 51, nombre: 'Fuerza 4-6', proposito: 'Otro rango de repeticiones en los básicos', dias: [0, 1, 3, 4], sesiones: valeria.base([4, 6], 2) },
    ],
    meseta: { ejercicio: EJ.banca, desde: 40, hasta: 50, carga: 41.25, reps: 7 },
    fuerza: {
      [EJ.sentadilla]: [[0, 72], [50, 78], [69, 82]],
      [EJ.banca]: [[0, 47], [38, 52], [50, 52], [51, 52], [63, 55.5], [69, 56]],
      [EJ.pesoMuerto]: [[0, 92], [50, 99], [69, 104]],
      [EJ.militar]: [[0, 31], [50, 34], [69, 36]],
      [EJ.remo]: [[0, 45], [50, 49], [69, 52]],
      [EJ.hipThrust]: [[0, 95], [50, 110], [69, 118]],
      [EJ.femoral]: [[0, 32], [69, 38]],
      [EJ.zancadas]: [[0, 12], [69, 16]],
      [EJ.pallof]: [[0, 12], [69, 15]],
      [EJ.laterales]: [[0, 6], [69, 8]],
      [EJ.jalon]: [[0, 42], [69, 48]],
      [EJ.facePull]: [[0, 18], [69, 22]],
      [EJ.curl]: [[0, 9], [69, 11]],
    },
    nut: [
      { semana: 0, nombre: 'Mantenimiento', kcal: 2100, macros: { p: 120, c: 236, g: 75 }, peso: 61.2, dias: 'ENTRENA', razon: 'Sostener el peso con la proteína repartida en cuatro comidas.' },
      { semana: 26, nombre: 'Mantenimiento · horario nuevo', kcal: 2100, macros: { p: 120, c: 236, g: 75 }, peso: 61.4, dias: 'ENTRENA', razon: 'Cambió el horario de la escuela: la merienda pasa a ser antes de entrenar.' },
      { semana: 51, nombre: 'Más carbohidratos', kcal: 2300, macros: { p: 120, c: 297, g: 70 }, peso: 61.3, dias: 'ENTRENA', razon: 'Acompañar la fase nueva de fuerza con más carbohidratos los días de entrenamiento y la misma proteína.' },
    ],
    ant: { cada: 5, peso: [[0, 61.2], [50, 61.4], [51, 61.3], [55.5, 62.1], [69, 62.2]], suma6: [[0, 92], [50, 89], [69, 90]], cintura: [[0, 70], [69, 69.5]], cadera: [[0, 97], [69, 97.5]], brazoRelajado: [[0, 27], [69, 27.6]], brazoFlex: [[0, 28.5], [69, 29.3]], muslo: [[0, 54], [69, 54.5]], pantorrilla: [[0, 35], [69, 35.3]], humero: 6.1, femur: 8.9 },
    pausas: [{ semana: 23, dias: 14, motivo: 'Vacaciones de invierno', nota: 'Vacaciones de invierno: dos semanas sin entrenar en el gimnasio.' }],
    registra: { comidasPorDia: 4, fotos: 0.15 },
  },
  {
    clave: 'gustavo',
    nombre: 'Gustavo P.',
    sexo: 'H',
    edad: 47,
    talla: 174,
    ocupacion: 'Comerciante',
    semanas: 56,
    experiencia: 'NOVATO',
    actividad: 1.375,
    horario: [7 * 60, 8 * 60 + 30],
    dieta: 'comun',
    areas: { NUTRICION: L, ENTRENAMIENTO: L, ANTROPOMETRIA: L },
    lesiones: 'Molestia lumbar vieja, sin tratamiento actual.',
    medicacion: 'Ninguna.',
    objetivoPersonal: 'Bajar la panza y estar más fuerte para el trabajo.',
    trn: [
      { semana: 0, nombre: 'Inicio', proposito: 'Dos días de cuerpo completo, con la espalda cuidada', dias: [1, 3], sesiones: gustavo.base([6, 8], 2) },
      { semana: 9, nombre: 'Base', proposito: 'Tres días y un poco más de carga', dias: [0, 2, 4], sesiones: gustavo.base([6, 8], 2) },
      { semana: 27, nombre: 'Vuelta', proposito: 'Retomar después de la mudanza, con cargas más bajas', dias: [0, 2, 4], sesiones: gustavo.base([6, 8], 2), plantilla: ['fullBody', 2] },
      { semana: 36, nombre: 'Progresión', proposito: 'Volver a subir de a poco', dias: [0, 2, 4], sesiones: gustavo.base([6, 8], 2) },
    ],
    vuelta: { semana: 27, perdida: 0.1, recupera: 7 },
    fuerza: {
      [EJ.sentadilla]: [[0, 62], [13, 72], [17, 75], [27, 67.5], [36, 75], [56, 81]],
      [EJ.rumano]: [[0, 65], [13, 76], [17, 79], [27, 71], [34, 79], [56, 87]],
      [EJ.bancaMancuernas]: [[0, 22], [17, 26], [27, 23.5], [34, 26], [56, 29]],
      [EJ.remoPolea]: [[0, 50], [17, 58], [27, 52], [34, 58], [56, 64]],
      [EJ.hombrosMancuernas]: [[0, 16], [17, 19], [27, 17], [34, 19], [56, 21]],
      [EJ.jalon]: [[0, 50], [17, 57], [27, 51], [34, 57], [56, 63]],
      [EJ.birdDog]: [[0, 0]],
    },
    nut: [
      { semana: 0, nombre: 'Déficit moderado', kcal: 2250, proteina: 1.6, grasa: 0.8, peso: 88.4, dias: 'UNO', razon: 'Bajar de a poco, sin dejar el asado del domingo.' },
      { semana: 27, nombre: 'Plan simplificado', kcal: 2200, proteina: 1.6, grasa: 0.8, peso: 88.6, dias: 'UNO', razon: 'A la vuelta: menos opciones y medidas caseras, para registrar más fácil.', plantilla: ['mantenimiento', 1], medidasCaseras: true },
    ],
    ant: { cada: 4, peso: [[0, 88.4], [17, 85.8], [27, 88.6], [56, 86.4]], suma6: [[0, 132], [17, 121], [27, 131], [56, 122]], cintura: [[0, 100], [17, 97.4], [27, 100], [56, 97.8]], cadera: [[0, 104], [17, 103], [27, 104.5], [56, 103]], brazoRelajado: [[0, 32], [56, 32.4]], brazoFlex: [[0, 33.5], [56, 34.2]], muslo: [[0, 56], [56, 56.4]], pantorrilla: [[0, 38], [56, 38.2]], humero: 7.1, femur: 9.8 },
    pausas: [{ semana: 17, dias: 70, motivo: 'Mudanza', todo: true, nota: 'Se muda por trabajo; retomamos cuando se acomode.' }, { semana: 45, dias: 7, motivo: 'Viaje', nota: 'Una semana de viaje con la familia: no entrena.' }],
    rareza: { semana: 40 },
    registra: { comidasPorDia: 4, fotos: 0, domingoDiferente: true },
  },
  {
    clave: 'carolina',
    nombre: 'Carolina R.',
    sexo: 'M',
    edad: 34,
    talla: 166,
    ocupacion: 'Diseñadora',
    semanas: 52,
    experiencia: 'NOVATO',
    actividad: 1.55,
    horario: [18 * 60 + 30, 20 * 60],
    dieta: 'vegetariana',
    areas: { NUTRICION: L, ENTRENAMIENTO: L, ANTROPOMETRIA: L },
    lesiones: 'Ninguna.',
    medicacion: 'Ninguna.',
    objetivoPersonal: 'Bajar grasa sin perder fuerza. Soy ovolactovegetariana.',
    rareza: { semana: 12 },
    noCome: 'Carne, pollo y pescado (ovolactovegetariana).',
    trn: [
      { semana: 0, nombre: 'Base', proposito: 'Tres días de cuerpo completo', dias: [0, 2, 4], sesiones: carolina.base([8, 10], 2) },
      { semana: 22, nombre: 'Base 2', proposito: 'Un poco más de carga en los básicos durante el segundo déficit', dias: [0, 2, 4], sesiones: carolina.base([6, 8], 2) },
    ],
    fuerza: {
      [EJ.sentadilla]: [[0, 55], [52, 65]],
      [EJ.hipThrust]: [[0, 70], [52, 90]],
      [EJ.rumano]: [[0, 50], [52, 60]],
      [EJ.bancaMancuernas]: [[0, 13], [52, 16]],
      [EJ.remoMancuerna]: [[0, 13], [52, 16]],
      [EJ.hombrosMancuernas]: [[0, 9], [52, 11]],
      [EJ.jalon]: [[0, 35], [52, 41]],
      [EJ.zancadas]: [[0, 8], [52, 11]],
      [EJ.goblet]: [[0, 18], [52, 22]],
      [EJ.remoPolea]: [[0, 32], [52, 38]],
      [EJ.laterales]: [[0, 5], [52, 6]],
    },
    nut: [
      { semana: 0, nombre: 'Déficit 1', kcal: 1650, macros: { p: 130, c: 170, g: 50 }, peso: 71.4, dias: 'UNO', razon: 'Primer déficit: 1650 kcal con la proteína alta, sin carne ni pescado.' },
      { semana: 16, nombre: 'Mantenimiento', kcal: 2050, macros: { p: 125, c: 241, g: 65 }, peso: 66.2, dias: 'UNO', razon: 'La pausa planificada en mantenimiento después del primer déficit.' },
      { semana: 22, nombre: 'Déficit 2', kcal: 1600, macros: { p: 125, c: 167, g: 48 }, peso: 66.6, dias: 'UNO', razon: 'Segundo déficit, más corto: 1600 kcal con la misma proteína.' },
      { semana: 34, nombre: 'Mantenimiento 2', kcal: 1950, macros: { p: 120, c: 228, g: 62 }, peso: 63.4, dias: 'UNO', razon: 'Mantenimiento: sostener lo logrado.' },
    ],
    ant: { cada: 4, peso: [[0, 71.4], [16, 66.2], [22, 66.6], [34, 63.4], [52, 63.6]], suma6: [[0, 148], [16, 122], [22, 121], [34, 104], [52, 101]], cintura: [[0, 84], [16, 78.5], [22, 78.8], [34, 75.3], [52, 74.5]], cadera: [[0, 104], [16, 100.6], [22, 100.8], [34, 98.6], [52, 98.4]], brazoRelajado: [[0, 29.5], [52, 27.6]], brazoFlex: [[0, 30.5], [52, 29]], muslo: [[0, 58], [52, 54.5]], pantorrilla: [[0, 36.5], [52, 35.5]], humero: 6.0, femur: 9.0 },
    pausas: [{ semana: 29, dias: 7, motivo: 'Gripe', nota: 'Estuvo con gripe toda la semana: no entrenó.' }],
    registra: { comidasPorDia: 4, fotos: 0.33 },
  },
  {
    clave: 'silvia',
    nombre: 'Silvia D.',
    sexo: 'M',
    edad: 58,
    talla: 160,
    ocupacion: 'Contadora',
    semanas: 5,
    experiencia: 'NOVATO',
    actividad: 1.375,
    horario: [9 * 60, 10 * 60 + 30],
    dieta: 'comun',
    areas: { ENTRENAMIENTO: L, ANTROPOMETRIA: L, NUTRICION: 'NY' },
    lesiones: 'Osteopenia informada por su médica, que le indicó entrenamiento de fuerza.',
    medicacion: 'Calcio y vitamina D.',
    objetivoPersonal: 'Hacer fuerza por indicación médica.',
    trn: [{ semana: 0, nombre: 'Plan 1', proposito: 'Máquinas y mancuernas, cargas bajas y técnica', dias: [0, 2, 4], sesiones: silvia.plan1, plantilla: ['fuerzaEquilibrio', 1] }],
    borradorTrn: { nombre: 'Plan 2', proposito: 'Sumar un tercer día con equilibrio' },
    fuerza: {
      [EJ.prensa]: [[0, 70], [5, 78]],
      [EJ.pechoMaquina]: [[0, 22], [5, 25]],
      [EJ.remoPolea]: [[0, 25], [5, 28]],
      [EJ.puente]: [[0, 0]],
      [EJ.goblet]: [[0, 12], [5, 14]],
      [EJ.hombrosMancuernas]: [[0, 6], [5, 7]],
      [EJ.jalon]: [[0, 25], [5, 28]],
      [EJ.birdDog]: [[0, 0]],
    },
    nutColega: { kcal: 1700, macros: { p: 80, c: 205, g: 62 }, peso: 64.1 },
    ant: { cada: 99, peso: [[0, 64.1]], suma6: [[0, 118]], cintura: [[0, 82]], cadera: [[0, 101]], brazoRelajado: [[0, 28.5]], brazoFlex: [[0, 29]], muslo: [[0, 53]], pantorrilla: [[0, 34]], humero: 5.9, femur: 8.8 },
    pausas: [{ semana: 2, dias: 7, motivo: 'Gripe', nota: 'Semana con gripe: no vino.' }],
    registra: { comidasPorDia: 0, fotos: 0 },
  },
];

// ─── Las diez livianas (REQ-TUT-27): de 19 a 72 años, mitad mujeres, de 1 a 8 meses ────────────────────────

const simple = (a, b, rango, rir) => [
  { id: 'dia-a', label: 'Día A', rx: [rx(a, 3, rango, rir, { descanso: 120 }), rx(EJ.remoPolea, 3, [10, 12], rir, { descanso: 90 }), rx(EJ.plancha, 2, null, null, { segundos: 30, descanso: 45 })] },
  { id: 'dia-b', label: 'Día B', rx: [rx(b, 3, rango, rir, { descanso: 120 }), rx(EJ.jalon, 3, [10, 12], rir, { descanso: 90 }), rx(EJ.goblet, 3, [10, 12], rir, { descanso: 90 })] },
];

export const LIVIANAS = [
  { clave: 'mariana', nombre: 'Mariana T.', sexo: 'M', edad: 27, talla: 162, semanas: 30, experiencia: 'NOVATO', actividad: 1.55, horario: [7 * 60, 8 * 60 + 30], areas: { ENTRENAMIENTO: L, ANTROPOMETRIA: L }, objetivoPersonal: 'Ganar fuerza para correr mejor.', trn: [{ semana: 0, nombre: 'Base', dias: [1, 3], sesiones: simple(EJ.goblet, EJ.hombrosMancuernas, [10, 12], 2) }, { semana: 16, nombre: 'Base 2', dias: [1, 3], sesiones: simple(EJ.goblet, EJ.hombrosMancuernas, [8, 10], 2) }], fuerza: { [EJ.goblet]: [[0, 16], [30, 22]], [EJ.hombrosMancuernas]: [[0, 8], [30, 10]], [EJ.remoPolea]: [[0, 30], [30, 36]], [EJ.jalon]: [[0, 30], [30, 36]] }, ant: { cada: 12, peso: [[0, 58], [30, 58.4]], suma6: [[0, 96], [30, 90]], cintura: [[0, 68], [30, 67.5]], cadera: [[0, 95], [30, 95]], brazoRelajado: [[0, 26], [30, 26.4]], brazoFlex: [[0, 27], [30, 27.6]], muslo: [[0, 52], [30, 52.3]], pantorrilla: [[0, 34], [30, 34.2]], humero: 5.8, femur: 8.7 }, dieta: 'comun', registro: 'todo' },
  { clave: 'joaquin', nombre: 'Joaquín S.', sexo: 'H', edad: 19, talla: 181, semanas: 8, experiencia: 'NOVATO', actividad: 1.725, horario: [17 * 60, 18 * 60 + 30], areas: { ENTRENAMIENTO: L }, objetivoPersonal: 'Mejorar en el fútbol.', trn: [{ semana: 0, nombre: 'Inicio', dias: [0, 3], sesiones: simple(EJ.goblet, EJ.bancaMancuernas, [10, 12], 2) }], fuerza: { [EJ.goblet]: [[0, 22], [8, 26]], [EJ.bancaMancuernas]: [[0, 18], [8, 21]], [EJ.remoPolea]: [[0, 45], [8, 50]], [EJ.jalon]: [[0, 45], [8, 50]] }, dieta: 'comun', registro: 'olvida-findes' },
  { clave: 'rosa', nombre: 'Rosa E.', sexo: 'M', edad: 72, talla: 155, semanas: 34, experiencia: 'NOVATO', actividad: 1.375, horario: [10 * 60, 11 * 60 + 30], areas: { ENTRENAMIENTO: L, ANTROPOMETRIA: L }, objetivoPersonal: 'Volver a moverme y subir escaleras sin cansarme.', trn: [{ semana: 0, nombre: 'Volver a moverse', dias: [1, 3], sesiones: simple(EJ.prensa, EJ.pechoMaquina, [10, 12], 3), plantilla: ['fuerzaEquilibrio', 1] }, { semana: 18, nombre: 'Volver a moverse 2', dias: [1, 3], sesiones: simple(EJ.prensa, EJ.pechoMaquina, [10, 12], 2), plantilla: ['fuerzaEquilibrio', 2] }], fuerza: { [EJ.prensa]: [[0, 45], [34, 62]], [EJ.pechoMaquina]: [[0, 15], [34, 20]], [EJ.remoPolea]: [[0, 18], [34, 24]], [EJ.jalon]: [[0, 18], [34, 24]], [EJ.goblet]: [[0, 6], [34, 9]] }, ant: { cada: 12, peso: [[0, 63], [34, 62.6]], suma6: [[0, 112], [34, 108]], cintura: [[0, 86], [34, 85.5]], cadera: [[0, 102], [34, 101.6]], brazoRelajado: [[0, 28], [34, 28]], brazoFlex: [[0, 28.6], [34, 28.8]], muslo: [[0, 50], [34, 50.3]], pantorrilla: [[0, 33], [34, 33.2]], humero: 5.8, femur: 8.6 }, dieta: 'comun', registro: 'todo' },
  { clave: 'nicolas', nombre: 'Nicolás H.', sexo: 'H', edad: 41, talla: 175, semanas: 20, experiencia: 'INTERMEDIO', actividad: 1.55, horario: [20 * 60, 21 * 60 + 30], areas: { NUTRICION: L, ANTROPOMETRIA: L }, objetivoPersonal: 'Bajar un poco de peso.', nut: [{ semana: 0, nombre: 'Déficit', kcal: 2200, proteina: 1.6, grasa: 0.8, peso: 84, dias: 'UNO', razon: 'Un déficit moderado.' }, { semana: 12, nombre: 'Déficit · ajuste', kcal: 2150, proteina: 1.7, grasa: 0.8, peso: 82, dias: 'UNO', razon: 'Bajó dos kilos: un poco menos de energía y más proteína.' }], ant: { cada: 8, peso: [[0, 84], [12, 82], [20, 81]], suma6: [[0, 110], [20, 100]], cintura: [[0, 95], [20, 92.5]], cadera: [[0, 101], [20, 100]], brazoRelajado: [[0, 31], [20, 31]], brazoFlex: [[0, 33], [20, 33]], muslo: [[0, 55], [20, 54.6]], pantorrilla: [[0, 37], [20, 36.8]], humero: 7.0, femur: 9.7 }, dieta: 'comun', registro: 'noche' },
  { clave: 'paula', nombre: 'Paula N.', sexo: 'M', edad: 33, talla: 168, semanas: 12, experiencia: 'INTERMEDIO', actividad: 1.55, horario: [7 * 60, 8 * 60 + 30], areas: { NUTRICION: L, ENTRENAMIENTO: L }, objetivoPersonal: 'Mejorar la composición corporal.', trn: [{ semana: 0, nombre: 'Fuerza general', dias: [0, 2, 4], sesiones: simple(EJ.sentadilla, EJ.hombrosMancuernas, [6, 8], 2) }], fuerza: { [EJ.sentadilla]: [[0, 60], [12, 63]], [EJ.hombrosMancuernas]: [[0, 10], [12, 11]], [EJ.remoPolea]: [[0, 35], [12, 37]], [EJ.jalon]: [[0, 35], [12, 37]], [EJ.goblet]: [[0, 20], [12, 21]] }, nut: [{ semana: 0, nombre: 'Recomposición', kcal: 2000, proteina: 1.8, grasa: 0.9, peso: 63, dias: 'UNO', razon: 'Mantenimiento con la proteína alta.' }], dieta: 'comun', registro: 'todo' },
  { clave: 'ramiro', nombre: 'Ramiro C.', sexo: 'H', edad: 55, talla: 170, semanas: 26, experiencia: 'NOVATO', actividad: 1.375, horario: [8 * 60, 9 * 60 + 30], areas: { ENTRENAMIENTO: L, ANTROPOMETRIA: L }, objetivoPersonal: 'Cuidar la espalda y estar más fuerte.', trn: [{ semana: 0, nombre: 'Inicio', dias: [1, 4], sesiones: simple(EJ.prensa, EJ.bancaMancuernas, [10, 12], 3) }, { semana: 14, nombre: 'Progresión', dias: [1, 4], sesiones: simple(EJ.prensa, EJ.bancaMancuernas, [8, 10], 2) }], fuerza: { [EJ.prensa]: [[0, 90], [26, 120]], [EJ.bancaMancuernas]: [[0, 16], [26, 21]], [EJ.remoPolea]: [[0, 38], [26, 48]], [EJ.jalon]: [[0, 38], [26, 48]], [EJ.goblet]: [[0, 14], [26, 20]] }, ant: { cada: 10, peso: [[0, 82], [26, 80.5]], suma6: [[0, 120], [26, 110]], cintura: [[0, 97], [26, 95.5]], cadera: [[0, 102], [26, 101]], brazoRelajado: [[0, 30], [26, 30.2]], brazoFlex: [[0, 31.5], [26, 32]], muslo: [[0, 53], [26, 53]], pantorrilla: [[0, 36], [26, 36]], humero: 7.0, femur: 9.6 }, dieta: 'comun', registro: 'todo' },
  { clave: 'ines', nombre: 'Inés V.', sexo: 'M', edad: 63, talla: 158, semanas: 16, experiencia: 'NOVATO', actividad: 1.375, horario: [9 * 60, 10 * 60 + 30], areas: { NUTRICION: L }, objetivoPersonal: 'Ordenar las comidas por indicación médica.', nut: [{ semana: 0, nombre: 'Plan ordenado', kcal: 1650, proteina: 1.1, grasa: 0.85, peso: 68, dias: 'UNO', razon: 'Ordenar las cuatro comidas.', noEntrena: true }], dieta: 'comun', registro: 'noche' },
  { clave: 'facundo', nombre: 'Facundo L.', sexo: 'H', edad: 24, talla: 183, semanas: 10, experiencia: 'INTERMEDIO', actividad: 1.725, horario: [19 * 60, 20 * 60 + 30], areas: { NUTRICION: L, ENTRENAMIENTO: L, ANTROPOMETRIA: L }, objetivoPersonal: 'Ganar masa muscular.', trn: [{ semana: 0, nombre: 'Hipertrofia', dias: [0, 1, 3, 4], sesiones: simple(EJ.sentadilla, EJ.banca, [6, 8], 2) }], fuerza: { [EJ.sentadilla]: [[0, 100], [10, 104]], [EJ.banca]: [[0, 75], [10, 77.5]], [EJ.remoPolea]: [[0, 60], [10, 63]], [EJ.jalon]: [[0, 60], [10, 63]], [EJ.goblet]: [[0, 28], [10, 30]] }, nut: [{ semana: 0, nombre: 'Superávit', kcal: 3100, proteina: 1.8, grasa: 1.0, peso: 76, dias: 'UNO', razon: 'Un superávit chico.' }], ant: { cada: 5, peso: [[0, 76], [10, 77.2]], suma6: [[0, 70], [10, 71]], cintura: [[0, 79], [10, 79.5]], cadera: [[0, 95], [10, 95.5]], brazoRelajado: [[0, 32], [10, 32.5]], brazoFlex: [[0, 34], [10, 34.6]], muslo: [[0, 56], [10, 56.6]], pantorrilla: [[0, 37], [10, 37.1]], humero: 7.2, femur: 10 }, dieta: 'comun', registro: 'olvida-findes' },
  { clave: 'daniela', nombre: 'Daniela K.', sexo: 'M', edad: 45, talla: 165, semanas: 22, experiencia: 'NOVATO', actividad: 1.55, horario: [18 * 60, 19 * 60 + 30], areas: { NUTRICION: L, ANTROPOMETRIA: L }, objetivoPersonal: 'Mejorar la alimentación y bajar algo de grasa.', nut: [{ semana: 0, nombre: 'Déficit chico', kcal: 1750, proteina: 1.5, grasa: 0.8, peso: 72, dias: 'UNO', razon: 'Un déficit chico y sostenible.' }], ant: { cada: 8, peso: [[0, 72], [22, 69.6]], suma6: [[0, 140], [22, 128]], cintura: [[0, 86], [22, 83.6]], cadera: [[0, 106], [22, 104.8]], brazoRelajado: [[0, 30], [22, 29.5]], brazoFlex: [[0, 30.5], [22, 30]], muslo: [[0, 58], [22, 57]], pantorrilla: [[0, 37], [22, 36.7]], humero: 6.1, femur: 9.1 }, dieta: 'comun', registro: 'todo' },
  { clave: 'hugo', nombre: 'Hugo A.', sexo: 'H', edad: 68, talla: 169, semanas: 20, finalizadoHaceSemanas: 17, experiencia: 'NOVATO', actividad: 1.375, horario: [10 * 60, 11 * 60 + 30], areas: { ENTRENAMIENTO: L }, objetivoPersonal: 'Mantenerme activo.', trn: [{ semana: 0, nombre: 'Fuerza y equilibrio', dias: [1, 3], sesiones: simple(EJ.prensa, EJ.pechoMaquina, [10, 12], 3), plantilla: ['fuerzaEquilibrio', 1] }], fuerza: { [EJ.prensa]: [[0, 60], [20, 72]], [EJ.pechoMaquina]: [[0, 20], [20, 24]], [EJ.remoPolea]: [[0, 25], [20, 30]], [EJ.jalon]: [[0, 25], [20, 30]], [EJ.goblet]: [[0, 10], [20, 12]] }, dieta: 'comun', registro: 'todo' },
];

export const PERSONAS = [...PROFUNDAS, ...LIVIANAS.map((p) => ({ ...p, liviana: true }))];

/**
 * Los nombres que la muestra no puede usar (REQ-TUT-45): las personas reales que se conocen en el proyecto y los nombres
 * que ya usan otras muestras de BE. La lista privada de Elián (sus casos reales) se cruza aparte, desde un archivo fuera
 * del repositorio (`BE_TUTOR_NOMBRES_REALES`), y nunca pasa por acá.
 */
export const NOMBRES_QUE_NO_VAN = ['Franco García', 'Elián Bufi', 'Diego Sosa', 'Camila Ortiz', 'Federico Álvarez', 'Norma Castro', 'Héctor Funes', 'Agustina Ledesma', 'Martina Gómez', 'Lucas Fernández', 'Sofía Paz', 'Martín Acosta', 'Lucía Benítez'];
