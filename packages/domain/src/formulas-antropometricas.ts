/**
 * DL-111 · las fórmulas del catálogo antropométrico de BE, como reglas de dominio versionadas (REG-06-156).
 *
 * Cada regla recibe los valores vigentes de sus entradas **por clave de medición** (`peso`, `talla`, `pliegue-triceps`…),
 * cada una en la única unidad que su método admite: kilogramos, centímetros, milímetros y años. La unidad la garantiza la
 * admisibilidad (REG-06-204) antes de ejecutar; la regla no convierte nada en silencio. Las conversiones que pide una
 * ecuación (centímetros a metros, milímetros a centímetros) están escritas en la propia regla, a la vista.
 *
 * Una regla devuelve un solo resultado: el método da una sola salida. Cuando una ecuación encadena pasos (densidad y
 * después porcentaje de grasa con Siri), la cadena entera vive en la regla. Las ecuaciones que difieren por sexo son
 * métodos distintos: el sexo no es un dato de la toma, lo elige el profesional al elegir el método.
 *
 * Fuentes, poblaciones y casos de prueba: `docs/propuestas/METODOS-ANTROPOMETRICOS_ficha.md`. Ninguna regla califica el
 * resultado (TEST-PRJ-009): devuelven números, nunca categorías.
 */

/** Los valores vigentes de las entradas, por clave de medición. */
export type ValoresDeEntrada = Readonly<Record<string, number>>;
export type ReglaDeCalculo = (e: ValoresDeEntrada) => number | { error: string };

/** El valor de una entrada; la admisibilidad garantiza que está. */
const val = (e: ValoresDeEntrada, clave: string): number => e[clave] ?? Number.NaN;

/** Las entradas que tienen que ser mayores que cero para que la ecuación tenga sentido. */
function positivas(e: ValoresDeEntrada, claves: readonly string[]): { error: string } | null {
  const mala = claves.find((c) => !(val(e, c) > 0));
  return mala ? { error: `la medición ${mala} tiene que ser mayor que cero` } : null;
}

const suma = (e: ValoresDeEntrada, claves: readonly string[]): number => claves.reduce((n, c) => n + val(e, c), 0);

/** Siri (1961): porcentaje de grasa a partir de la densidad corporal, en g/cm³. */
const siri = (densidad: number): number => 495 / densidad - 450;

// ─── Sitios de cada suma ────────────────────────────────────────────────────────────────────────

/** ISAK, seis pliegues (Stewart y col., 2011). */
export const PLIEGUES_ISAK_6 = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal', 'pliegue-muslo-frontal', 'pliegue-pantorrilla'] as const;
/** ISAK, ocho pliegues: los seis más bíceps y cresta ilíaca. */
export const PLIEGUES_ISAK_8 = [...PLIEGUES_ISAK_6, 'pliegue-biceps', 'pliegue-cresta-iliaca'] as const;
/**
 * Jackson y Pollock, siete pliegues. El «suprailíaco» de Jackson y Pollock se toma en la línea axilar anterior, sobre
 * la cresta ilíaca: en BE es el supraespinal.
 */
export const PLIEGUES_JP_7 = ['pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-abdominal', 'pliegue-supraespinal', 'pliegue-muslo-frontal'] as const;
export const PLIEGUES_JP_3_HOMBRES = ['pliegue-pectoral', 'pliegue-abdominal', 'pliegue-muslo-frontal'] as const;
export const PLIEGUES_JP_3_MUJERES = ['pliegue-triceps', 'pliegue-supraespinal', 'pliegue-muslo-frontal'] as const;
/**
 * Durnin y Womersley, cuatro pliegues. Su «suprailíaco» se toma en la línea medioaxilar, sobre la cresta ilíaca: en
 * BE es el de la cresta ilíaca.
 */
