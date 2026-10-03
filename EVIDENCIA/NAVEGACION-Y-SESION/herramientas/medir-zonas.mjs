// Lo que cuesta entrar a cada zona de la APK, contra la API local con datos sintéticos y sin latencia agregada: el
// tiempo de la API (la primera vez y tres más) y el tamaño de la respuesta.
// Uso: BE_E2E_DIR=<carpeta con estado.json> node medir-zonas.mjs   (la API local en el puerto 3001)
import fs from 'node:fs';
const E = JSON.parse(fs.readFileSync(process.env.BE_E2E_DIR + '/estado.json', 'utf8'));
const API = 'http://localhost:3001/api/v1';
const login = await fetch(API + '/auth/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BE-Surface': 'APK' }, body: JSON.stringify({ method: 'LOCAL', identifier: E.aseCorreo, credential: 'clave-sintetica-local-e2e-01' }) });
const token = (await login.json()).data.session.accessToken;
const ZONAS = {
  'Nutrición · hoy': '/me/nutrition/today',
  'Entrenamiento · hoy': '/me/training/today',
  'Evolución · mi evolución': '/me/anthropometry/progress',
  'Información · solicitudes': '/me/form-requests',
  'Cuenta · cuenta': '/me',
};
for (const [zona, ruta] of Object.entries(ZONAS)) {
  const veces = [];
  let cuerpo = '';
  for (let i = 0; i < 4; i++) {
    const t0 = performance.now();
    const r = await fetch(API + ruta, { headers: { Authorization: `Bearer ${token}`, 'X-BE-Surface': 'APK' } });
    cuerpo = await r.text();
    veces.push({ status: r.status, ms: Math.round(performance.now() - t0) });
    await new Promise((ok) => setTimeout(ok, 150));
  }
  console.log(zona.padEnd(26), `estado ${veces[0].status}`, `1.ª ${String(veces[0].ms).padStart(4)} ms`, `luego ${veces.slice(1).map((v) => v.ms).join('/')} ms`, `${(cuerpo.length / 1024).toFixed(1)} KB`);
  if (ruta === '/me/anthropometry/progress') fs.writeFileSync(process.env.BE_E2E_DIR + '/evolucion-sintetica.json', cuerpo);
}
