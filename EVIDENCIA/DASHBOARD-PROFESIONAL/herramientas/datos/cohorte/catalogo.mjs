// El catálogo que usa la cohorte: alimentos y ejercicios sembrados por las migraciones (los mismos identificadores en
// todos los ambientes), los ejercicios propios que crea el profesional de Entrenamiento y los profesionales.

/** Alimentos del catálogo de BE: id, energía y macronutrientes cada 100 g o 100 ml (la composición de la migración). */
export const ALIMENTOS = {
  aceite: { id: 'd527cfae-c081-5e95-ad20-8a0cad9ba70c', kcal: 884, p: 0, c: 0, g: 100 },
  almendras: { id: '3f82653e-ee1e-465d-8248-960766985b91', kcal: 579, p: 21.2, c: 21.6, g: 49.9 },
  arroz: { id: 'c76065f4-cfaf-4e86-8cf5-297a557a18f5', kcal: 130, p: 2.7, c: 28, g: 0.3 },
  arrozIntegral: { id: 'b5b80403-b196-4961-8f9e-3ec31a7faf52', kcal: 112, p: 2.6, c: 23.5, g: 0.9 },
  avena: { id: '1d73a14d-1fa1-4a10-84c2-3b7537c5b520', kcal: 379, p: 13.2, c: 67.7, g: 6.5 },
  banana: { id: 'c6113e6e-e6c2-4f79-8a98-5f9d836b8018', kcal: 89, p: 1.1, c: 22.8, g: 0.3 },
  batata: { id: 'c8217184-c49e-4b11-8c3a-c316b1b09ab7', kcal: 90, p: 2, c: 20.7, g: 0.1 },
  brocoli: { id: '513510d2-911c-4042-8e58-0a58e712a4d3', kcal: 34, p: 2.8, c: 6.6, g: 0.4 },
  cafe: { id: 'f513c235-14ad-4ed0-851b-3953553cb2c7', kcal: 2, p: 0.3, c: 0, g: 0, ml: true },
  carne: { id: '371c1568-f138-4236-8ab9-15ce21dc1eb6', kcal: 187, p: 27, c: 0, g: 8.5 },
  cebolla: { id: '72b8f490-c8d1-4eab-8562-f0be2ee21476', kcal: 40, p: 1.1, c: 9.3, g: 0.1 },
  espinaca: { id: '080d39b0-cf43-4331-866f-9d01b460338c', kcal: 23, p: 2.9, c: 3.6, g: 0.4 },
  fideos: { id: 'd23db71c-a95f-4ad8-87a9-51e47fb7ac2e', kcal: 158, p: 5.8, c: 31, g: 0.9 },
  frutillas: { id: 'fb220d6d-ccfd-4eb5-8bf3-5b9e370cccb0', kcal: 32, p: 0.7, c: 7.7, g: 0.3 },
  garbanzos: { id: 'b283eb32-c57d-4662-8c4a-bddbc9133dd6', kcal: 164, p: 8.9, c: 27.4, g: 2.6 },
  huevo: { id: '77026f96-bd1d-440c-8158-e28e6df3d67a', kcal: 143, p: 12.6, c: 0.7, g: 9.5 },
  jugo: { id: '88714e7a-76a3-4b74-88d1-1a5524773df8', kcal: 45, p: 0.7, c: 10.4, g: 0.2, ml: true },
  leche: { id: '77ace701-cd14-49c6-877c-1a858da71bcd', kcal: 35, p: 3.4, c: 5, g: 0.1, ml: true },
  lechuga: { id: 'fe14b950-2fe4-47f1-84c9-cd842c31ff6d', kcal: 15, p: 1.4, c: 2.9, g: 0.2 },
  lentejas: { id: '41c1705e-aad6-4d57-8ab4-fef172f538ae', kcal: 116, p: 9, c: 20.1, g: 0.4 },
  mani: { id: '106f74b8-7861-4e7e-892e-5a01f7af2d2c', kcal: 588, p: 25, c: 20, g: 50 },
  manzana: { id: 'eaf534d4-f839-4acc-8a6d-53d8dc359e29', kcal: 52, p: 0.3, c: 13.8, g: 0.2 },
  merluza: { id: 'c1636c35-bbec-48d8-8590-177565d1e2e0', kcal: 90, p: 18, c: 0, g: 1.7 },
  miel: { id: '4bab8794-97dc-4abd-8da3-e45adb3cda12', kcal: 304, p: 0.3, c: 82.4, g: 0 },
  naranja: { id: '404ca218-947b-4c73-8990-0e626928050c', kcal: 47, p: 0.9, c: 11.8, g: 0.1 },
  nueces: { id: '14a4a789-8c9c-4790-84aa-e2f02391702d', kcal: 654, p: 15.2, c: 13.7, g: 65.2 },
  palta: { id: '89b288a3-ab81-4ffd-818b-d0d188564dda', kcal: 160, p: 2, c: 8.5, g: 14.7 },
  panFrances: { id: '2a83fdae-3244-4b9f-8fe0-8d423861f382', kcal: 270, p: 8.8, c: 55, g: 1 },
  panIntegral: { id: '14a1912d-d5e1-42b7-87e2-a1508aa947bf', kcal: 247, p: 13, c: 41, g: 3.4 },
  papa: { id: 'c03d2e0a-1915-4202-8d48-ecd4ce4dac56', kcal: 87, p: 1.9, c: 20, g: 0.1 },
  pollo: { id: 'fdac8b88-6dbe-4406-86b0-bf0c155ce0e2', kcal: 165, p: 31, c: 0, g: 3.6 },
  quesoFresco: { id: '025d7e5b-124c-416f-83e1-bbdd1cf78f20', kcal: 264, p: 18, c: 3, g: 20 },
  ricota: { id: '8a7b3d47-778a-40e9-8116-04a6702c28e0', kcal: 174, p: 11.3, c: 3, g: 13 },
  salmon: { id: '1df55f96-f436-53f2-9a2e-3803fb87bece', kcal: 206, p: 22.1, c: 0, g: 12.35 },
  te: { id: '2f3f7128-5d8c-42c9-836d-443944afe4b5', kcal: 1, p: 0, c: 0.3, g: 0, ml: true },
  tomate: { id: '97b275d1-6517-4dcf-825b-a348063a9144', kcal: 18, p: 0.9, c: 3.9, g: 0.2 },
  yogur: { id: '121f8f5f-4aa2-4ab9-8f7e-327f85ce5cf1', kcal: 61, p: 3.5, c: 4.7, g: 3.3 },
  zanahoria: { id: '1b1539fc-63cd-4c1d-896d-a382e226cccc', kcal: 41, p: 0.9, c: 9.6, g: 0.2 },
  zapallo: { id: '29110cf4-5657-4bc1-810b-0867712e8d0f', kcal: 26, p: 1, c: 6.5, g: 0.1 },
};

