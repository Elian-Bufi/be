// Fuente única del catálogo «Perfil antropométrico completo»: genera la migración SQL y el mapa de nombres del dominio.
// Uso (desde la raíz): node scripts/catalogo-antropometrico/catalogo-perfil-completo.cjs prisma/migrations/20261001000000_perfil_antropometrico_completo/migration.sql packages/domain/src/nombres-de-metricas.ts
const fs = require('fs');
const M = (clave, nombre, familia, unidad, precision) => ({ clave, nombre, familia, unidades: [unidad], precision });
const METRICAS = [
  M('peso', 'Peso', 'MASA_Y_ESTATURA', 'kg', 1),
  M('talla', 'Talla', 'MASA_Y_ESTATURA', 'cm', 1),
  M('edad', 'Edad al momento de la toma', 'OTRAS', 'años', 0),
  M('pliegue-pectoral', 'Pliegue pectoral', 'PLIEGUES', 'mm', 1),
  M('pliegue-axilar-media', 'Pliegue axilar medio', 'PLIEGUES', 'mm', 1),
  M('pliegue-triceps', 'Pliegue tricipital', 'PLIEGUES', 'mm', 1),
  M('pliegue-subescapular', 'Pliegue subescapular', 'PLIEGUES', 'mm', 1),
  M('pliegue-biceps', 'Pliegue bicipital', 'PLIEGUES', 'mm', 1),
  M('pliegue-cresta-iliaca', 'Pliegue de la cresta ilíaca', 'PLIEGUES', 'mm', 1),
  M('pliegue-supraespinal', 'Pliegue supraespinal', 'PLIEGUES', 'mm', 1),
  M('pliegue-abdominal', 'Pliegue abdominal', 'PLIEGUES', 'mm', 1),
  M('pliegue-muslo-frontal', 'Pliegue del muslo frontal', 'PLIEGUES', 'mm', 1),
  M('pliegue-pantorrilla', 'Pliegue de la pantorrilla', 'PLIEGUES', 'mm', 1),
  M('pliegue-antebrazo', 'Pliegue del antebrazo', 'PLIEGUES', 'mm', 1),
  M('perimetro-cuello', 'Perímetro del cuello', 'PERIMETROS', 'cm', 1),
  M('perimetro-hombros', 'Perímetro de hombros', 'PERIMETROS', 'cm', 1),
  M('perimetro-pecho', 'Perímetro del pecho', 'PERIMETROS', 'cm', 1),
  M('perimetro-brazo-relajado', 'Perímetro del brazo relajado', 'PERIMETROS', 'cm', 1),
  M('perimetro-brazo-flexionado', 'Perímetro del brazo flexionado y contraído', 'PERIMETROS', 'cm', 1),
  M('perimetro-antebrazo', 'Perímetro del antebrazo', 'PERIMETROS', 'cm', 1),
  M('perimetro-muneca', 'Perímetro de la muñeca', 'PERIMETROS', 'cm', 1),
  M('perimetro-cintura', 'Perímetro de cintura', 'PERIMETROS', 'cm', 1),
  M('perimetro-abdomen', 'Perímetro del abdomen', 'PERIMETROS', 'cm', 1),
  M('perimetro-cadera', 'Perímetro de cadera', 'PERIMETROS', 'cm', 1),
  M('perimetro-muslo', 'Perímetro del muslo', 'PERIMETROS', 'cm', 1),
  M('perimetro-pantorrilla', 'Perímetro de la pantorrilla', 'PERIMETROS', 'cm', 1),
  M('perimetro-tobillo', 'Perímetro del tobillo', 'PERIMETROS', 'cm', 1),
  M('diametro-humero', 'Diámetro biepicondíleo del húmero (codo)', 'DIAMETROS', 'cm', 1),
  M('diametro-biestiloideo', 'Diámetro biestiloideo (muñeca)', 'DIAMETROS', 'cm', 1),
  M('diametro-femur', 'Diámetro bicondíleo del fémur (rodilla)', 'DIAMETROS', 'cm', 1),
];
module.exports = { METRICAS };
// Los métodos del catálogo (DL-111), si ya están: sus versiones dan nombre a los grupos de la evolución.
if (require.main === module) {
  const { METODOS = [], SALIDAS = {} } = fs.existsSync(__dirname + '/catalogo-metodos.cjs') ? require(__dirname + '/catalogo-metodos.cjs') : {};
  const [salidaSql, salidaTs] = process.argv.slice(2);
  const contenido = JSON.stringify({ metricas: METRICAS }).replace(/'/g, "''");
  const sql = `-- DL-111 · «Perfil antropométrico completo»: el catálogo de BE con los sitios de toma de las láminas de Dirección
-- (compositor v13.3): masa y estatura, edad, 11 pliegues, 13 perímetros y 3 diámetros óseos. Es el primer protocolo
-- del catálogo de BE (DL-110); los sintéticos de demostración (PROTO-LAB, PROTO-CUERPO) quedan como están y se siguen
-- citando por las evaluaciones que los usaron. La talla va en centímetros: los métodos reciben valores en una unidad
-- fija. Identificadores deterministas, iguales en todos los ambientes.

INSERT INTO "especificacion_antropometrica" ("id", "clave", "tipo", "momento_de_registro") VALUES
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f10', 'PROTO-PERFIL-COMPLETO', 'PROTOCOLO', '2026-10-01T00:00:00.000Z');

INSERT INTO "version_de_especificacion_antropometrica" ("id", "especificacion_id", "predecesora_id", "version", "nombre", "contenido", "procedencia", "momento_de_registro") VALUES
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f10', '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f10', NULL, '1',
   'Perfil antropométrico completo',
   '${contenido}',
   '{"rotulo":"Catálogo de BE: los sitios de toma de las láminas de Dirección (compositor v13.3). La técnica de cada sitio la aplica el profesional según su formación (DL-111)."}',
   '2026-10-01T00:00:00.000Z');
`;
  fs.writeFileSync(salidaSql, sql);
  const ts = `import type { FamiliaDeMedicion } from './figura-antropometrica';

/**
 * Los nombres de las mediciones del catálogo de BE y de los resultados de sus métodos, para mostrar una métrica sin su
 * código interno (la APK lee la evolución, que trae solo \`metricCode\`). Generado desde el catálogo «Perfil
 * antropométrico completo» y sus métodos (DL-111); una métrica que no está acá se muestra con su código legible
 * (\`nombreDeMetrica\`). El orden es el del catálogo: primero las mediciones, después los resultados.
 */
export const NOMBRE_DE_METRICA: Readonly<Record<string, string>> = {
${METRICAS.map((m) => `  '${m.clave}': '${m.nombre}',`).join('\n')}
${Object.entries(SALIDAS).map(([clave, nombre]) => `  '${clave}': '${nombre}',`).join('\n')}
};

/** La familia de cada medición del catálogo (B10-07 §15): agrupa la lista de la toma. */
export const FAMILIA_DE_METRICA: Readonly<Record<string, FamiliaDeMedicion>> = {
${METRICAS.map((m) => `  '${m.clave}': '${m.familia}',`).join('\n')}
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
 * el \`methodVersionId\` de cada grupo y su forma no cambia (la APK la valida con un esquema estricto): con este mapa la
 * persona lee con qué método salió un resultado. Un método que no está acá se dice sin inventarle un nombre.
 */
export const NOMBRE_DE_METODO: Readonly<Record<string, string>> = {
${METODOS.map((m) => `  '${m.versionId}': '${m.nombre.replace(/'/g, "\\'")}',`).join('\n')}
};

/** El nombre del método de una versión, o \`null\` si BE no la conoce. */
export const nombreDeMetodo = (methodVersionId: string | null): string | null => (methodVersionId ? (NOMBRE_DE_METODO[methodVersionId] ?? null) : null);
`;
  fs.writeFileSync(salidaTs, ts);
  console.log(`catálogo: ${METRICAS.length} métricas`);
}
