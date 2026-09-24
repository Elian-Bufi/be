/**
 * Cobertura automatizada del catálogo DV-05 en una corrida de la CI: para cada caso, cuántas pruebas lo nombran en su
 * título completo (describe + it) y cuántas pasaron. Fuentes: la integración (Jest --json) y el log del job
 * `verificar` (TAP de node:test del dominio y las guardias).
 *
 * Por qué existe: «probado» tiene que poder rehacerse. Un caso cuenta solo si una prueba lo nombra por su ID; un caso
 * ejercitado con otro identificador del 11A no se cuenta, en vez de suponerlo.
 *
 * Uso: node scripts/cobertura-dv05.cjs <DV-05.csv> <resultados-integracion.json> <ci-verificar.log> [salida.json]
 */
const { readFileSync, writeFileSync } = require('node:fs');
const [csv, integracion, log, salida] = process.argv.slice(2);

function filasCsv(texto) {
  const filas = [];
  let fila = [], campo = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      if (fila.some((x) => x !== '')) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

const [cab, ...casos] = filasCsv(readFileSync(csv, 'utf8'));
const col = (n) => cab.indexOf(n);
const j = JSON.parse(readFileSync(integracion, 'utf8'));
const pruebas = j.testResults.flatMap((s) => s.assertionResults.map((a) => ({ titulo: a.fullName, estado: a.status, fuente: 'integración' })));
// TAP de node:test (dominio y guardias): «ok N - título» / «not ok N - título». Las pruebas unitarias de la API corren
// con Jest sin --verbose y no dejan sus títulos en el log: no entran en el conteo.
for (const linea of readFileSync(log, 'utf8').split('\n')) {
  const texto = linea.replace(/^.*?\d{4}-\d\d-\d\dT[\d:.]+Z /, '');
  const m = texto.match(/^\s*(not ok|ok) \d+ - (.*)$/);
  if (m) pruebas.push({ titulo: m[2], estado: m[1] === 'ok' ? 'passed' : 'failed', fuente: 'unitarias' });
}
// Un ID nombra la prueba si aparece como palabra entera: TEST-RF-001 no cuenta dentro de TEST-RF-0010.
const nombra = (titulo, id) => new RegExp(`(^|[^A-Z0-9-])${id.replace(/-/g, '\\-')}(?![0-9])`).test(titulo);
const resultado = casos.map((f) => {
  const id = f[col('ID')];
  const suyas = pruebas.filter((p) => nombra(p.titulo, id));
  return {
    id,
    rf: f[col('RF')],
    prioridad: f[col('Prioridad')],
    nivel: f[col('Nivel')],
    canal: f[col('Canal')],
    pruebas: suyas.length,
    pasaron: suyas.filter((p) => p.estado === 'passed').length,
    fallaron: suyas.filter((p) => p.estado === 'failed').length,
    fuentes: [...new Set(suyas.map((p) => p.fuente))],
  };
});
const cubiertos = resultado.filter((r) => r.pasaron > 0 && r.fallaron === 0);
console.log(`pruebas leídas: ${pruebas.length} (integración ${pruebas.filter((p) => p.fuente === 'integración').length}, unitarias ${pruebas.filter((p) => p.fuente === 'unitarias').length})`);
console.log(`casos del catálogo: ${resultado.length}; con prueba automatizada que pasa: ${cubiertos.length}; con alguna falla: ${resultado.filter((r) => r.fallaron > 0).length}`);
for (const r of resultado) console.log(`${r.id.padEnd(14)} ${r.prioridad} ${r.nivel.padEnd(12)} ${String(r.pasaron).padStart(3)}/${String(r.pruebas).padEnd(3)} ${r.fuentes.join('+')}`);
if (salida) writeFileSync(salida, JSON.stringify(resultado, null, 2));
