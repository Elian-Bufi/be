// Fuente única de los métodos del catálogo de BE (DL-111): genera la migración SQL y alimenta los nombres del dominio
// (catalogo-perfil-completo.cjs lo lee para NOMBRE_DE_METODO y los nombres de las salidas).
// Uso (desde la raíz): node scripts/catalogo-antropometrico/catalogo-metodos.cjs prisma/migrations/20261001010000_metodos_antropometricos/migration.sql
const fs = require('fs');
const { METRICAS } = require('./catalogo-perfil-completo.cjs');

const UNIDAD = Object.fromEntries(METRICAS.map((m) => [m.clave, m.unidades[0]]));
const DE_LA_PERSONA = new Set(['peso', 'talla', 'edad']);

/** Los nombres de las salidas de los métodos, para mostrarlas sin su código. */
const SALIDAS = {
  imc: 'Índice de masa corporal',
  'indice-cintura-cadera': 'Índice cintura/cadera',
  'indice-cintura-talla': 'Índice cintura/talla',
  'suma-6-pliegues-isak': 'Suma de 6 pliegues (ISAK)',
  'suma-8-pliegues-isak': 'Suma de 8 pliegues (ISAK)',
  'suma-7-pliegues-jackson-pollock': 'Suma de 7 pliegues (Jackson y Pollock)',
  'grasa-durnin-womersley': 'Grasa corporal (Durnin y Womersley)',
  'grasa-jackson-pollock-7': 'Grasa corporal (Jackson y Pollock, 7 pliegues)',
  'grasa-jackson-pollock-3': 'Grasa corporal (Jackson y Pollock, 3 pliegues)',
  'grasa-faulkner': 'Grasa corporal (Faulkner)',
  'grasa-navy': 'Grasa corporal (US Navy)',
  'grasa-deurenberg': 'Grasa corporal desde el IMC (Deurenberg)',
  'masa-grasa-faulkner': 'Masa grasa (Faulkner)',
  'masa-libre-de-grasa-faulkner': 'Masa libre de grasa (Faulkner)',
  'masa-osea-rocha': 'Masa ósea (Rocha)',
  'masa-residual-wurch': 'Masa residual (Würch)',
  'masa-muscular-cuatro-componentes': 'Masa muscular (cuatro componentes)',
  'masa-muscular-esqueletica-lee': 'Masa muscular esquelética (Lee)',
  endomorfia: 'Endomorfia',
  mesomorfia: 'Mesomorfia',
  ectomorfia: 'Ectomorfia',
};

