// Comprueba, solo leyendo, que la base de la demostración tenga los datos que suponen las cuatro tareas
// (INSTRUCCIONES.md): la etapa A y la B de Nutrición, el contraste por modo de registro y la evidencia de la revisión.
// Lee la API como el profesional sintético (un inicio de sesión) y calcula a mano, sin el dominio.
//
// Uso, desde EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas, con la API en :3001:
//   BE_TRABAJO="$PWD/trabajo-comprension" node ../../DASHBOARD-COMPRENSION/demostracion/comprobar-datos.mjs
// Los valores esperados son los del día en que se generó el escenario (`hoy` de estado.json): otro día, la etapa B, el
// contraste de 90 días y la evidencia cambian, y el script lo dice en lugar de fallar.
import fs from 'node:fs';
import path from 'node:path';

const API = 'http://localhost:3001/api/v1';
const trabajo = process.env.BE_TRABAJO;
if (!trabajo) throw new Error('Falta BE_TRABAJO (la carpeta de trabajo de la demostración, con estado.json).');
const estado = JSON.parse(fs.readFileSync(path.join(trabajo, 'estado.json'), 'utf8'));
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
const delDia = hoy === estado.hoy;
const dia = (f, n) => new Date(Date.parse(`${f}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

const inicio = await fetch(`${API}/auth/sessions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB' },
  body: JSON.stringify({ method: 'LOCAL', identifier: estado.proCorreo, credential: 'clave-sintetica-de-prueba-01' }),
});
if (!inicio.ok) throw new Error(`No se pudo iniciar sesión como el profesional sintético: ${inicio.status}`);
const token = (await inicio.json()).data.session.accessToken;
const leer = async (ruta) => {
  const r = await fetch(`${API}${ruta}`, { headers: { Authorization: `Bearer ${token}`, 'X-BE-Surface': 'WEB', Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${ruta.replace(/[0-9a-f-]{36}/g, ':id')}: ${r.status}`);
  return r.json();
};

const resultados = [];
const comprobar = (que, obtenido, esperado, soloElDia = false) => {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  resultados.push({ que, obtenido, esperado, ok, informativo: soloElDia && !delDia });
};

const serie = async (metrica) => (await leer(`/advisees/${estado.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=${metrica}&grain=DAY&periodStart=${dia(hoy, 365)}&periodEnd=${hoy}`)).data.result;
const energia = await serie('ENERGY');
const proteinas = await serie('PROTEIN');
const registros = await serie('RECORDS');
const [v1, v2] = [...energia.planVersions].sort((a, b) => a.activatedAt.localeCompare(b.activatedAt));
const etapa = (desde, hasta) => {
  const delRango = energia.recorded.points.filter((p) => p.date >= desde && p.date <= hasta);
  const terminados = delRango.filter((p) => p.date !== hoy && !p.partialBucket);
  const conValor = terminados.filter((p) => p.value !== null);
  const dias = Math.round((Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86_400_000) + 1;
  const media = (s) => {
    const xs = s.recorded.points.filter((p) => p.date >= desde && p.date <= hasta && p.value !== null && !p.partialBucket && p.date !== hoy).map((p) => p.value);
    return Math.round((xs.reduce((t, x) => t + x, 0) / xs.length) * 10) / 10;
  };
  return {
    desde,
    hasta,
    dias,
    conValor: conValor.length,
    subtotales: conValor.filter((p) => p.quality === 'PARTIAL').length,
    sinRegistros: dias - new Set(terminados.map((p) => p.date)).size - (desde <= hoy && hoy <= hasta ? 1 : 0),
    energia: Math.round(media(energia)),
    proteinas: media(proteinas),
    registros: registros.recorded.points.filter((p) => p.date >= desde && p.date <= hasta && p.value !== null).reduce((t, p) => t + p.value, 0),
  };
};
comprobar('Etapa A de Nutrición (versión 1)', etapa(v1.from, dia(v1.to, 1)), { desde: '2026-07-18', hasta: '2026-09-03', dias: 48, conValor: 44, subtotales: 7, sinRegistros: 4, energia: 1238, proteinas: 82.8, registros: 159 });
comprobar('Etapa B de Nutrición (versión 2, hasta hoy)', etapa(v2.from, hoy), { desde: '2026-09-04', hasta: '2026-10-09', dias: 36, conValor: 35, subtotales: 1, sinRegistros: 0, energia: 1170, proteinas: 85.2, registros: 124 }, true);

const comidas = async (calidad) => (await leer(`/advisees/${estado.aseId}/timeline?periodStart=${dia(hoy, 89)}&periodEnd=${hoy}&domain=NUTRITION&type=MEAL_RECORDED&quality=${calidad}&limit=1`)).data.totalMatching;
comprobar('Contraste de Nutrición (90 días): distintas, a mano, sin confirmar o diferentes', [await comidas('QUANTITIES_DIFFER_FROM_PLAN'), await comidas('QUANTITIES_REPORTED'), await comidas('QUANTITIES_UNCONFIRMED,DIFFERENT_MEAL')], [3, 4, 8], true);

const panel = (await leer(`/advisees/${estado.aseId}/dashboard`)).data.domains;
const corte = panel.nutrition.summary.lastReview.recordedAt.slice(0, 10);
const contexto = (await leer(`/advisees/${estado.aseId}/nutrition/review-context?periodStart=${corte}&periodEnd=${hoy}`)).data;
comprobar('Evidencia de la revisión de Nutrición: comidas y días', [contexto.registeredIntakes.length, new Set(contexto.registeredIntakes.map((i) => i.localDate)).size], [65, 21], true);
comprobar('Entrenamiento: el borrador del plan sigue sin regir', Boolean(panel.training.summary.draftPlan), true);

for (const r of resultados) console.log(`${r.ok ? 'OK   ' : r.informativo ? 'OTRO DÍA' : 'FALLA'} ${r.que}${r.ok ? '' : ` — obtenido ${JSON.stringify(r.obtenido)}; esperado ${JSON.stringify(r.esperado)}`}`);
const fallas = resultados.filter((r) => !r.ok && !r.informativo);
console.log(`\n${resultados.length - fallas.length} de ${resultados.length} bien${delDia ? '' : ` (el escenario es del ${estado.hoy}; hoy es ${hoy}: lo que depende del día se informa, no se compara)`}`);
if (fallas.length) process.exitCode = 1;
