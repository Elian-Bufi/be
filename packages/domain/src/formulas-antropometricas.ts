/**
 * DL-111 · las fórmulas del catálogo antropométrico de BE, como reglas de dominio versionadas (REG-06-156).
 *
 * Cada regla recibe los valores vigentes de sus entradas **por clave de medición** (`peso`, `talla`, `pliegue-triceps`…),
 * cada una en la única unidad que su método admite: kilogramos, centímetros, milímetros y años. La unidad la garantiza la
 * admisibilidad (REG-06-204) antes de ejecutar; la regla no convierte nada en silencio. Las conversiones que pide una
 * ecuación (centímetros a metros, milímetros a centímetros) están escritas en la propia regla, a la vista.
 *
 * Una regla devuelve un solo resultado: el método da una sola salida. Cuando una ecuación encadena pasos (densidad y
 * después porcentaje de grasa con Siri o con Brozek), la cadena entera vive en la regla, sin redondear en el medio. Las
 * ecuaciones que difieren por sexo son métodos distintos: el sexo no es un dato de la toma, lo elige el profesional al
 * elegir el método. Un resultado sin sentido físico (un porcentaje de grasa o una masa de cero o menos) no se publica:
 * es un error de dominio, como una entrada en cero (D-6 de la ficha).
 *
 * Fuentes, poblaciones, sitios y casos de prueba: `docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md` (MA-01 a MA-58);
 * las pruebas de este módulo usan sus personas y sus casos. Ninguna regla califica el resultado (TEST-PRJ-009):
 * devuelven números, nunca categorías.
 */

/** Los valores vigentes de las entradas, por clave de medición. */
export type ValoresDeEntrada = Readonly<Record<string, number>>;
export type ReglaDeCalculo = (e: ValoresDeEntrada) => number | { error: string };
type Resultado = number | { error: string };

/** El valor de una entrada; la admisibilidad garantiza que está. */
const val = (e: ValoresDeEntrada, clave: string): number => e[clave] ?? Number.NaN;

/** Las entradas que tienen que ser mayores que cero para que la ecuación tenga sentido. */
function positivas(e: ValoresDeEntrada, claves: readonly string[]): { error: string } | null {
  const mala = claves.find((c) => !(val(e, c) > 0));
  return mala ? { error: `la medición ${mala} tiene que ser mayor que cero` } : null;
}

const suma = (e: ValoresDeEntrada, claves: readonly string[]): number => claves.reduce((n, c) => n + val(e, c), 0);

/** Encadena: si el paso anterior fue un error, sigue el error; si no, aplica la función. */
const luego = (r: Resultado, f: (x: number) => Resultado): Resultado => (typeof r === 'number' ? f(r) : r);

/** D-6: un porcentaje de grasa o una masa de cero o menos queda fuera del dominio físico de la ecuación. */
const positivo =
  (que: string) =>
  (x: number): Resultado =>
    x > 0 ? x : { error: `la ecuación da ${que} de cero o menos con estos datos: queda fuera de su dominio` };
const porcentaje = positivo('un porcentaje de grasa');
const masa = positivo('una masa');

/** Siri (1961) y Brozek y col. (1963): porcentaje de grasa a partir de la densidad corporal, en g/ml. */
const siri = (densidad: number): Resultado => (densidad > 0 ? porcentaje(495 / densidad - 450) : { error: 'la densidad calculada no es positiva' });
const brozek = (densidad: number): Resultado => (densidad > 0 ? porcentaje(457 / densidad - 414.2) : { error: 'la densidad calculada no es positiva' });
type Conversion = (densidad: number) => Resultado;

// ─── Sitios de cada suma (ficha, §2) ────────────────────────────────────────────────────────────