const ISAK_6 = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal', 'pliegue-muslo-frontal', 'pliegue-pantorrilla'];
const ISAK_8 = [...ISAK_6, 'pliegue-biceps', 'pliegue-cresta-iliaca'];
const JP_7 = ['pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-abdominal', 'pliegue-supraespinal', 'pliegue-muslo-frontal'];
const JP_3_H = ['pliegue-pectoral', 'pliegue-abdominal', 'pliegue-muslo-frontal'];
const JP_3_M = ['pliegue-triceps', 'pliegue-supraespinal', 'pliegue-muslo-frontal'];
const DW_4 = ['pliegue-biceps', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-cresta-iliaca'];
const FAULKNER_4 = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal'];
const LEE = ['talla', 'edad', 'perimetro-brazo-relajado', 'perimetro-muslo', 'perimetro-pantorrilla', 'pliegue-triceps', 'pliegue-muslo-frontal', 'pliegue-pantorrilla'];
const CUATRO_C = ['peso', 'talla', 'diametro-biestiloideo', 'diametro-femur', ...FAULKNER_4];

const SIRI = 'Siri WE. Body composition from fluid spaces and density: analysis of methods. En: Brozek J, Henschel A, eds. Techniques for measuring body composition. Washington DC: National Academy of Sciences; 1961. p. 223-244.';
const ISAK = 'Stewart A, Marfell-Jones M, Olds T, de Ridder H. International Standards for Anthropometric Assessment. Lower Hutt: ISAK; 2011.';
const DW = 'Durnin JVGA, Womersley J. Br J Nutr. 1974;32(1):77-97. doi:10.1079/BJN19740060.';
const JP78 = 'Jackson AS, Pollock ML. Br J Nutr. 1978;40(3):497-504. doi:10.1079/BJN19780152.';
const JPW80 = 'Jackson AS, Pollock ML, Ward A. Med Sci Sports Exerc. 1980;12(3):175-181.';
const FAULKNER = 'Faulkner JA. Physiology of swimming and diving. En: Falls HB, ed. Exercise physiology. Nueva York: Academic Press; 1968. p. 415-446.';
const NAVY_H = 'Hodgdon JA, Beckett MB. Prediction of percent body fat for U.S. Navy men from body circumferences and height. Naval Health Research Center, informe 84-11; 1984.';
const NAVY_M = 'Hodgdon JA, Beckett MB. Prediction of percent body fat for U.S. Navy women from body circumferences and height. Naval Health Research Center, informe 84-29; 1984.';
const DEURENBERG = 'Deurenberg P, Weststrate JA, Seidell JC. Br J Nutr. 1991;65(2):105-114. doi:10.1079/BJN19910073.';
const ROCHA = 'Rocha MSL. Peso ósseo do brasileiro de ambos os sexos de 17 a 25 anos. Arq Anat Antropol. 1975;1:445-451. Von Döbeln W, 1964.';
const WURCH = 'Würch A. La femme et le sport. Med Sport Française. 1974;4(1).';
const DE_ROSE = 'De Rose EH, Guimarães ACA. A model for optimization of somatotype in young athletes. En: Ostyn M, Beunen G, Simons J, eds. Kinanthropometry II. Baltimore: University Park Press; 1980. p. 77-80.';
const LEE_2000 = 'Lee RC, Wang Z, Heo M, Ross R, Janssen I, Heymsfield SB. Am J Clin Nutr. 2000;72(3):796-803. doi:10.1093/ajcn/72.3.796.';
const HEATH_CARTER = 'Carter JEL, Heath BH. Somatotyping: development and applications. Cambridge: Cambridge University Press; 1990. Carter JEL. The Heath-Carter anthropometric somatotype: instruction manual. San Diego State University; 2002.';

const M = (clave, nombre, categoria, regla, entradas, salida, unidad, decimales, descripcion, fuente, poblacion) => ({ clave, nombre, categoria, regla, entradas, salida, unidad, decimales, descripcion, fuente, poblacion });

const METODOS = [
  // ─── Índices ───
  M('MET-IMC', 'Índice de masa corporal (IMC)', 'INDICES', 'be/imc@1', ['peso', 'talla'], 'imc', 'kg/m²', 1,
    'Peso dividido por la talla al cuadrado (kg/m²). Usa solo peso y talla: no distingue la masa grasa de la magra.',
    'Keys A, Fidanza F, Karvonen MJ, Kimura N, Taylor HL. J Chronic Dis. 1972;25(6):329-343. Índice de Quetelet (1835).',
    'Adultos.'),
  M('MET-ICC', 'Índice cintura/cadera', 'INDICES', 'be/indice-cintura-cadera@1', ['perimetro-cintura', 'perimetro-cadera'], 'indice-cintura-cadera', 'cm/cm', 2,
    'Perímetro de cintura dividido por el perímetro de cadera, los dos en centímetros.',
    'Organización Mundial de la Salud. Waist circumference and waist-hip ratio: report of a WHO expert consultation. Ginebra; 2008 (publicado en 2011).',
    'Adultos.'),
  M('MET-ICT', 'Índice cintura/talla', 'INDICES', 'be/indice-cintura-talla@1', ['perimetro-cintura', 'talla'], 'indice-cintura-talla', 'cm/cm', 2,
    'Perímetro de cintura dividido por la talla, los dos en centímetros.',
    'Ashwell M, Hsieh SD. Int J Food Sci Nutr. 2005;56(5):303-307. doi:10.1080/09637480500195066.',
    'Adultos, niñas y niños.'),
  // ─── Sumas de pliegues ───
  M('MET-SUMA-6-ISAK', 'Suma de 6 pliegues (ISAK)', 'SUMAS_DE_PLIEGUES', 'be/suma-6-pliegues-isak@1', ISAK_6, 'suma-6-pliegues-isak', 'mm', 1,
    'Tríceps, subescapular, supraespinal, abdominal, muslo frontal y pantorrilla, sumados. No es una ecuación de predicción: se compara con tomas anteriores de la misma persona.',
    ISAK,
    'Cualquier edad.'),
  M('MET-SUMA-8-ISAK', 'Suma de 8 pliegues (ISAK)', 'SUMAS_DE_PLIEGUES', 'be/suma-8-pliegues-isak@1', ISAK_8, 'suma-8-pliegues-isak', 'mm', 1,
    'Los seis pliegues de la suma ISAK más el bicipital y el de la cresta ilíaca, sumados. No es una ecuación de predicción.',
    ISAK,
    'Cualquier edad.'),
  M('MET-SUMA-7-JP', 'Suma de 7 pliegues (Jackson y Pollock)', 'SUMAS_DE_PLIEGUES', 'be/suma-7-pliegues-jackson-pollock@1', JP_7, 'suma-7-pliegues-jackson-pollock', 'mm', 1,
    'Pectoral, axilar medio, tríceps, subescapular, abdominal, suprailíaco (en BE, supraespinal) y muslo, sumados.',
    `${JP78} ${JPW80}`,
    'Adultos.'),
  // ─── Grasa corporal ───
  M('MET-GRASA-DW-H', 'Grasa corporal · Durnin y Womersley, hombres', 'GRASA_CORPORAL', 'be/grasa-durnin-womersley-hombres@1', [...DW_4, 'edad'], 'grasa-durnin-womersley', '%', 1,
    'Densidad corporal con el logaritmo de la suma de 4 pliegues (bíceps, tríceps, subescapular y cresta ilíaca) y los coeficientes de la franja de edad; el porcentaje de grasa sale de la densidad con la ecuación de Siri.',
    `${DW} ${SIRI}`,
    'Hombres de 17 a 72 años. Debajo de 17 años la ecuación no tiene coeficientes y BE no calcula.'),
  M('MET-GRASA-DW-M', 'Grasa corporal · Durnin y Womersley, mujeres', 'GRASA_CORPORAL', 'be/grasa-durnin-womersley-mujeres@1', [...DW_4, 'edad'], 'grasa-durnin-womersley', '%', 1,
    'Densidad corporal con el logaritmo de la suma de 4 pliegues (bíceps, tríceps, subescapular y cresta ilíaca) y los coeficientes de la franja de edad; el porcentaje de grasa sale de la densidad con la ecuación de Siri.',
    `${DW} ${SIRI}`,
    'Mujeres de 16 a 68 años. Debajo de 16 años la ecuación no tiene coeficientes y BE no calcula.'),
  M('MET-GRASA-JP7-H', 'Grasa corporal · Jackson y Pollock, 7 pliegues, hombres', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-7-hombres@1', [...JP_7, 'edad'], 'grasa-jackson-pollock-7', '%', 1,
    'Densidad corporal con la suma de 7 pliegues, su cuadrado y la edad; el porcentaje de grasa sale con la ecuación de Siri.',
    `${JP78} ${SIRI}`,
    'Hombres de 18 a 61 años.'),
  M('MET-GRASA-JP7-M', 'Grasa corporal · Jackson, Pollock y Ward, 7 pliegues, mujeres', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-7-mujeres@1', [...JP_7, 'edad'], 'grasa-jackson-pollock-7', '%', 1,
    'Densidad corporal con la suma de 7 pliegues, su cuadrado y la edad; el porcentaje de grasa sale con la ecuación de Siri.',
    `${JPW80} ${SIRI}`,
    'Mujeres de 18 a 55 años.'),
  M('MET-GRASA-JP3-H', 'Grasa corporal · Jackson y Pollock, 3 pliegues, hombres', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-3-hombres@1', [...JP_3_H, 'edad'], 'grasa-jackson-pollock-3', '%', 1,
    'Densidad corporal con la suma de 3 pliegues (pectoral, abdominal y muslo), su cuadrado y la edad; el porcentaje de grasa sale con la ecuación de Siri.',
    `${JP78} ${SIRI}`,
    'Hombres de 18 a 61 años.'),
  M('MET-GRASA-JP3-M', 'Grasa corporal · Jackson, Pollock y Ward, 3 pliegues, mujeres', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-3-mujeres@1', [...JP_3_M, 'edad'], 'grasa-jackson-pollock-3', '%', 1,
    'Densidad corporal con la suma de 3 pliegues (tríceps, suprailíaco —en BE, supraespinal— y muslo), su cuadrado y la edad; el porcentaje de grasa sale con la ecuación de Siri.',
    `${JPW80} ${SIRI}`,
    'Mujeres de 18 a 55 años.'),
  M('MET-GRASA-FAULKNER', 'Grasa corporal · Faulkner', 'GRASA_CORPORAL', 'be/grasa-faulkner@1', FAULKNER_4, 'grasa-faulkner', '%', 1,
    'Porcentaje de grasa = 0,153 × (tríceps + subescapular + supraespinal + abdominal) + 5,783. Es la fórmula del modelo de cuatro componentes de De Rose y Guimarães.',
    FAULKNER,
    'Deportistas adultos. Muy usada en la antropometría deportiva de habla hispana.'),
  M('MET-GRASA-NAVY-H', 'Grasa corporal · US Navy, hombres', 'GRASA_CORPORAL', 'be/grasa-navy-hombres@1', ['perimetro-abdomen', 'perimetro-cuello', 'talla'], 'grasa-navy', '%', 1,
    'Con perímetros: abdomen a la altura del ombligo menos cuello, y la talla, en centímetros. No usa pliegues.',
    NAVY_H,
    'Hombres adultos del personal naval de los Estados Unidos.'),
  M('MET-GRASA-NAVY-M', 'Grasa corporal · US Navy, mujeres', 'GRASA_CORPORAL', 'be/grasa-navy-mujeres@1', ['perimetro-cintura', 'perimetro-cadera', 'perimetro-cuello', 'talla'], 'grasa-navy', '%', 1,
    'Con perímetros: cintura más cadera menos cuello, y la talla, en centímetros. No usa pliegues.',
    NAVY_M,
    'Mujeres adultas del personal naval de los Estados Unidos.'),
  M('MET-GRASA-DEURENBERG-H', 'Grasa corporal desde el IMC · Deurenberg, hombres', 'GRASA_CORPORAL', 'be/grasa-deurenberg-hombres@1', ['peso', 'talla', 'edad'], 'grasa-deurenberg', '%', 1,
    'Porcentaje de grasa = 1,2 × IMC + 0,23 × edad − 16,2. Solo usa peso, talla y edad: es la estimación más gruesa del catálogo.',
    DEURENBERG,
    'Adultos, con validación en población de los Países Bajos.'),
  M('MET-GRASA-DEURENBERG-M', 'Grasa corporal desde el IMC · Deurenberg, mujeres', 'GRASA_CORPORAL', 'be/grasa-deurenberg-mujeres@1', ['peso', 'talla', 'edad'], 'grasa-deurenberg', '%', 1,
    'Porcentaje de grasa = 1,2 × IMC + 0,23 × edad − 5,4. Solo usa peso, talla y edad: es la estimación más gruesa del catálogo.',
    DEURENBERG,
    'Adultos, con validación en población de los Países Bajos.'),
  // ─── Masas ───
  M('MET-MASA-GRASA-FAULKNER', 'Masa grasa · Faulkner', 'MASAS', 'be/masa-grasa-faulkner@1', ['peso', ...FAULKNER_4], 'masa-grasa-faulkner', 'kg', 1,
    'El peso por el porcentaje de grasa de Faulkner.',
    FAULKNER,
    'Deportistas adultos.'),
  M('MET-MASA-LIBRE-FAULKNER', 'Masa libre de grasa · Faulkner', 'MASAS', 'be/masa-libre-de-grasa-faulkner@1', ['peso', ...FAULKNER_4], 'masa-libre-de-grasa-faulkner', 'kg', 1,
    'El peso menos la masa grasa de Faulkner.',
    FAULKNER,
    'Deportistas adultos.'),
  M('MET-MASA-OSEA-ROCHA', 'Masa ósea · Von Döbeln modificada por Rocha', 'MASAS', 'be/masa-osea-rocha@1', ['talla', 'diametro-biestiloideo', 'diametro-femur'], 'masa-osea-rocha', 'kg', 1,
    'Masa ósea = 3,02 × (talla² × diámetro biestiloideo × diámetro bicondíleo del fémur × 400)^0,712, con las tres longitudes en metros.',
    ROCHA,
    'Adultos de 17 a 25 años en el estudio original; se usa en adultos.'),
  M('MET-MASA-RESIDUAL-H', 'Masa residual · Würch, hombres', 'MASAS', 'be/masa-residual-wurch-hombres@1', ['peso'], 'masa-residual-wurch', 'kg', 1,
    'El 24,1 % del peso: órganos, vísceras y fluidos, según el modelo de cuatro componentes.',
    WURCH,
    'Hombres adultos.'),
  M('MET-MASA-RESIDUAL-M', 'Masa residual · Würch, mujeres', 'MASAS', 'be/masa-residual-wurch-mujeres@1', ['peso'], 'masa-residual-wurch', 'kg', 1,
    'El 20,9 % del peso: órganos, vísceras y fluidos, según el modelo de cuatro componentes.',
    WURCH,
    'Mujeres adultas.'),
  M('MET-MASA-MUSCULAR-4C-H', 'Masa muscular · cuatro componentes, hombres', 'MASAS', 'be/masa-muscular-4c-hombres@1', CUATRO_C, 'masa-muscular-cuatro-componentes', 'kg', 1,
    'El peso menos la masa grasa (Faulkner), la masa ósea (Rocha) y la masa residual (Würch, 24,1 %). Es la masa muscular por diferencia del modelo de De Rose y Guimarães.',
    `${DE_ROSE} ${FAULKNER} ${ROCHA} ${WURCH}`,
    'Hombres adultos; muy usada en deportistas.'),
  M('MET-MASA-MUSCULAR-4C-M', 'Masa muscular · cuatro componentes, mujeres', 'MASAS', 'be/masa-muscular-4c-mujeres@1', CUATRO_C, 'masa-muscular-cuatro-componentes', 'kg', 1,
    'El peso menos la masa grasa (Faulkner), la masa ósea (Rocha) y la masa residual (Würch, 20,9 %). Es la masa muscular por diferencia del modelo de De Rose y Guimarães.',
    `${DE_ROSE} ${FAULKNER} ${ROCHA} ${WURCH}`,
    'Mujeres adultas; muy usada en deportistas.'),
  M('MET-MME-LEE-H', 'Masa muscular esquelética · Lee y col., hombres', 'MASAS', 'be/masa-muscular-esqueletica-lee-hombres@1', LEE, 'masa-muscular-esqueletica-lee', 'kg', 1,
    'Con la talla y los perímetros de brazo, muslo y pantorrilla corregidos por su pliegue (perímetro − π × pliegue), más la edad. BE aplica el término de etnia de la muestra blanca e hispana (0); la ecuación resta 2,0 kg para personas asiáticas y suma 1,1 kg para afroamericanas.',
    LEE_2000,
    'Adultos de 20 a 81 años con un IMC menor a 30 kg/m², validada contra resonancia magnética.'),
  M('MET-MME-LEE-M', 'Masa muscular esquelética · Lee y col., mujeres', 'MASAS', 'be/masa-muscular-esqueletica-lee-mujeres@1', LEE, 'masa-muscular-esqueletica-lee', 'kg', 1,
    'Con la talla y los perímetros de brazo, muslo y pantorrilla corregidos por su pliegue (perímetro − π × pliegue), más la edad. BE aplica el término de etnia de la muestra blanca e hispana (0); la ecuación resta 2,0 kg para personas asiáticas y suma 1,1 kg para afroamericanas.',
    LEE_2000,
    'Adultos de 20 a 81 años con un IMC menor a 30 kg/m², validada contra resonancia magnética.'),
  // ─── Somatotipo ───
  M('MET-SOMATOTIPO-ENDO', 'Somatotipo · endomorfia (Heath y Carter)', 'SOMATOTIPO', 'be/somatotipo-endomorfia@1', ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'talla'], 'endomorfia', 'unidades', 1,
    'El primer componente del somatotipo: la adiposidad relativa, con la suma de tríceps, subescapular y supraespinal corregida por la talla.',
    HEATH_CARTER,
    'Cualquier edad y sexo.'),
  M('MET-SOMATOTIPO-MESO', 'Somatotipo · mesomorfia (Heath y Carter)', 'SOMATOTIPO', 'be/somatotipo-mesomorfia@1', ['diametro-humero', 'diametro-femur', 'perimetro-brazo-flexionado', 'perimetro-pantorrilla', 'pliegue-triceps', 'pliegue-pantorrilla', 'talla'], 'mesomorfia', 'unidades', 1,
    'El segundo componente del somatotipo: la robustez músculo-esquelética relativa a la talla, con los diámetros de húmero y fémur y los perímetros de brazo flexionado y pantorrilla corregidos por su pliegue.',
    HEATH_CARTER,
    'Cualquier edad y sexo.'),
  M('MET-SOMATOTIPO-ECTO', 'Somatotipo · ectomorfia (Heath y Carter)', 'SOMATOTIPO', 'be/somatotipo-ectomorfia@1', ['talla', 'peso'], 'ectomorfia', 'unidades', 1,
    'El tercer componente del somatotipo: la linealidad relativa, con el índice ponderal recíproco (talla sobre la raíz cúbica del peso).',
    HEATH_CARTER,
    'Cualquier edad y sexo.'),
];

