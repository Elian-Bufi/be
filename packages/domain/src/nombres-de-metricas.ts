import type { FamiliaDeMedicion } from './figura-antropometrica';

/**
 * Los nombres de las mediciones del catálogo de BE y de los resultados de sus métodos, para mostrar una métrica sin su
 * código interno (la APK lee la evolución, que trae solo `metricCode`). Generado desde el catálogo «Perfil
 * antropométrico completo» y sus métodos (DL-111); una métrica que no está acá se muestra con su código legible
 * (`nombreDeMetrica`). El orden es el del catálogo: primero las mediciones, después los resultados.
 */
export const NOMBRE_DE_METRICA: Readonly<Record<string, string>> = {
  'peso': 'Peso',
  'talla': 'Talla',
  'edad': 'Edad al momento de la toma',
  'pliegue-pectoral': 'Pliegue pectoral',
  'pliegue-axilar-media': 'Pliegue axilar medio',
  'pliegue-triceps': 'Pliegue tricipital',
  'pliegue-subescapular': 'Pliegue subescapular',
  'pliegue-biceps': 'Pliegue bicipital',
  'pliegue-cresta-iliaca': 'Pliegue de la cresta ilíaca',
  'pliegue-supraespinal': 'Pliegue supraespinal',
  'pliegue-abdominal': 'Pliegue abdominal',
  'pliegue-muslo-frontal': 'Pliegue del muslo frontal',
  'pliegue-pantorrilla': 'Pliegue de la pantorrilla',
  'pliegue-antebrazo': 'Pliegue del antebrazo',
  'perimetro-cuello': 'Perímetro del cuello',
  'perimetro-hombros': 'Perímetro de hombros',
  'perimetro-pecho': 'Perímetro del pecho',
  'perimetro-brazo-relajado': 'Perímetro del brazo relajado',
  'perimetro-brazo-flexionado': 'Perímetro del brazo flexionado y contraído',
  'perimetro-antebrazo': 'Perímetro del antebrazo',
  'perimetro-muneca': 'Perímetro de la muñeca',
  'perimetro-cintura': 'Perímetro de cintura',
  'perimetro-abdomen': 'Perímetro del abdomen',
  'perimetro-cadera': 'Perímetro de cadera',
  'perimetro-muslo': 'Perímetro del muslo',
  'perimetro-pantorrilla': 'Perímetro de la pantorrilla',
  'perimetro-tobillo': 'Perímetro del tobillo',
  'diametro-humero': 'Diámetro biepicondíleo del húmero (codo)',
  'diametro-biestiloideo': 'Diámetro biestiloideo (muñeca)',
  'diametro-femur': 'Diámetro bicondíleo del fémur (rodilla)',
  'imc': 'Índice de masa corporal',
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
  'endomorfia': 'Endomorfia',
  'mesomorfia': 'Mesomorfia',
  'ectomorfia': 'Ectomorfia',
};

/** La familia de cada medición del catálogo (B10-07 §15): agrupa la lista de la toma. */
export const FAMILIA_DE_METRICA: Readonly<Record<string, FamiliaDeMedicion>> = {
  'peso': 'MASA_Y_ESTATURA',
  'talla': 'MASA_Y_ESTATURA',
  'edad': 'OTRAS',
  'pliegue-pectoral': 'PLIEGUES',
  'pliegue-axilar-media': 'PLIEGUES',
  'pliegue-triceps': 'PLIEGUES',
  'pliegue-subescapular': 'PLIEGUES',
  'pliegue-biceps': 'PLIEGUES',
  'pliegue-cresta-iliaca': 'PLIEGUES',
  'pliegue-supraespinal': 'PLIEGUES',
  'pliegue-abdominal': 'PLIEGUES',
  'pliegue-muslo-frontal': 'PLIEGUES',
  'pliegue-pantorrilla': 'PLIEGUES',
  'pliegue-antebrazo': 'PLIEGUES',
  'perimetro-cuello': 'PERIMETROS',
  'perimetro-hombros': 'PERIMETROS',
  'perimetro-pecho': 'PERIMETROS',
  'perimetro-brazo-relajado': 'PERIMETROS',
  'perimetro-brazo-flexionado': 'PERIMETROS',
  'perimetro-antebrazo': 'PERIMETROS',
  'perimetro-muneca': 'PERIMETROS',
  'perimetro-cintura': 'PERIMETROS',
  'perimetro-abdomen': 'PERIMETROS',
  'perimetro-cadera': 'PERIMETROS',
  'perimetro-muslo': 'PERIMETROS',
  'perimetro-pantorrilla': 'PERIMETROS',
  'perimetro-tobillo': 'PERIMETROS',
  'diametro-humero': 'DIAMETROS',
  'diametro-biestiloideo': 'DIAMETROS',
  'diametro-femur': 'DIAMETROS',
};

