// El cálculo del cliente de «Mi evolución» (ultimaToma, como en la pantalla), con la respuesta sintética que guarda
// medir-zonas.mjs. Cinco procesos de 30 repeticiones; informa la primera llamada de cada proceso (en frío) y la mediana.
// Uso: BE_REPO=<raíz del repositorio> BE_E2E_DIR=<carpeta> node medir-calculo.cjs   (con packages/domain compilado)
const { execFileSync } = require('child_process');
if (process.argv[2] === 'hijo') {
  const d = require(process.env.BE_REPO + '/packages/domain/dist/index.js');
  const datos = JSON.parse(require('fs').readFileSync(process.env.BE_E2E_DIR + '/evolucion-sintetica.json', 'utf8')).data;
  let t0 = performance.now();
  d.ultimaToma(datos);
  const fria = performance.now() - t0;
  const veces = [];
  for (let i = 0; i < 30; i++) {
    t0 = performance.now();
    d.ultimaToma(datos);
    veces.push(performance.now() - t0);
  }
  veces.sort((a, b) => a - b);
  console.log(JSON.stringify({ fria, mediana: veces[15] }));
} else {
  const r = [];
  for (let i = 0; i < 5; i++) r.push(JSON.parse(execFileSync(process.execPath, [__filename, 'hijo'], { encoding: 'utf8' })));
  console.log('en frío (ms):', r.map((x) => x.fria.toFixed(1)).join(' / '));
  console.log('mediana por llamada (ms):', r.map((x) => x.mediana.toFixed(2)).join(' / '));
}