const hex2 = (n) => n.toString(16).padStart(2, '0');
METODOS.forEach((m, i) => {
  m.especificacionId = `3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a3f${hex2(i + 1)}`;
  m.versionId = `3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f${hex2(i + 1)}`;
  for (const e of m.entradas) if (!UNIDAD[e]) throw new Error(`${m.clave}: la medición ${e} no está en el catálogo`);
  if (!SALIDAS[m.salida]) throw new Error(`${m.clave}: la salida ${m.salida} no tiene nombre`);
});

const codigo = (clave) => clave.toUpperCase().replace(/-/g, '_');
const contenido = (m) => ({
  finalidades: ['SOPORTE_ANTROPOMETRICO'],
  entradas: m.entradas.map((e) => ({
    codigo: codigo(e),
    metrica: e,
    unidadesAdmitidas: [UNIDAD[e]],
    procedenciasAdmitidas: DE_LA_PERSONA.has(e) ? ['CAPTURA_DIRECTA', 'AUTORREPORTE', 'IMPORTACION_CONTROLADA'] : ['CAPTURA_DIRECTA', 'IMPORTACION_CONTROLADA'],
  })),
  salida: { metrica: m.salida, unidad: m.unidad },
  precision: { decimales: m.decimales, modo: 'MEDIO_ARRIBA' },
  regla: m.regla,
  descripcion: m.descripcion,
  fuente: m.fuente,
  poblacion: m.poblacion,
  categoria: m.categoria,
});