export const PLIEGUES_DW_4 = ['pliegue-biceps', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-cresta-iliaca'] as const;
/** Faulkner (1968), cuatro pliegues; su suprailíaco es el supraespinal. */
export const PLIEGUES_FAULKNER_4 = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal'] as const;

// ─── Durnin y Womersley (1974) ──────────────────────────────────────────────────────────────────

/** Los coeficientes de densidad = c − m · log10(Σ4), por franja de edad (Durnin y Womersley, 1974, tabla 4). */
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

function durninWomersley(sexo: keyof typeof DURNIN_WOMERSLEY): ReglaDeCalculo {
  return (e) => {
    const malo = positivas(e, [...PLIEGUES_DW_4, 'edad']);
    if (malo) return malo;
    const edad = val(e, 'edad');
    const franja = DURNIN_WOMERSLEY[sexo].find((f) => edad >= f.desde && edad < f.hasta);
    if (!franja) return { error: `la ecuación no tiene coeficientes para ${edad} años (desde ${DURNIN_WOMERSLEY[sexo][0].desde})` };
    return siri(franja.c - franja.m * Math.log10(suma(e, PLIEGUES_DW_4)));
  };
}

// ─── Jackson y Pollock (1978) y Jackson, Pollock y Ward (1980) ───────────────────────────────────

function jacksonPollock(pliegues: readonly string[], k: { a: number; b: number; c: number; d: number }): ReglaDeCalculo {
  return (e) => {
    const malo = positivas(e, [...pliegues, 'edad']);
    if (malo) return malo;
    const s = suma(e, pliegues);
    return siri(k.a - k.b * s + k.c * s * s - k.d * val(e, 'edad'));
  };
}

// ─── Composición en cuatro componentes (De Rose y Guimarães, 1980) ───────────────────────────────

/** Faulkner (1968): porcentaje de grasa = 0,153 · Σ4 + 5,783. */
const porcentajeFaulkner = (e: ValoresDeEntrada): number => 0.153 * suma(e, PLIEGUES_FAULKNER_4) + 5.783;

/**
 * Von Döbeln modificada por Rocha (1975): masa ósea = 3,02 · (talla² · biestiloideo · bicondíleo del fémur · 400)^0,712,
 * con las tres longitudes en metros.
 */
const masaOseaRocha = (e: ValoresDeEntrada): number => {
  const talla = val(e, 'talla') / 100;
  return 3.02 * (talla * talla * (val(e, 'diametro-biestiloideo') / 100) * (val(e, 'diametro-femur') / 100) * 400) ** 0.712;
};

/** Würch (1974): la masa residual es el 24,1 % del peso en hombres y el 20,9 % en mujeres. */
const FRACCION_RESIDUAL = { HOMBRES: 0.241, MUJERES: 0.209 } as const;

function masaMuscularCuatroComponentes(sexo: keyof typeof FRACCION_RESIDUAL): ReglaDeCalculo {
  return (e) => {
    const malo = positivas(e, ['peso', 'talla', 'diametro-biestiloideo', 'diametro-femur', ...PLIEGUES_FAULKNER_4]);
    if (malo) return malo;
    const peso = val(e, 'peso');
    const grasa = (peso * porcentajeFaulkner(e)) / 100;
    return peso - grasa - masaOseaRocha(e) - peso * FRACCION_RESIDUAL[sexo];
  };
}

// ─── Lee y col. (2000): masa muscular esquelética ────────────────────────────────────────────────

/**
 * MME = talla (m) · (0,00744 · PBC² + 0,00088 · PMC² + 0,00441 · PPC²) + 2,4 · sexo − 0,048 · edad + etnia + 7,8, con
 * los perímetros corregidos por el pliegue (perímetro − π · pliegue, en cm). BE aplica el término de etnia de la muestra
 * blanca e hispana (0): la ecuación suma −2,0 para personas asiáticas y +1,1 para afroamericanas, y eso lo decide el
 * profesional, no BE.
 */
function masaMuscularLee(sexo: 0 | 1): ReglaDeCalculo {
  return (e) => {
    const malo = positivas(e, ['talla', 'edad', 'perimetro-brazo-relajado', 'perimetro-muslo', 'perimetro-pantorrilla', 'pliegue-triceps', 'pliegue-muslo-frontal', 'pliegue-pantorrilla']);
    if (malo) return malo;
    const corregido = (perimetro: string, pliegue: string) => val(e, perimetro) - Math.PI * (val(e, pliegue) / 10);
    const brazo = corregido('perimetro-brazo-relajado', 'pliegue-triceps');
    const muslo = corregido('perimetro-muslo', 'pliegue-muslo-frontal');
    const pantorrilla = corregido('perimetro-pantorrilla', 'pliegue-pantorrilla');
    return (val(e, 'talla') / 100) * (0.00744 * brazo * brazo + 0.00088 * muslo * muslo + 0.00441 * pantorrilla * pantorrilla) + 2.4 * sexo - 0.048 * val(e, 'edad') + 7.8;
  };
}

// ─── US Navy (Hodgdon y Beckett, 1984), en centímetros ────────────────────────────────────────────

const navyHombres: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['perimetro-abdomen', 'perimetro-cuello', 'talla']);
  if (malo) return malo;
  const diferencia = val(e, 'perimetro-abdomen') - val(e, 'perimetro-cuello');
  if (!(diferencia > 0)) return { error: 'el perímetro del abdomen tiene que ser mayor que el del cuello' };
  return 495 / (1.0324 - 0.19077 * Math.log10(diferencia) + 0.15456 * Math.log10(val(e, 'talla'))) - 450;
};

