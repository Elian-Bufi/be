// WP-ENTORNO-DEL-TUTOR (DL-184) · el catálogo que usa la muestra: los ejercicios y los alimentos del catálogo base de BE
// (DL-141), leídos de los mismos datos curados que generan sus migraciones. Los identificadores salen de las mismas
// funciones que usó la migración (UUID v5 por el número de wger o de USDA), así que son los mismos en todos los ambientes y
// la muestra nunca inventa un ejercicio ni un alimento (REQ-TUT-30, R-NUT-03). Puro: no toca la base ni la API.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { idDeAlimento, idDeEjercicio, idDeVersionDeEjercicio } from '../catalogo-base/sql.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(AQUI, '../..');
const DATOS = path.join(REPO, 'prisma/datos/catalogo-base');

const EJERCICIOS = JSON.parse(fs.readFileSync(path.join(DATOS, 'ejercicios.json'), 'utf8')).ejercicios;
const ALIMENTOS = JSON.parse(fs.readFileSync(path.join(DATOS, 'alimentos.json'), 'utf8')).alimentos;

/**
 * La lista cerrada de la estimación de la fuerza (Epley v1, ED-D18): los seis ejercicios con barra. Se repite acá para que
 * la parte pura no dependa del dominio compilado; la prueba del generador la compara con `EJERCICIOS_DE_LA_ESTIMACION_V1`.
 */
export const SEIS_CON_BARRA = [
  'Sentadilla trasera con barra',
  'Sentadilla frontal con barra',
  'Press de banca plano con barra',
  'Peso muerto convencional',
  'Press de hombros con barra',
  'Remo inclinado con barra, agarre prono',
];

/** El paso de carga de cada equipamiento (R-TRN-02): barra 2,5 kg (1,25 en los press de quien carga poco), mancuernas 1 y 2 kg, máquinas 2,5 o 5 kg. */
export function equipamientoDe(nombre) {
  const e = EJERCICIOS.find((x) => x.nombre === nombre);
  const materiales = (e?.wger?.material ?? []).map((m) => m.nombre);
  if (materiales.includes('Barbell') || materiales.includes('SZ-Bar')) return 'BARRA';
  if (materiales.includes('Dumbbell')) return 'MANCUERNA';
  if (materiales.includes('Kettlebell')) return 'MANCUERNA';
  if (materiales.includes('Cable machine')) return 'POLEA';
  if (/máquina|Prensa|Jalón|Extensión de cuádriceps|Curl femoral|Gemelos en prensa|Elevación de talones/.test(nombre)) return 'MAQUINA';
  if (materiales.some((m) => /bodyweight|Pull-up bar|Gym mat/.test(m))) return 'CORPORAL';
  return 'CORPORAL';
}

/** Un ejercicio del catálogo base por su nombre exacto: con su id y el de su versión. Si no existe, falla (REQ-TUT-30). */
export function ejercicio(nombre) {
  const e = EJERCICIOS.find((x) => x.nombre === nombre);
  if (!e) throw new Error(`El ejercicio «${nombre}» no está en el catálogo base`);
  return { nombre, ejercicioId: idDeEjercicio(e.wgerId), versionId: idDeVersionDeEjercicio(e.wgerId), equipamiento: equipamientoDe(nombre), entraEnLaEstimacion: SEIS_CON_BARRA.includes(nombre) };
}
export const existeElEjercicio = (nombre) => EJERCICIOS.some((x) => x.nombre === nombre);

/**
 * Los alimentos que usa la muestra, por una clave corta y el nombre exacto del catálogo base. Ninguno es de una marca
 * (R-NUT-06). Los marcados `carne` son los que Carolina no come.
 */