module.exports = { METODOS, SALIDAS, contenido };

if (require.main === module) {
  const [salidaSql] = process.argv.slice(2);
  const sqlTexto = (s) => `'${s.replace(/'/g, "''")}'`;
  const MOMENTO = "'2026-10-01T01:00:00.000Z'";
  const sql = `-- DL-111 · los métodos del catálogo antropométrico de BE: ${METODOS.length} fórmulas publicadas, cada una con su fuente, su población
-- y la regla de dominio versionada que la aplica (packages/domain/src/formulas-antropometricas.ts). BE no elige ninguna
-- (REG-06-205): el profesional ve qué pide cada método y qué da, y elige. Las que difieren por sexo son métodos
-- distintos. Las entradas usan las mediciones del protocolo «Perfil antropométrico completo», en sus unidades: kg, cm,
-- mm y años. Identificadores deterministas, iguales en todos los ambientes. Generado por scripts/catalogo-antropometrico/catalogo-metodos.cjs.

INSERT INTO "especificacion_antropometrica" ("id", "clave", "tipo", "momento_de_registro") VALUES
${METODOS.map((m) => `  ('${m.especificacionId}', '${m.clave}', 'METODO', ${MOMENTO})`).join(',\n')};

INSERT INTO "version_de_especificacion_antropometrica" ("id", "especificacion_id", "predecesora_id", "version", "nombre", "contenido", "procedencia", "momento_de_registro") VALUES
${METODOS.map(
  (m) => `  ('${m.versionId}', '${m.especificacionId}', NULL, '1',
   ${sqlTexto(m.nombre)},
   ${sqlTexto(JSON.stringify(contenido(m)))},
   ${sqlTexto(JSON.stringify({ rotulo: 'Catálogo de BE (DL-111): fórmula publicada, con su fuente y su población. La elige el profesional; BE no la impone.' }))},
   ${MOMENTO})`,
).join(',\n')};
`;
  fs.writeFileSync(salidaSql, sql);
  console.log(`métodos: ${METODOS.length}`);
}