/** El nombre de una métrica, o su código sin guiones si BE no la conoce (nunca el código crudo). */
export function nombreDeMetrica(clave: string): string {
  const conocido = NOMBRE_DE_METRICA[clave];
  if (conocido) return conocido;
  const legible = clave.replace(/-/g, ' ');
  return legible.charAt(0).toUpperCase() + legible.slice(1);
}

/**
 * El nombre de cada versión de método del catálogo de BE, por su identificador. La evolución (API-ANT-06) publica solo
 * el `methodVersionId` de cada grupo y su forma no cambia (la APK la valida con un esquema estricto): con este mapa la
 * persona lee con qué método salió un resultado. Un método que no está acá se dice sin inventarle un nombre.
 */
export const NOMBRE_DE_METODO: Readonly<Record<string, string>> = {
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f01': 'Índice de masa corporal (IMC)',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f02': 'Índice cintura/cadera',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f03': 'Índice cintura/talla',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f04': 'Suma de 6 pliegues (ISAK)',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f05': 'Suma de 8 pliegues (ISAK)',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f06': 'Suma de 7 pliegues (Jackson y Pollock)',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f07': 'Grasa corporal · Durnin y Womersley, hombres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f08': 'Grasa corporal · Durnin y Womersley, mujeres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f09': 'Grasa corporal · Jackson y Pollock, 7 pliegues, hombres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f0a': 'Grasa corporal · Jackson, Pollock y Ward, 7 pliegues, mujeres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f0b': 'Grasa corporal · Jackson y Pollock, 3 pliegues, hombres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f0c': 'Grasa corporal · Jackson, Pollock y Ward, 3 pliegues, mujeres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f0d': 'Grasa corporal · Faulkner',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f0e': 'Grasa corporal · US Navy, hombres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f0f': 'Grasa corporal · US Navy, mujeres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f10': 'Grasa corporal desde el IMC · Deurenberg, hombres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f11': 'Grasa corporal desde el IMC · Deurenberg, mujeres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f12': 'Masa grasa · Faulkner',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f13': 'Masa libre de grasa · Faulkner',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f14': 'Masa ósea · Von Döbeln modificada por Rocha',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f15': 'Masa residual · Würch, hombres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f16': 'Masa residual · Würch, mujeres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f17': 'Masa muscular · cuatro componentes, hombres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f18': 'Masa muscular · cuatro componentes, mujeres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f19': 'Masa muscular esquelética · Lee y col., hombres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f1a': 'Masa muscular esquelética · Lee y col., mujeres',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f1b': 'Somatotipo · endomorfia (Heath y Carter)',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f1c': 'Somatotipo · mesomorfia (Heath y Carter)',
  '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f1d': 'Somatotipo · ectomorfia (Heath y Carter)',
};

/** El nombre del método de una versión, o `null` si BE no la conoce. */
export const nombreDeMetodo = (methodVersionId: string | null): string | null => (methodVersionId ? (NOMBRE_DE_METODO[methodVersionId] ?? null) : null);