const navyMujeres: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['perimetro-cintura', 'perimetro-cadera', 'perimetro-cuello', 'talla']);
  if (malo) return malo;
  const diferencia = val(e, 'perimetro-cintura') + val(e, 'perimetro-cadera') - val(e, 'perimetro-cuello');
  if (!(diferencia > 0)) return { error: 'cintura más cadera tiene que ser mayor que el perímetro del cuello' };
  return 495 / (1.29579 - 0.35004 * Math.log10(diferencia) + 0.221 * Math.log10(val(e, 'talla'))) - 450;
};

// ─── Somatotipo antropométrico de Heath y Carter (Carter y Heath, 1990) ──────────────────────────

const endomorfia: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'talla']);
  if (malo) return malo;
  // Suma de tres pliegues corregida por la talla (170,18 cm es la talla de referencia de Heath y Carter).
  const x = suma(e, ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal']) * (170.18 / val(e, 'talla'));
  return -0.7182 + 0.1451 * x - 0.00068 * x * x + 0.0000014 * x * x * x;
};

const mesomorfia: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['diametro-humero', 'diametro-femur', 'perimetro-brazo-flexionado', 'perimetro-pantorrilla', 'pliegue-triceps', 'pliegue-pantorrilla', 'talla']);
  if (malo) return malo;
  // Los perímetros se corrigen restando el pliegue en centímetros (mm / 10).
  const brazo = val(e, 'perimetro-brazo-flexionado') - val(e, 'pliegue-triceps') / 10;
  const pantorrilla = val(e, 'perimetro-pantorrilla') - val(e, 'pliegue-pantorrilla') / 10;
  return 0.858 * val(e, 'diametro-humero') + 0.601 * val(e, 'diametro-femur') + 0.188 * brazo + 0.161 * pantorrilla - 0.131 * val(e, 'talla') + 4.5;
};

const ectomorfia: ReglaDeCalculo = (e) => {
  const malo = positivas(e, ['talla', 'peso']);
  if (malo) return malo;
  // Índice ponderal recíproco: talla (cm) sobre la raíz cúbica del peso (kg).
  const ipr = val(e, 'talla') / Math.cbrt(val(e, 'peso'));
  if (ipr >= 40.75) return 0.732 * ipr - 28.58;
  if (ipr > 38.25) return 0.463 * ipr - 17.63;
  return 0.1;
};

// ─── El registro ────────────────────────────────────────────────────────────────────────────────

const indice =
  (numerador: string, denominador: string, factor = 1): ReglaDeCalculo =>
  (e) =>
    positivas(e, [numerador, denominador]) ?? val(e, numerador) / (val(e, denominador) * factor);

const sumaDe =
  (pliegues: readonly string[]): ReglaDeCalculo =>
  (e) =>
    positivas(e, pliegues) ?? suma(e, pliegues);

