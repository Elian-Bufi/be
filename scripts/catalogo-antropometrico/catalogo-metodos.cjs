// Fuente única de los métodos del catálogo de BE (DL-111): genera la migración SQL y alimenta los nombres del dominio
// (catalogo-perfil-completo.cjs lo lee para NOMBRE_DE_METODO y los nombres de las salidas). Cada método sale de la ficha
// docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md (MA-xx): fuente, población, sitios, fórmula y casos de prueba.
// Uso (desde la raíz): node scripts/catalogo-antropometrico/catalogo-metodos.cjs prisma/migrations/20261001010000_metodos_antropometricos/migration.sql
const fs = require('fs');
const { METRICAS } = require('./catalogo-perfil-completo.cjs');

const UNIDAD = Object.fromEntries(METRICAS.map((m) => [m.clave, m.unidades[0]]));
const DE_LA_PERSONA = new Set(['peso', 'talla', 'edad']);
const ADIMENSIONAL = 'adimensional';

/** Los nombres de las salidas de los métodos, para mostrarlas sin su código. Una métrica por familia de fórmulas. */
const SALIDAS = {
  imc: 'Índice de masa corporal',
  'indice-cintura-cadera': 'Índice cintura/cadera',
  'indice-cintura-talla': 'Índice cintura/talla',
  'indice-conicidad': 'Índice de conicidad',
  'suma-6-pliegues-isak': 'Suma de 6 pliegues (ISAK)',
  'suma-8-pliegues-isak': 'Suma de 8 pliegues (ISAK)',
  'suma-7-pliegues-jackson-pollock': 'Suma de 7 pliegues (Jackson y Pollock)',
  'grasa-durnin-womersley': 'Grasa corporal (Durnin y Womersley, Siri)',
  'grasa-durnin-womersley-brozek': 'Grasa corporal (Durnin y Womersley, Brozek)',
  'grasa-jackson-pollock-7': 'Grasa corporal (Jackson y Pollock, 7 pliegues, Siri)',
  'grasa-jackson-pollock-7-brozek': 'Grasa corporal (Jackson y Pollock, 7 pliegues, Brozek)',
  'grasa-jackson-pollock-3': 'Grasa corporal (Jackson y Pollock, 3 pliegues, Siri)',
  'grasa-jackson-pollock-3-brozek': 'Grasa corporal (Jackson y Pollock, 3 pliegues, Brozek)',
  'grasa-faulkner': 'Grasa corporal (Faulkner)',
  'grasa-yuhasz-carter': 'Grasa corporal (Yuhasz-Carter)',
  'grasa-rfm': 'Grasa corporal (RFM)',
  'grasa-bai': 'Grasa corporal (BAI)',
  'grasa-deurenberg': 'Grasa corporal desde el IMC (Deurenberg)',
  'masa-grasa-faulkner': 'Masa grasa (Faulkner)',
  'masa-libre-de-grasa-faulkner': 'Masa libre de grasa (Faulkner)',
  'masa-osea-rocha': 'Masa ósea (Rocha)',
  'masa-residual-wurch': 'Masa residual (Würch)',
  'masa-muscular-cuatro-componentes': 'Masa muscular (cuatro componentes)',
  'masa-muscular-esqueletica-lee': 'Masa muscular esquelética (Lee, perímetros)',
  'masa-muscular-esqueletica-lee-peso': 'Masa muscular esquelética (Lee, peso y talla)',
  endomorfia: 'Endomorfia',
  mesomorfia: 'Mesomorfia',
  ectomorfia: 'Ectomorfia',
};

