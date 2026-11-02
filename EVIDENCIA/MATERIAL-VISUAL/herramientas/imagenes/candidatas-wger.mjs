// Busca, en la lista de imágenes de ejercicios de wger (bajada a la carpeta de sondeo), candidatas para los 12 ejercicios
// del catálogo de WP-06, por palabras del nombre del archivo. Imprime licencia, autor, estilo y si es generada por IA.
// Uso: node candidatas-wger.mjs <carpeta de sondeo>
import fs from 'node:fs';
import { join } from 'node:path';
const carpeta = process.argv[2];
const licencias = Object.fromEntries(JSON.parse(fs.readFileSync(join(carpeta, 'licencias.json'), 'utf8')).results.map((l) => [l.id, l.short_name]));
const imagenes = fs
  .readdirSync(carpeta)
  .filter((f) => /^imagenes-\d+\.json$/.test(f))
  .flatMap((f) => JSON.parse(fs.readFileSync(join(carpeta, f), 'utf8')).results);
const BUSCAR = {
  Sentadilla: /(^|\/)(barbell-)?squat|back-squat/i,
  'Press de banca': /bench-press|benchpress/i,
  'Press con mancuernas': /dumbbell.*(bench|press)|incline-dumbbell|dumbbell-press/i,
  'Peso muerto': /deadlift/i,
  'Remo con barra': /bent-over|barbell-row|row/i,
  Dominadas: /pull-?up|chin-?up/i,
  'Press militar': /military|overhead-press|shoulder-press/i,
  Zancadas: /lunge/i,
  'Curl de bíceps': /curl/i,
  'Extensión de tríceps': /triceps|tricep|french|skull/i,
  Plancha: /plank/i,
  'Hip thrust': /hip-thrust|hip_thrust|glute-bridge|bridge/i,
};
for (const [nombre, re] of Object.entries(BUSCAR)) {
  const c = imagenes.filter((i) => re.test(i.image));
  console.log(`\n${nombre}: ${c.length}`);
  for (const i of c.slice(0, 8)) console.log(`  ${i.image.split('/').slice(-2).join('/')} · ${licencias[i.license] ?? i.license} · autor «${i.license_author || '—'}» · estilo ${i.style} · IA ${i.is_ai_generated} · principal ${i.is_main} · ejercicio ${i.exercise}`);
}
console.log(`\n${imagenes.length} imágenes · por licencia: ${JSON.stringify(imagenes.reduce((a, i) => ((a[licencias[i.license] ?? i.license] = (a[licencias[i.license] ?? i.license] ?? 0) + 1), a), {}))} · sin autor: ${imagenes.filter((i) => !i.license_author).length}`);