/** ISAK, seis pliegues (Carter; Stewart y col., 2011). */
export const PLIEGUES_ISAK_6 = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal', 'pliegue-muslo-frontal', 'pliegue-pantorrilla'] as const;
/** ISAK, ocho pliegues: los seis más bíceps y cresta ilíaca. */
export const PLIEGUES_ISAK_8 = [...PLIEGUES_ISAK_6, 'pliegue-biceps', 'pliegue-cresta-iliaca'] as const;
/**
 * Jackson y Pollock, siete pliegues. Su «suprailíaco» se toma «inmediatamente por encima de la cresta ilíaca» (ACSM): en
 * BE es el de la cresta ilíaca, como hace el consenso del GREC (decisión D-1 de la ficha, a ratificar). El supraespinal
 * queda varios centímetros más arriba y daría entre 1 y 2 puntos menos de grasa.
 */
export const PLIEGUES_JP_7 = ['pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-abdominal', 'pliegue-cresta-iliaca', 'pliegue-muslo-frontal'] as const;
export const PLIEGUES_JP_3_HOMBRES = ['pliegue-pectoral', 'pliegue-abdominal', 'pliegue-muslo-frontal'] as const;
export const PLIEGUES_JP_3_MUJERES = ['pliegue-triceps', 'pliegue-cresta-iliaca', 'pliegue-muslo-frontal'] as const;
/** Durnin y Womersley, cuatro pliegues. Su «suprailíaco» es «just above the iliac crest in the mid-axillary line»: la cresta ilíaca de ISAK. */
export const PLIEGUES_DW_4 = ['pliegue-biceps', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-cresta-iliaca'] as const;
/** Faulkner (1968), cuatro pliegues; su suprailíaco es el supraespinal (GREC; ficha, E-9) y su umbilical, el abdominal. */
export const PLIEGUES_FAULKNER_4 = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal'] as const;

// ─── Densidad: Durnin y Womersley (1974) ────────────────────────────────────────────────────────

/** Densidad = c − m · log10(Σ4), por franja de edad: tabla 5 del original, fila «All four skinfolds». */
const DURNIN_WOMERSLEY = {
  HOMBRES: [
    { desde: 17, hasta: 20, c: 1.162, m: 0.063 },
    { desde: 20, hasta: 30, c: 1.1631, m: 0.0632 },
    { desde: 30, hasta: 40, c: 1.1422, m: 0.0544 },
    { desde: 40, hasta: 50, c: 1.162, m: 0.07 },
    { desde: 50, hasta: Number.POSITIVE_INFINITY, c: 1.1715, m: 0.0779 },
  ],
  MUJERES: [
    { desde: 16, hasta: 20, c: 1.1549, m: 0.0678 },
    { desde: 20, hasta: 30, c: 1.1599, m: 0.0717 },
    { desde: 30, hasta: 40, c: 1.1423, m: 0.0632 },
    { desde: 40, hasta: 50, c: 1.1333, m: 0.0612 },
    { desde: 50, hasta: Number.POSITIVE_INFINITY, c: 1.1339, m: 0.0645 },
  ],
} as const;
type Sexo = keyof typeof DURNIN_WOMERSLEY;

function densidadDurninWomersley(sexo: Sexo, e: ValoresDeEntrada): Resultado {
  const malo = positivas(e, [...PLIEGUES_DW_4, 'edad']);
  if (malo) return malo;
  const edad = val(e, 'edad');
  const franja = DURNIN_WOMERSLEY[sexo].find((f) => edad >= f.desde && edad < f.hasta);
  // Las franjas son intervalos semiabiertos (17 ≤ edad < 20…). Debajo de la primera no hay coeficientes: no se extrapola.
  if (!franja) return { error: `la ecuación no tiene coeficientes para ${edad} años (desde ${DURNIN_WOMERSLEY[sexo][0].desde})` };
  return franja.c - franja.m * Math.log10(suma(e, PLIEGUES_DW_4));
}

// ─── Densidad: Jackson y Pollock (1978) y Jackson, Pollock y Ward (1980) ──────────────────────────

/** Densidad = a − b · S + c · S² − d · edad. */
const JACKSON_POLLOCK = {
  SIETE_HOMBRES: { pliegues: PLIEGUES_JP_7, a: 1.112, b: 0.00043499, c: 0.00000055, d: 0.00028826 },
  SIETE_MUJERES: { pliegues: PLIEGUES_JP_7, a: 1.097, b: 0.00046971, c: 0.00000056, d: 0.00012828 },
  TRES_HOMBRES: { pliegues: PLIEGUES_JP_3_HOMBRES, a: 1.10938, b: 0.0008267, c: 0.0000016, d: 0.0002574 },
  TRES_MUJERES: { pliegues: PLIEGUES_JP_3_MUJERES, a: 1.0994921, b: 0.0009929, c: 0.0000023, d: 0.0001392 },
} as const;

function densidadJacksonPollock(ecuacion: keyof typeof JACKSON_POLLOCK, e: ValoresDeEntrada): Resultado {
  const k = JACKSON_POLLOCK[ecuacion];
  const malo = positivas(e, [...k.pliegues, 'edad']);
  if (malo) return malo;
  const s = suma(e, k.pliegues);
  return k.a - k.b * s + k.c * s * s - k.d * val(e, 'edad');
}

// ─── Porcentaje de grasa directo ─────────────────────────────────────────────────────────────────

/** Faulkner (1968), solo hombres: 0,153 · Σ4 + 5,783. */
const porcentajeFaulkner = (e: ValoresDeEntrada): number => 0.153 * suma(e, PLIEGUES_FAULKNER_4) + 5.783;

/** Yuhasz modificada por Carter (1982), con la suma de 6 pliegues ISAK. */
const YUHASZ_CARTER = { HOMBRES: { pendiente: 0.1051, constante: 2.585 }, MUJERES: { pendiente: 0.1548, constante: 3.58 } } as const;

/** RFM, Woolcott y Bergman (2018): 64 − 20 · talla / cintura en hombres; 76 en mujeres. */
const RFM = { HOMBRES: 64, MUJERES: 76 } as const;

/** Deurenberg y col. (1991), adultos: 1,2 · IMC + 0,23 · edad − 10,8 · sexo − 5,4. */
const DEURENBERG = { HOMBRES: 16.2, MUJERES: 5.4 } as const;

const imc = (e: ValoresDeEntrada): number => val(e, 'peso') / (val(e, 'talla') / 100) ** 2;

// ─── Masas ───────────────────────────────────────────────────────────────────────────────────────

/** Von Döbeln modificada por Rocha (1975): 3,02 · (talla² · biestiloideo · bicondíleo del fémur · 400)^0,712, en metros. */
const masaOseaRocha = (e: ValoresDeEntrada): number => {
  const talla = val(e, 'talla') / 100;
  return 3.02 * (talla * talla * (val(e, 'diametro-biestiloideo') / 100) * (val(e, 'diametro-femur') / 100) * 400) ** 0.712;
};

/** Würch (1974): la masa residual es el 24,1 % del peso en hombres y el 20,9 % en mujeres. */
const FRACCION_RESIDUAL = { HOMBRES: 0.241, MUJERES: 0.209 } as const;

/**
 * De Rose y Guimarães (1980), cuatro componentes, solo hombres: el peso menos la grasa de Faulkner, el hueso de Rocha y el
 * residuo de Würch. No hay versión de mujeres con fuente: la grasa de Faulkner es de hombres (D-11 de la ficha).
 */
const masaMuscularCuatroComponentes: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['peso', 'talla', 'diametro-biestiloideo', 'diametro-femur', ...PLIEGUES_FAULKNER_4]);
  if (malo) return malo;
  const peso = val(e, 'peso');
  return masa(peso - (peso * porcentajeFaulkner(e)) / 100 - masaOseaRocha(e) - peso * FRACCION_RESIDUAL.HOMBRES);
};