const ELEGIDOS = {
  avena: ['Avena arrollada, cruda', 'RAW'],
  granola: ['Granola casera', 'AS_PURCHASED'],
  arroz: ['Arroz blanco de grano medio, cocido', 'COOKED'],
  arrozIntegral: ['Arroz integral de grano largo, cocido', 'COOKED'],
  fideos: ['Fideos de trigo hervidos, sin sal', 'COOKED'],
  quinoa: ['Quinoa cocida', 'COOKED'],
  panFrances: ['Pan tipo francés o de Viena', 'AS_PURCHASED'],
  panIntegral: ['Pan integral de trigo, de molde', 'AS_PURCHASED'],
  lentejas: ['Lentejas secas, crudas', 'RAW'],
  garbanzos: ['Garbanzos hervidos, sin sal', 'COOKED'],
  porotos: ['Porotos negros hervidos, sin sal', 'COOKED'],
  tofu: ['Tofu firme', 'AS_PURCHASED'],
  acelga: ['Acelga hervida, sin sal', 'COOKED'],
  espinaca: ['Espinaca hervida, sin sal', 'COOKED'],
  lechuga: ['Lechuga de hoja verde, cruda', 'RAW'],
  brocoli: ['Brócoli crudo', 'RAW'],
  tomate: ['Tomate rojo maduro, crudo', 'RAW'],
  zanahoria: ['Zanahoria cruda', 'RAW'],
  zapallo: ['Zapallo anco al horno, sin sal', 'COOKED'],
  papa: ['Papa hervida sin cáscara, sin sal', 'COOKED'],
  batata: ['Batata al horno con cáscara, sin sal', 'COOKED'],
  manzana: ['Manzana con cáscara, cruda', 'RAW'],
  banana: ['Banana cruda', 'RAW'],
  naranja: ['Naranja cruda', 'RAW'],
  mandarina: ['Mandarina cruda', 'RAW'],
  frutillas: ['Frutillas crudas', 'RAW'],
  palta: ['Palta cruda', 'RAW'],
  cuadril: ['Cuadril, magro, asado', 'COOKED', 'carne'],
  nalga: ['Nalga vacuna, magra, a la parrilla', 'COOKED', 'carne'],
  pollo: ['Pechuga de pollo sin piel, a la parrilla', 'COOKED', 'carne'],
  merluza: ['Merluza (whiting) cocida por calor seco', 'COOKED', 'carne'],
  atun: ['Atún claro al natural, escurrido', 'AS_PURCHASED', 'carne'],
  huevo: ['Huevo duro', 'COOKED'],
  leche: ['Leche parcialmente descremada (1 % de grasa)', 'AS_PURCHASED'],
  yogur: ['Yogur natural descremado', 'AS_PURCHASED'],
  yogurGriego: ['Yogur griego natural descremado', 'AS_PURCHASED'],
  ricota: ['Ricota de leche parcialmente descremada', 'AS_PURCHASED'],
  queso: ['Queso muzzarella semidescremada, baja humedad', 'AS_PURCHASED'],
  aceite: ['Aceite de girasol alto oleico', 'AS_PURCHASED'],
  almendras: ['Almendras crudas', 'RAW'],
  nueces: ['Nueces de nogal, peladas', 'RAW'],
  mani: ['Maní tostado sin sal', 'AS_PURCHASED'],
  miel: ['Miel de abejas', 'AS_PURCHASED'],
};

export const ALIMENTO = Object.fromEntries(
  Object.entries(ELEGIDOS).map(([clave, [nombre, estado, carne]]) => {
    const a = ALIMENTOS.find((x) => x.nombre === nombre);
    if (!a) throw new Error(`El alimento «${nombre}» no está en el catálogo base`);
    const c = a.composicion;
    return [clave, { clave, nombre, id: idDeAlimento(a.fdcId), estado, carne: carne === 'carne', kcal: c.energyKcal, p: c.proteinG, c: c.carbohydrateG, g: c.fatG, f: c.fiberG ?? 0 }];
  }),
);

/** Los nutrientes de una lista de [clave, gramos]. */
export function nutrientesDe(items) {
  const t = { kcal: 0, p: 0, c: 0, g: 0, f: 0 };
  for (const [clave, gramos] of items) {
    const a = ALIMENTO[clave];
    if (!a) throw new Error(`Alimento desconocido: ${clave}`);
    for (const k of Object.keys(t)) t[k] += (a[k] * gramos) / 100;
  }
  return t;
}
