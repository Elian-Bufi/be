/**
 * Los nombres de las mediciones del catálogo de BE, para mostrar una métrica sin su código interno (la APK lee la
 * evolución, que trae solo `metricCode`). Generado desde el catálogo «Perfil antropométrico completo» (DL-111); una
 * métrica que no está acá se muestra con su código legible (`nombreDeMetrica`).
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
};

/** El nombre de una métrica, o su código sin guiones si BE no la conoce (nunca el código crudo). */
export function nombreDeMetrica(clave: string): string {
  const conocido = NOMBRE_DE_METRICA[clave];
  if (conocido) return conocido;
  const legible = clave.replace(/-/g, ' ');
  return legible.charAt(0).toUpperCase() + legible.slice(1);
}