/** Ejercicios del catálogo base (sembrados por la migración de WP-06). */
export const EJERCICIOS_BASE = {
  sentadilla: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01',
  banca: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02',
  pressMancuernas: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e03',
  pesoMuerto: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e04',
  remo: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e05',
  dominadas: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e06',
  pressMilitar: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e07',
  zancadas: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e08',
  curl: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e09',
  triceps: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e10',
  plancha: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e11',
  hipThrust: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e12',
};

/** Los que el profesional de Entrenamiento agrega en «Mis ejercicios» (API-INT-TRN-01), como haría en la consulta. */
export const EJERCICIOS_PROPIOS = {
  sentadillaACajon: 'Sentadilla a cajón',
  prensa: 'Prensa de piernas',
  remoEnPolea: 'Remo en polea baja',
  talones: 'Elevación de talones',
  equilibrio: 'Equilibrio en un pie',
  caminata: 'Caminata en cinta',
  cargada: 'Cargada de potencia',
  sentadillaFrontal: 'Sentadilla frontal',
};

/**
 * Los profesionales de la cohorte, con nombre y apellido (pedido de Dirección del 2026-10-16: «lo más parecido a la
 * realidad»). Se verifican por BE_DEMO_PROFESIONALES (DL-036), como los de la demostración.
 */
export const PROFESIONALES = {
  N: { nombre: 'Lic. Sofía Paz', correo: 'sofia.paz', alcances: [['NUTRICION', 'SANITARIO'], ['ANTROPOMETRIA', 'SANITARIO']] },
  T: { nombre: 'Prof. Martín Acosta', correo: 'martin.acosta', alcances: [['ENTRENAMIENTO', 'NO_SANITARIO']] },
  A: { nombre: 'Prof. Lucía Benítez', correo: 'lucia.benitez', alcances: [['ANTROPOMETRIA', 'NO_SANITARIO']] },
};

/** El valor de BE_DEMO_PROFESIONALES para estos profesionales, con sus identidades. */
export const demoProfesionales = (ids) =>
  Object.entries(PROFESIONALES)
    .flatMap(([k, p]) => p.alcances.map(([alcance, tipo]) => `${ids[k]}|${alcance}|${tipo}|${p.nombre}`))
    .join(';');