/**
 * Lee y col. (2000), modelo con perímetros: MME = talla (m) · (0,00744 · PBC² + 0,00088 · PMC² + 0,00441 · PPC²) + 2,4 ·
 * sexo − 0,048 · edad + etnia + 7,8, con cada perímetro corregido por su pliegue (perímetro − π · pliegue en cm). BE
 * aplica el término de etnia de la muestra blanca e hispana (0) y lo dice en la ficha del método (D-2): no registra ni
 * infiere etnia.
 */
function masaMuscularLeePerimetros(sexo: Sexo): ReglaDeCalculo {
  return (e) => {
    const malo = positivas(e, ['talla', 'edad', 'perimetro-brazo-relajado', 'perimetro-muslo', 'perimetro-pantorrilla', 'pliegue-triceps', 'pliegue-muslo-frontal', 'pliegue-pantorrilla']);
    if (malo) return malo;
    const corregido = (perimetro: string, pliegue: string) => val(e, perimetro) - (Math.PI * val(e, pliegue)) / 10;
    const brazo = corregido('perimetro-brazo-relajado', 'pliegue-triceps');
    const muslo = corregido('perimetro-muslo', 'pliegue-muslo-frontal');
    const pantorrilla = corregido('perimetro-pantorrilla', 'pliegue-pantorrilla');
    const talla = val(e, 'talla') / 100;
    return masa(talla * (0.00744 * brazo * brazo + 0.00088 * muslo * muslo + 0.00441 * pantorrilla * pantorrilla) + (sexo === 'HOMBRES' ? 2.4 : 0) - 0.048 * val(e, 'edad') + 7.8);
  };
}