/** Las reglas del catálogo de BE, por identificador versionado. Una regla nunca cambia: una corrección es otra versión. */
export const REGLAS_ANTROPOMETRICAS: Readonly<Record<string, ReglaDeCalculo>> = {
  // Índices
  'be/imc@1': (e) => positivas(e, ['peso', 'talla']) ?? val(e, 'peso') / (val(e, 'talla') / 100) ** 2,
  'be/indice-cintura-cadera@1': indice('perimetro-cintura', 'perimetro-cadera'),
  'be/indice-cintura-talla@1': indice('perimetro-cintura', 'talla'),
  // Sumas de pliegues
  'be/suma-6-pliegues-isak@1': sumaDe(PLIEGUES_ISAK_6),
  'be/suma-8-pliegues-isak@1': sumaDe(PLIEGUES_ISAK_8),
  'be/suma-7-pliegues-jackson-pollock@1': sumaDe(PLIEGUES_JP_7),
  // Porcentaje de grasa
  'be/grasa-durnin-womersley-hombres@1': durninWomersley('HOMBRES'),
  'be/grasa-durnin-womersley-mujeres@1': durninWomersley('MUJERES'),
  'be/grasa-jackson-pollock-7-hombres@1': jacksonPollock(PLIEGUES_JP_7, { a: 1.112, b: 0.00043499, c: 0.00000055, d: 0.00028826 }),
  'be/grasa-jackson-pollock-7-mujeres@1': jacksonPollock(PLIEGUES_JP_7, { a: 1.097, b: 0.00046971, c: 0.00000056, d: 0.00012828 }),
  'be/grasa-jackson-pollock-3-hombres@1': jacksonPollock(PLIEGUES_JP_3_HOMBRES, { a: 1.10938, b: 0.0008267, c: 0.0000016, d: 0.0002574 }),
  'be/grasa-jackson-pollock-3-mujeres@1': jacksonPollock(PLIEGUES_JP_3_MUJERES, { a: 1.0994921, b: 0.0009929, c: 0.0000023, d: 0.0001392 }),
  'be/grasa-faulkner@1': (e) => positivas(e, PLIEGUES_FAULKNER_4) ?? porcentajeFaulkner(e),
  'be/grasa-navy-hombres@1': navyHombres,
  'be/grasa-navy-mujeres@1': navyMujeres,
  'be/grasa-deurenberg-hombres@1': (e) => positivas(e, ['peso', 'talla', 'edad']) ?? 1.2 * (val(e, 'peso') / (val(e, 'talla') / 100) ** 2) + 0.23 * val(e, 'edad') - 16.2,
  'be/grasa-deurenberg-mujeres@1': (e) => positivas(e, ['peso', 'talla', 'edad']) ?? 1.2 * (val(e, 'peso') / (val(e, 'talla') / 100) ** 2) + 0.23 * val(e, 'edad') - 5.4,
  // Masas
  'be/masa-grasa-faulkner@1': (e) => positivas(e, ['peso', ...PLIEGUES_FAULKNER_4]) ?? (val(e, 'peso') * porcentajeFaulkner(e)) / 100,
  'be/masa-libre-de-grasa-faulkner@1': (e) => positivas(e, ['peso', ...PLIEGUES_FAULKNER_4]) ?? val(e, 'peso') * (1 - porcentajeFaulkner(e) / 100),
  'be/masa-osea-rocha@1': (e) => positivas(e, ['talla', 'diametro-biestiloideo', 'diametro-femur']) ?? masaOseaRocha(e),
  'be/masa-residual-wurch-hombres@1': (e) => positivas(e, ['peso']) ?? val(e, 'peso') * FRACCION_RESIDUAL.HOMBRES,
  'be/masa-residual-wurch-mujeres@1': (e) => positivas(e, ['peso']) ?? val(e, 'peso') * FRACCION_RESIDUAL.MUJERES,
  'be/masa-muscular-4c-hombres@1': masaMuscularCuatroComponentes('HOMBRES'),
  'be/masa-muscular-4c-mujeres@1': masaMuscularCuatroComponentes('MUJERES'),
  'be/masa-muscular-esqueletica-lee-hombres@1': masaMuscularLee(1),
  'be/masa-muscular-esqueletica-lee-mujeres@1': masaMuscularLee(0),
  // Somatotipo
  'be/somatotipo-endomorfia@1': endomorfia,
  'be/somatotipo-mesomorfia@1': mesomorfia,
  'be/somatotipo-ectomorfia@1': ectomorfia,
};