// ─── Sitios (ficha, §2) ───
const ISAK_6 = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal', 'pliegue-muslo-frontal', 'pliegue-pantorrilla'];
const ISAK_8 = [...ISAK_6, 'pliegue-biceps', 'pliegue-cresta-iliaca'];
// Jackson y Pollock: el suprailíaco es la cresta ilíaca (D-1 de la ficha, con el GREC).
const JP_7 = ['pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-abdominal', 'pliegue-cresta-iliaca', 'pliegue-muslo-frontal'];
const JP_3_H = ['pliegue-pectoral', 'pliegue-abdominal', 'pliegue-muslo-frontal'];
const JP_3_M = ['pliegue-triceps', 'pliegue-cresta-iliaca', 'pliegue-muslo-frontal'];
const DW_4 = ['pliegue-biceps', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-cresta-iliaca'];
const FAULKNER_4 = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal'];
const LEE = ['talla', 'edad', 'perimetro-brazo-relajado', 'pliegue-triceps', 'perimetro-muslo', 'pliegue-muslo-frontal', 'perimetro-pantorrilla', 'pliegue-pantorrilla'];
const CUATRO_C = ['peso', 'talla', ...FAULKNER_4, 'diametro-biestiloideo', 'diametro-femur'];

// ─── Fuentes (ficha, §17) ───
const SIRI = 'Siri WE. Body composition from fluid spaces and density: analysis of methods. En: Brozek J, Henschel A, eds. Techniques for measuring body composition. Washington: National Academy of Sciences; 1961.';
const BROZEK = 'Brozek J, Grande F, Anderson JT, Keys A. Ann N Y Acad Sci. 1963;110:113-140. doi:10.1111/j.1749-6632.1963.tb17079.x.';
const ISAK = 'Stewart A, Marfell-Jones M, Olds T, de Ridder H. International Standards for Anthropometric Assessment. ISAK; 2011. Carter JEL, 1982.';
const DW = 'Durnin JVGA, Womersley J. Br J Nutr. 1974;32(1):77-97. doi:10.1079/BJN19740060 (tabla 5).';
const JP78 = 'Jackson AS, Pollock ML. Br J Nutr. 1978;40(3):497-504. doi:10.1079/BJN19780152 (tabla 4).';
const JPW80 = 'Jackson AS, Pollock ML, Ward A. Med Sci Sports Exerc. 1980;12(3):175-181 (coeficientes cruzados en fuentes secundarias: el original no estuvo accesible).';
const FAULKNER = 'Faulkner JA. Physiology of swimming and diving. En: Falls HB, ed. Exercise physiology. Academic Press; 1968. p. 417. Pires Neto CS, Glaner MF. Rev Bras Cineantropom Desempenho Hum. 2007;9(2):207-213.';
const YUHASZ_CARTER = 'Yuhasz MS. Physical fitness manual. University of Western Ontario; 1974. Carter JEL. Physical structure of Olympic athletes, part I. Karger; 1982. p. 107-116 (coeficientes cruzados en el consenso del GREC 2010 y en fuentes revisadas por pares).';
const RFM = 'Woolcott OO, Bergman RN. Sci Rep. 2018;8:10980. doi:10.1038/s41598-018-29362-1.';
const BAI = 'Bergman RN y col. Obesity (Silver Spring). 2011;19(5):1083-1089. doi:10.1038/oby.2011.38.';
const DEURENBERG = 'Deurenberg P, Weststrate JA, Seidell JC. Br J Nutr. 1991;65(2):105-114. doi:10.1079/BJN19910073.';
const CONICIDAD = 'Valdez R. J Clin Epidemiol. 1991;44(9):955-956. doi:10.1016/0895-4356(91)90059-i. Valdez R y col. Int J Obes Relat Metab Disord. 1993;17(2):77-82.';
const ROCHA = 'Rocha MSL. Peso ósseo do brasileiro de ambos os sexos de 17 a 25 anos. Río de Janeiro; 1975. Fórmula del consenso del GREC (Alvero-Cruz y col., 2009 y 2010).';
const WURCH = 'Würch A. La femme et le sport. Médecine Sportive Française; 1974. Constantes en Gris GM. Apunts Med Esport. 2001;36(137):5-16.';
const DE_ROSE = 'De Rose EH, Guimarães ACA. En: Ostyn M y col., eds. Kinanthropometry II. University Park Press; 1980. p. 77-80. Composición del modelo en González-Mendoza y col., 2019.';
const LEE_2000 = 'Lee RC, Wang Z, Heo M, Ross R, Janssen I, Heymsfield SB. Am J Clin Nutr. 2000;72(3):796-803. doi:10.1093/ajcn/72.3.796.';
const HEATH_CARTER = 'Carter JEL. The Heath-Carter anthropometric somatotype: instruction manual. San Diego State University; 2002. Carter JEL, Heath BH. Somatotyping: development and applications. Cambridge University Press; 1990.';
const KEYS = 'Keys A, Fidanza F, Karvonen MJ, Kimura N, Taylor HL. J Chronic Dis. 1972;25(6):329-343. Índice de Quetelet.';
const OMS_CINTURA = 'Organización Mundial de la Salud. Waist circumference and waist-hip ratio: report of a WHO expert consultation. Ginebra; 2008 (publicado en 2011).';
const ASHWELL = 'Ashwell M, Hsieh SD. Int J Food Sci Nutr. 2005;56(5):303-307. doi:10.1080/09637480500195066. Ashwell M, Gunn P, Gibson S, 2012.';

// ─── Poblaciones (ficha) ───
const POB_DW_H = 'Hombres de 17 a 72 años de Glasgow, de distintos tipos corporales, con densidad por pesada hidrostática. Debajo de 17 años la ecuación no tiene coeficientes y BE no calcula.';
const POB_DW_M = 'Mujeres de 16 a 68 años de Glasgow, de distintos tipos corporales, con densidad por pesada hidrostática. Debajo de 16 años la ecuación no tiene coeficientes y BE no calcula.';
const POB_JP_H = 'Hombres de 18 a 61 años, con 1 a 33 % de grasa por pesada hidrostática; fuera de ese rango se extrapola. El suprailíaco se toma en la cresta ilíaca (sitio aproximado).';
const POB_JPW_M = 'Mujeres de 18 a 55 años, con 4 a 44 % de grasa por pesada hidrostática; los autores piden cuidado después de los 40. El suprailíaco se toma en la cresta ilíaca (sitio aproximado).';
const POB_LEE = 'Adultos sanos con un IMC menor a 30 kg/m², de varios grupos étnicos, contra resonancia magnética de cuerpo entero. BE aplica el término de etnia de la muestra blanca e hispana (0); la ecuación tiene otro para personas asiáticas y afroamericanas, que elige el profesional.';

const M = (n, clave, nombre, categoria, regla, entradas, salida, unidad, decimales, descripcion, fuente, poblacion) => ({ n, clave, nombre, categoria, regla, entradas, salida, unidad, decimales, descripcion, fuente, poblacion });
const DENSIDAD_DW = 'Densidad corporal con el logaritmo de la suma de 4 pliegues (bíceps, tríceps, subescapular y cresta ilíaca) y los coeficientes de la franja de edad.';
const DENSIDAD_JP7 = 'Densidad corporal con la suma de 7 pliegues (pectoral, axilar medio, tríceps, subescapular, abdominal, cresta ilíaca y muslo), su cuadrado y la edad.';
const DENSIDAD_JP3_H = 'Densidad corporal con la suma de 3 pliegues (pectoral, abdominal y muslo), su cuadrado y la edad.';
const DENSIDAD_JP3_M = 'Densidad corporal con la suma de 3 pliegues (tríceps, cresta ilíaca y muslo), su cuadrado y la edad.';
const CON_SIRI = 'El porcentaje de grasa sale de la densidad con la ecuación de Siri, la que usaron los autores.';
const CON_BROZEK = 'El porcentaje de grasa sale de la densidad con la ecuación de Brozek.';

const METODOS = [
  // ─── Índices ───
  M(1, 'MET-IMC', 'Índice de masa corporal (IMC)', 'INDICES', 'be/imc@1', ['peso', 'talla'], 'imc', 'kg/m²', 1,
    'Peso dividido por la talla al cuadrado. Usa solo peso y talla: no distingue la masa grasa de la magra ni dice dónde está la grasa.', KEYS, 'Adultos. Es un índice, no una ecuación de predicción.'),
  M(2, 'MET-ICC', 'Índice cintura/cadera', 'INDICES', 'be/indice-cintura-cadera@1', ['perimetro-cintura', 'perimetro-cadera'], 'indice-cintura-cadera', ADIMENSIONAL, 2,
    'Perímetro de cintura dividido por el de cadera. El valor depende del sitio donde se toma la cintura.', OMS_CINTURA, 'Adultos.'),
  M(3, 'MET-ICT', 'Índice cintura/talla', 'INDICES', 'be/indice-cintura-talla@1', ['perimetro-cintura', 'talla'], 'indice-cintura-talla', ADIMENSIONAL, 2,
    'Perímetro de cintura dividido por la talla, los dos en centímetros.', ASHWELL, 'Adultos de distintas nacionalidades (metaanálisis de 2012).'),
  M(4, 'MET-CONICIDAD', 'Índice de conicidad (Valdez)', 'INDICES', 'be/indice-conicidad@1', ['perimetro-cintura', 'peso', 'talla'], 'indice-conicidad', ADIMENSIONAL, 2,
    'La cintura comparada con la de un cilindro del mismo peso y talla: 0,109 × raíz de peso sobre talla. Va de 1 (cilindro) a 1,73 (doble cono).', CONICIDAD, 'Siete poblaciones europeas y dos de Estados Unidos (1280 hombres y 960 mujeres).'),
  // ─── Sumas de pliegues ───
  M(5, 'MET-SUMA-6-ISAK', 'Suma de 6 pliegues (ISAK)', 'SUMAS_DE_PLIEGUES', 'be/suma-6-pliegues-isak@1', ISAK_6, 'suma-6-pliegues-isak', 'mm', 1,
    'Tríceps, subescapular, supraespinal, abdominal, muslo frontal y pantorrilla, sumados. No es una ecuación de predicción: se compara con tomas anteriores de la misma persona, con el mismo protocolo y, si se puede, el mismo calibre.', ISAK, 'Cualquier edad.'),
  M(6, 'MET-SUMA-8-ISAK', 'Suma de 8 pliegues (ISAK)', 'SUMAS_DE_PLIEGUES', 'be/suma-8-pliegues-isak@1', ISAK_8, 'suma-8-pliegues-isak', 'mm', 1,
    'Los seis de la suma ISAK más el bicipital y el de la cresta ilíaca, sumados. No es una ecuación de predicción.', ISAK, 'Cualquier edad.'),
  M(7, 'MET-SUMA-7-JP', 'Suma de 7 pliegues (Jackson y Pollock)', 'SUMAS_DE_PLIEGUES', 'be/suma-7-pliegues-jackson-pollock@1', JP_7, 'suma-7-pliegues-jackson-pollock', 'mm', 1,
    'Pectoral, axilar medio, tríceps, subescapular, abdominal, cresta ilíaca (el suprailíaco de Jackson y Pollock) y muslo, sumados.', JP78, 'Adultos. El suprailíaco se toma en la cresta ilíaca (sitio aproximado).'),
  // ─── Grasa corporal por densidad ───
  M(8, 'MET-GRASA-DW-H', 'Durnin y Womersley, hombres · Siri', 'GRASA_CORPORAL', 'be/grasa-durnin-womersley-hombres@1', [...DW_4, 'edad'], 'grasa-durnin-womersley', '%', 1, `${DENSIDAD_DW} ${CON_SIRI}`, `${DW} ${SIRI}`, POB_DW_H),
  M(9, 'MET-GRASA-DW-M', 'Durnin y Womersley, mujeres · Siri', 'GRASA_CORPORAL', 'be/grasa-durnin-womersley-mujeres@1', [...DW_4, 'edad'], 'grasa-durnin-womersley', '%', 1, `${DENSIDAD_DW} ${CON_SIRI}`, `${DW} ${SIRI}`, POB_DW_M),
  M(10, 'MET-GRASA-DW-BROZEK-H', 'Durnin y Womersley, hombres · Brozek', 'GRASA_CORPORAL', 'be/grasa-durnin-womersley-brozek-hombres@1', [...DW_4, 'edad'], 'grasa-durnin-womersley-brozek', '%', 1, `${DENSIDAD_DW} ${CON_BROZEK}`, `${DW} ${BROZEK}`, POB_DW_H),
  M(11, 'MET-GRASA-DW-BROZEK-M', 'Durnin y Womersley, mujeres · Brozek', 'GRASA_CORPORAL', 'be/grasa-durnin-womersley-brozek-mujeres@1', [...DW_4, 'edad'], 'grasa-durnin-womersley-brozek', '%', 1, `${DENSIDAD_DW} ${CON_BROZEK}`, `${DW} ${BROZEK}`, POB_DW_M),
  M(12, 'MET-GRASA-JP7-H', 'Jackson y Pollock, 7 pliegues, hombres · Siri', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-7-hombres@1', [...JP_7, 'edad'], 'grasa-jackson-pollock-7', '%', 1, `${DENSIDAD_JP7} ${CON_SIRI}`, `${JP78} ${SIRI}`, POB_JP_H),
  M(13, 'MET-GRASA-JP7-M', 'Jackson, Pollock y Ward, 7 pliegues, mujeres · Siri', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-7-mujeres@1', [...JP_7, 'edad'], 'grasa-jackson-pollock-7', '%', 1, `${DENSIDAD_JP7} ${CON_SIRI}`, `${JPW80} ${SIRI}`, POB_JPW_M),
  M(14, 'MET-GRASA-JP7-BROZEK-H', 'Jackson y Pollock, 7 pliegues, hombres · Brozek', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-7-brozek-hombres@1', [...JP_7, 'edad'], 'grasa-jackson-pollock-7-brozek', '%', 1, `${DENSIDAD_JP7} ${CON_BROZEK}`, `${JP78} ${BROZEK}`, POB_JP_H),
  M(15, 'MET-GRASA-JP7-BROZEK-M', 'Jackson, Pollock y Ward, 7 pliegues, mujeres · Brozek', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-7-brozek-mujeres@1', [...JP_7, 'edad'], 'grasa-jackson-pollock-7-brozek', '%', 1, `${DENSIDAD_JP7} ${CON_BROZEK}`, `${JPW80} ${BROZEK}`, POB_JPW_M),
  M(16, 'MET-GRASA-JP3-H', 'Jackson y Pollock, 3 pliegues, hombres · Siri', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-3-hombres@1', [...JP_3_H, 'edad'], 'grasa-jackson-pollock-3', '%', 1, `${DENSIDAD_JP3_H} ${CON_SIRI}`, `${JP78} ${SIRI}`, 'Hombres de 18 a 61 años, con 1 a 33 % de grasa por pesada hidrostática; fuera de ese rango se extrapola.'),
  M(17, 'MET-GRASA-JP3-M', 'Jackson, Pollock y Ward, 3 pliegues, mujeres · Siri', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-3-mujeres@1', [...JP_3_M, 'edad'], 'grasa-jackson-pollock-3', '%', 1, `${DENSIDAD_JP3_M} ${CON_SIRI}`, `${JPW80} ${SIRI}`, POB_JPW_M),
  M(18, 'MET-GRASA-JP3-BROZEK-H', 'Jackson y Pollock, 3 pliegues, hombres · Brozek', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-3-brozek-hombres@1', [...JP_3_H, 'edad'], 'grasa-jackson-pollock-3-brozek', '%', 1, `${DENSIDAD_JP3_H} ${CON_BROZEK}`, `${JP78} ${BROZEK}`, 'Hombres de 18 a 61 años, con 1 a 33 % de grasa por pesada hidrostática; fuera de ese rango se extrapola.'),
  M(19, 'MET-GRASA-JP3-BROZEK-M', 'Jackson, Pollock y Ward, 3 pliegues, mujeres · Brozek', 'GRASA_CORPORAL', 'be/grasa-jackson-pollock-3-brozek-mujeres@1', [...JP_3_M, 'edad'], 'grasa-jackson-pollock-3-brozek', '%', 1, `${DENSIDAD_JP3_M} ${CON_BROZEK}`, `${JPW80} ${BROZEK}`, POB_JPW_M),
  // ─── Grasa corporal directa ───
  M(20, 'MET-GRASA-FAULKNER', 'Faulkner, hombres', 'GRASA_CORPORAL', 'be/grasa-faulkner@1', FAULKNER_4, 'grasa-faulkner', '%', 1,
    'Porcentaje de grasa = 0,153 × (tríceps + subescapular + supraespinal + abdominal) + 5,783. Es la grasa del modelo de cuatro componentes de De Rose y Guimarães.', FAULKNER,
    'Hombres: universitarios y nadadores universitarios de unos 20 años. No hay ecuación de Faulkner para mujeres con fuente.'),
  M(21, 'MET-GRASA-YUHASZ-CARTER-H', 'Yuhasz-Carter, hombres', 'GRASA_CORPORAL', 'be/grasa-yuhasz-carter-hombres@1', ISAK_6, 'grasa-yuhasz-carter', '%', 1,
    'Porcentaje de grasa = 0,1051 × suma de 6 pliegues ISAK + 2,585.', YUHASZ_CARTER, 'Pensada para deportistas: Carter la aplicó a los atletas olímpicos de Montreal 1976.'),
  M(22, 'MET-GRASA-YUHASZ-CARTER-M', 'Yuhasz-Carter, mujeres', 'GRASA_CORPORAL', 'be/grasa-yuhasz-carter-mujeres@1', ISAK_6, 'grasa-yuhasz-carter', '%', 1,
    'Porcentaje de grasa = 0,1548 × suma de 6 pliegues ISAK + 3,580.', YUHASZ_CARTER, 'Pensada para deportistas: Carter la aplicó a las atletas olímpicas de Montreal 1976.'),
  M(23, 'MET-GRASA-RFM-H', 'Masa grasa relativa (RFM), hombres', 'GRASA_CORPORAL', 'be/grasa-rfm-hombres@1', ['talla', 'perimetro-cintura'], 'grasa-rfm', '%', 1,
    'Porcentaje de grasa = 64 − 20 × talla / cintura. Solo usa la talla y la cintura, sin pliegues.', RFM,
    'Adultos de 20 a 85 años de Estados Unidos (NHANES), contra DXA. La cintura de la fuente se toma sobre la cresta ilíaca.'),
  M(24, 'MET-GRASA-RFM-M', 'Masa grasa relativa (RFM), mujeres', 'GRASA_CORPORAL', 'be/grasa-rfm-mujeres@1', ['talla', 'perimetro-cintura'], 'grasa-rfm', '%', 1,
    'Porcentaje de grasa = 76 − 20 × talla / cintura. Solo usa la talla y la cintura, sin pliegues.', RFM,
    'Adultos de 20 a 85 años de Estados Unidos (NHANES), contra DXA. La cintura de la fuente se toma sobre la cresta ilíaca.'),
  M(25, 'MET-GRASA-BAI', 'Índice de adiposidad corporal (BAI)', 'GRASA_CORPORAL', 'be/grasa-bai@1', ['perimetro-cadera', 'talla'], 'grasa-bai', '%', 1,
    'Porcentaje de grasa = cadera / talla^1,5 − 18, con la cadera en cm y la talla en m. No usa el peso. El mismo cálculo para hombres y mujeres.', BAI,
    'Adultos mexicano-estadounidenses de 18 a 67 años, con validación en afroestadounidenses de 20 a 50, contra DXA.'),
  M(26, 'MET-GRASA-DEURENBERG-H', 'Deurenberg (desde el IMC), hombres', 'GRASA_CORPORAL', 'be/grasa-deurenberg-hombres@1', ['peso', 'talla', 'edad'], 'grasa-deurenberg', '%', 1,
    'Porcentaje de grasa = 1,2 × IMC + 0,23 × edad − 16,2. Solo usa peso, talla y edad: es la estimación más gruesa del catálogo (error estándar de 4,1 puntos).', DEURENBERG,
    'Mayores de 15 años de los Países Bajos, contra densitometría.'),
  M(27, 'MET-GRASA-DEURENBERG-M', 'Deurenberg (desde el IMC), mujeres', 'GRASA_CORPORAL', 'be/grasa-deurenberg-mujeres@1', ['peso', 'talla', 'edad'], 'grasa-deurenberg', '%', 1,
    'Porcentaje de grasa = 1,2 × IMC + 0,23 × edad − 5,4. Solo usa peso, talla y edad: es la estimación más gruesa del catálogo (error estándar de 4,1 puntos).', DEURENBERG,
    'Mayores de 15 años de los Países Bajos, contra densitometría.'),
  // ─── Masas ───
  M(28, 'MET-MASA-GRASA-FAULKNER', 'Masa grasa (Faulkner), hombres', 'MASAS', 'be/masa-grasa-faulkner@1', ['peso', ...FAULKNER_4], 'masa-grasa-faulkner', 'kg', 1,
    'El peso por el porcentaje de grasa de Faulkner.', FAULKNER, 'Hombres: la de Faulkner.'),
  M(29, 'MET-MASA-LIBRE-FAULKNER', 'Masa libre de grasa (Faulkner), hombres', 'MASAS', 'be/masa-libre-de-grasa-faulkner@1', ['peso', ...FAULKNER_4], 'masa-libre-de-grasa-faulkner', 'kg', 1,
    'El peso menos la masa grasa de Faulkner.', FAULKNER, 'Hombres: la de Faulkner.'),
  M(30, 'MET-MASA-OSEA-ROCHA', 'Masa ósea (Von Döbeln modificada por Rocha)', 'MASAS', 'be/masa-osea-rocha@1', ['talla', 'diametro-biestiloideo', 'diametro-femur'], 'masa-osea-rocha', 'kg', 1,
    'Masa ósea = 3,02 × (talla² × diámetro biestiloideo × diámetro bicondíleo del fémur × 400)^0,712, con las tres longitudes en metros. La misma ecuación para hombres y mujeres.', ROCHA,
    'Jóvenes brasileños de 17 a 25 años; se usa en adultos.'),
  M(31, 'MET-MASA-RESIDUAL-H', 'Masa residual (Würch), hombres', 'MASAS', 'be/masa-residual-wurch-hombres@1', ['peso'], 'masa-residual-wurch', 'kg', 1,
    'El 24,1 % del peso: órganos, vísceras y líquidos, según el modelo de cuatro componentes. Es una proporción fija: no cambia con la composición.', WURCH, 'Hombres adultos.'),
  M(32, 'MET-MASA-RESIDUAL-M', 'Masa residual (Würch), mujeres', 'MASAS', 'be/masa-residual-wurch-mujeres@1', ['peso'], 'masa-residual-wurch', 'kg', 1,
    'El 20,9 % del peso: órganos, vísceras y líquidos, según el modelo de cuatro componentes. Es una proporción fija: no cambia con la composición.', WURCH, 'Mujeres adultas.'),
  M(33, 'MET-MASA-MUSCULAR-4C-H', 'Masa muscular en cuatro componentes (De Rose y Guimarães), hombres', 'MASAS', 'be/masa-muscular-4c-hombres@1', CUATRO_C, 'masa-muscular-cuatro-componentes', 'kg', 1,
    'El peso menos la masa grasa (Faulkner), la masa ósea (Rocha) y la masa residual (Würch, 24,1 %). El músculo es lo que queda: arrastra los errores de las otras tres partes.', DE_ROSE,
    'Hombres; hereda la población de cada parte. No hay versión de mujeres con fuente.'),
  M(34, 'MET-MME-LEE-H', 'Masa muscular esquelética (Lee, perímetros), hombres', 'MASAS', 'be/masa-muscular-esqueletica-lee-hombres@1', LEE, 'masa-muscular-esqueletica-lee', 'kg', 1,
    'Con la talla, la edad y los perímetros de brazo, muslo medio y pantorrilla, cada uno corregido por su pliegue (perímetro − π × pliegue).', LEE_2000, POB_LEE),
  M(35, 'MET-MME-LEE-M', 'Masa muscular esquelética (Lee, perímetros), mujeres', 'MASAS', 'be/masa-muscular-esqueletica-lee-mujeres@1', LEE, 'masa-muscular-esqueletica-lee', 'kg', 1,
    'Con la talla, la edad y los perímetros de brazo, muslo medio y pantorrilla, cada uno corregido por su pliegue (perímetro − π × pliegue).', LEE_2000, POB_LEE),
  M(36, 'MET-MME-LEE-PESO-H', 'Masa muscular esquelética (Lee, peso y talla), hombres', 'MASAS', 'be/masa-muscular-esqueletica-lee-peso-hombres@1', ['peso', 'talla', 'edad'], 'masa-muscular-esqueletica-lee-peso', 'kg', 1,
    'Masa muscular = 0,244 × peso + 7,80 × talla (m) + 6,6 − 0,098 × edad − 3,3. Solo usa peso, talla y edad (error estándar de 2,8 kg).', LEE_2000, POB_LEE),
  M(37, 'MET-MME-LEE-PESO-M', 'Masa muscular esquelética (Lee, peso y talla), mujeres', 'MASAS', 'be/masa-muscular-esqueletica-lee-peso-mujeres@1', ['peso', 'talla', 'edad'], 'masa-muscular-esqueletica-lee-peso', 'kg', 1,
    'Masa muscular = 0,244 × peso + 7,80 × talla (m) − 0,098 × edad − 3,3. Solo usa peso, talla y edad (error estándar de 2,8 kg).', LEE_2000, POB_LEE),
  // ─── Somatotipo ───
  M(38, 'MET-SOMATOTIPO-ENDO', 'Endomorfia (Heath y Carter)', 'SOMATOTIPO', 'be/somatotipo-endomorfia@1', ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'talla'], 'endomorfia', ADIMENSIONAL, 1,
    'El primer componente del somatotipo: la adiposidad relativa, con la suma de tríceps, subescapular y supraespinal corregida por la talla. Si da cero o menos, el manual lo informa como 0,1.', HEATH_CARTER, 'Cualquier edad y sexo.'),
  M(39, 'MET-SOMATOTIPO-MESO', 'Mesomorfia (Heath y Carter)', 'SOMATOTIPO', 'be/somatotipo-mesomorfia@1', ['diametro-humero', 'diametro-femur', 'perimetro-brazo-flexionado', 'pliegue-triceps', 'perimetro-pantorrilla', 'pliegue-pantorrilla', 'talla'], 'mesomorfia', ADIMENSIONAL, 1,
    'El segundo componente del somatotipo: la robustez músculo-esquelética relativa a la talla, con los diámetros de húmero y fémur y los perímetros de brazo flexionado y pantorrilla corregidos por su pliegue. Si da cero o menos, el manual lo informa como 0,1.', HEATH_CARTER, 'Cualquier edad y sexo.'),
  M(40, 'MET-SOMATOTIPO-ECTO', 'Ectomorfia (Heath y Carter)', 'SOMATOTIPO', 'be/somatotipo-ectomorfia@1', ['talla', 'peso'], 'ectomorfia', ADIMENSIONAL, 1,
    'El tercer componente del somatotipo: la linealidad relativa, con el índice ponderal recíproco (talla sobre la raíz cúbica del peso).', HEATH_CARTER, 'Cualquier edad y sexo.'),
];

const hex2 = (n) => n.toString(16).padStart(2, '0');
const vistos = new Set();
for (const m of METODOS) {
  if (vistos.has(m.n)) throw new Error(`número repetido: ${m.n}`);
  vistos.add(m.n);
  m.especificacionId = `3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a3f${hex2(m.n)}`;
  m.versionId = `3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f${hex2(m.n)}`;
  for (const e of m.entradas) if (!UNIDAD[e]) throw new Error(`${m.clave}: la medición ${e} no está en el catálogo`);
  if (!SALIDAS[m.salida]) throw new Error(`${m.clave}: la salida ${m.salida} no tiene nombre`);
}

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
-- y la regla de dominio versionada que la aplica (packages/domain/src/formulas-antropometricas.ts). Salen de la ficha de
-- investigación (docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md), que trae los casos de prueba. BE no elige ninguna
-- (REG-06-205): el profesional ve qué pide cada método y qué da, y elige. Las que difieren por sexo son métodos
-- distintos. Las entradas usan las mediciones del protocolo «Perfil antropométrico completo», en sus unidades: kg, cm,
-- mm y años. Identificadores deterministas, iguales en todos los ambientes.
-- Generado por scripts/catalogo-antropometrico/catalogo-metodos.cjs.

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