/** Lee y col. (2000), modelo con peso y talla: 0,244 · peso + 7,80 · talla (m) + 6,6 · sexo − 0,098 · edad + etnia − 3,3. */
function masaMuscularLeePeso(sexo: Sexo): ReglaDeCalculo {
  return (e) => positivas(e, ['peso', 'talla', 'edad']) ?? masa(0.244 * val(e, 'peso') + 7.8 * (val(e, 'talla') / 100) + (sexo === 'HOMBRES' ? 6.6 : 0) - 0.098 * val(e, 'edad') - 3.3);
}

// ─── Somatotipo antropométrico de Heath y Carter (manual de Carter, 2002) ──────────────────────────

/** El manual: un componente de cero o menos se informa como 0,1, el mínimo de la escala. */
const componente = (x: number): number => (x > 0 ? x : 0.1);

const endomorfia: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'talla']);
  if (malo) return malo;
  // Suma de tres pliegues corregida por la talla (170,18 cm es la talla de referencia de Heath y Carter).
  const x = suma(e, ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal']) * (170.18 / val(e, 'talla'));
  return componente(-0.7182 + 0.1451 * x - 0.00068 * x * x + 0.0000014 * x * x * x);
};

const mesomorfia: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['diametro-humero', 'diametro-femur', 'perimetro-brazo-flexionado', 'perimetro-pantorrilla', 'pliegue-triceps', 'pliegue-pantorrilla', 'talla']);
  if (malo) return malo;
  // Los perímetros se corrigen restando el pliegue en centímetros (mm / 10), sin π.
  const brazo = val(e, 'perimetro-brazo-flexionado') - val(e, 'pliegue-triceps') / 10;
  const pantorrilla = val(e, 'perimetro-pantorrilla') - val(e, 'pliegue-pantorrilla') / 10;
  return componente(0.858 * val(e, 'diametro-humero') + 0.601 * val(e, 'diametro-femur') + 0.188 * brazo + 0.161 * pantorrilla - 0.131 * val(e, 'talla') + 4.5);
};

const ectomorfia: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['talla', 'peso']);
  if (malo) return malo;
  // Índice ponderal recíproco: talla (cm) sobre la raíz cúbica del peso (kg). Las ramas no empalman en 40,75: así es en
  // la fuente.
  const ipr = val(e, 'talla') / Math.cbrt(val(e, 'peso'));
  if (ipr >= 40.75) return 0.732 * ipr - 28.58;
  if (ipr > 38.25) return 0.463 * ipr - 17.63;
  return 0.1;
};

// ─── El registro ────────────────────────────────────────────────────────────────────────────────

const cociente =
  (numerador: string, denominador: string): ReglaDeCalculo =>
  (e) =>
    positivas(e, [numerador, denominador]) ?? val(e, numerador) / val(e, denominador);

const sumaDe =
  (pliegues: readonly string[]): ReglaDeCalculo =>
  (e) =>
    positivas(e, pliegues) ?? suma(e, pliegues);

const conDensidadDW =
  (sexo: Sexo, conversion: Conversion): ReglaDeCalculo =>
  (e) =>
    luego(densidadDurninWomersley(sexo, e), conversion);
const conDensidadJP =
  (ecuacion: keyof typeof JACKSON_POLLOCK, conversion: Conversion): ReglaDeCalculo =>
  (e) =>
    luego(densidadJacksonPollock(ecuacion, e), conversion);

/** Las reglas del catálogo de BE, por identificador versionado. Una regla nunca cambia: una corrección es otra versión. */
export const REGLAS_ANTROPOMETRICAS: Readonly<Record<string, ReglaDeCalculo>> = {
  // Índices
  'be/imc@1': (e) => positivas(e, ['peso', 'talla']) ?? imc(e),
  'be/indice-cintura-cadera@1': cociente('perimetro-cintura', 'perimetro-cadera'),
  'be/indice-cintura-talla@1': cociente('perimetro-cintura', 'talla'),
  'be/indice-conicidad@1': (e) => positivas(e, ['perimetro-cintura', 'peso', 'talla']) ?? val(e, 'perimetro-cintura') / 100 / (0.109 * Math.sqrt(val(e, 'peso') / (val(e, 'talla') / 100))),
  // Sumas de pliegues
  'be/suma-6-pliegues-isak@1': sumaDe(PLIEGUES_ISAK_6),
  'be/suma-8-pliegues-isak@1': sumaDe(PLIEGUES_ISAK_8),
  'be/suma-7-pliegues-jackson-pollock@1': sumaDe(PLIEGUES_JP_7),
  // Porcentaje de grasa por densidad, con Siri y con Brozek
  'be/grasa-durnin-womersley-hombres@1': conDensidadDW('HOMBRES', siri),
  'be/grasa-durnin-womersley-mujeres@1': conDensidadDW('MUJERES', siri),
  'be/grasa-durnin-womersley-brozek-hombres@1': conDensidadDW('HOMBRES', brozek),
  'be/grasa-durnin-womersley-brozek-mujeres@1': conDensidadDW('MUJERES', brozek),
  'be/grasa-jackson-pollock-7-hombres@1': conDensidadJP('SIETE_HOMBRES', siri),
  'be/grasa-jackson-pollock-7-mujeres@1': conDensidadJP('SIETE_MUJERES', siri),
  'be/grasa-jackson-pollock-7-brozek-hombres@1': conDensidadJP('SIETE_HOMBRES', brozek),
  'be/grasa-jackson-pollock-7-brozek-mujeres@1': conDensidadJP('SIETE_MUJERES', brozek),
  'be/grasa-jackson-pollock-3-hombres@1': conDensidadJP('TRES_HOMBRES', siri),
  'be/grasa-jackson-pollock-3-mujeres@1': conDensidadJP('TRES_MUJERES', siri),
  'be/grasa-jackson-pollock-3-brozek-hombres@1': conDensidadJP('TRES_HOMBRES', brozek),
  'be/grasa-jackson-pollock-3-brozek-mujeres@1': conDensidadJP('TRES_MUJERES', brozek),
  // Porcentaje de grasa directo
  'be/grasa-faulkner@1': (e) => positivas(e, PLIEGUES_FAULKNER_4) ?? porcentaje(porcentajeFaulkner(e)),
  'be/grasa-yuhasz-carter-hombres@1': (e) => positivas(e, PLIEGUES_ISAK_6) ?? porcentaje(YUHASZ_CARTER.HOMBRES.pendiente * suma(e, PLIEGUES_ISAK_6) + YUHASZ_CARTER.HOMBRES.constante),
  'be/grasa-yuhasz-carter-mujeres@1': (e) => positivas(e, PLIEGUES_ISAK_6) ?? porcentaje(YUHASZ_CARTER.MUJERES.pendiente * suma(e, PLIEGUES_ISAK_6) + YUHASZ_CARTER.MUJERES.constante),
  'be/grasa-rfm-hombres@1': (e) => positivas(e, ['talla', 'perimetro-cintura']) ?? porcentaje(RFM.HOMBRES - (20 * val(e, 'talla')) / val(e, 'perimetro-cintura')),
  'be/grasa-rfm-mujeres@1': (e) => positivas(e, ['talla', 'perimetro-cintura']) ?? porcentaje(RFM.MUJERES - (20 * val(e, 'talla')) / val(e, 'perimetro-cintura')),
  'be/grasa-bai@1': (e) => positivas(e, ['perimetro-cadera', 'talla']) ?? porcentaje(val(e, 'perimetro-cadera') / (val(e, 'talla') / 100) ** 1.5 - 18),
  'be/grasa-deurenberg-hombres@1': (e) => positivas(e, ['peso', 'talla', 'edad']) ?? porcentaje(1.2 * imc(e) + 0.23 * val(e, 'edad') - DEURENBERG.HOMBRES),
  'be/grasa-deurenberg-mujeres@1': (e) => positivas(e, ['peso', 'talla', 'edad']) ?? porcentaje(1.2 * imc(e) + 0.23 * val(e, 'edad') - DEURENBERG.MUJERES),
  // Masas
  'be/masa-grasa-faulkner@1': (e) => positivas(e, ['peso', ...PLIEGUES_FAULKNER_4]) ?? masa((val(e, 'peso') * porcentajeFaulkner(e)) / 100),
  'be/masa-libre-de-grasa-faulkner@1': (e) => positivas(e, ['peso', ...PLIEGUES_FAULKNER_4]) ?? masa(val(e, 'peso') * (1 - porcentajeFaulkner(e) / 100)),
  'be/masa-osea-rocha@1': (e) => positivas(e, ['talla', 'diametro-biestiloideo', 'diametro-femur']) ?? masaOseaRocha(e),
  'be/masa-residual-wurch-hombres@1': (e) => positivas(e, ['peso']) ?? val(e, 'peso') * FRACCION_RESIDUAL.HOMBRES,
  'be/masa-residual-wurch-mujeres@1': (e) => positivas(e, ['peso']) ?? val(e, 'peso') * FRACCION_RESIDUAL.MUJERES,
  'be/masa-muscular-4c-hombres@1': masaMuscularCuatroComponentes,
  'be/masa-muscular-esqueletica-lee-hombres@1': masaMuscularLeePerimetros('HOMBRES'),
  'be/masa-muscular-esqueletica-lee-mujeres@1': masaMuscularLeePerimetros('MUJERES'),
  'be/masa-muscular-esqueletica-lee-peso-hombres@1': masaMuscularLeePeso('HOMBRES'),
  'be/masa-muscular-esqueletica-lee-peso-mujeres@1': masaMuscularLeePeso('MUJERES'),
  // Somatotipo
  'be/somatotipo-endomorfia@1': endomorfia,
  'be/somatotipo-mesomorfia@1': mesomorfia,
  'be/somatotipo-ectomorfia@1': ectomorfia,
};
