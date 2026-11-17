// Verifica, contra la API del destino, lo que suma la fase `etapa-a` de `cargar.mjs` (WP-TABLERO-ALTA-GAMA; autorizado
// por Dirección el 2026-11-07 para test): las masas de Durnin y Womersley de Diego Sosa y Camila Ortiz, lo que Diego
// comparte entre áreas y el pedido de Lic. Sofía Paz a Federico Álvarez. Solo lee. No imprime credenciales ni la base.
// Uso: node verificar-etapa-a.mjs <local|test>
import { clienteDe } from './api.mjs';
import { destino, leerCuentas, leerEstado } from './destino.mjs';

const d = destino(process.argv[2]);
const api = clienteDe(d.api);
const c = leerCuentas(d);
const e = leerEstado(d);
const sesion = (prefijo) => api.sesion(c[`${prefijo}_CORREO`], c[`${prefijo}_CLAVE`], 'WEB');
const diaMenos = (dias) => new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);

const sofia = await sesion('PRO_N');
const martin = await sesion('PRO_T');
const lucia = await sesion('PRO_A');
const diego = e.personas.diego.aseId;
const camila = e.personas.camila.aseId;
const federico = e.personas.federico.aseId;

async function masas(token, aseId, nombre) {
  const metric = 'peso,masa-grasa-durnin-womersley,masa-libre-de-grasa-durnin-womersley';
  const r = await api.pedir('GET', `/advisees/${aseId}/anthropometry/progress?periodStart=${diaMenos(91)}&periodEnd=${diaMenos(0)}&metric=${metric}`, { token });
  const n = Object.fromEntries(r.data.metrics.map((m) => [m.metricCode, m.series.length]));
  const grasa = r.data.metrics.find((m) => m.metricCode === 'masa-grasa-durnin-womersley')?.series.at(-1);
  const libre = r.data.metrics.find((m) => m.metricCode === 'masa-libre-de-grasa-durnin-womersley')?.series.at(-1);
  const peso = r.data.metrics.find((m) => m.metricCode === 'peso')?.series.at(-1);
  console.log(`${nombre}, últimos 92 días: ${JSON.stringify(n)}; la última toma: peso ${peso?.value} kg = grasa ${grasa?.value} + libre de grasa ${libre?.value}`);
}
await masas(sofia, diego, 'Diego Sosa (Lic. Sofía Paz)');
await masas(lucia, camila, 'Camila Ortiz (Prof. Lucía Benítez)');

const otras = (r) => r.data.areas.map((a) => `${a.area}: ${a.professional?.displayName ?? '—'} · ${a.shared ? `${a.shared.level} desde ${a.shared.since.slice(0, 10)}` : 'nada'}${a.accessRequest ? ` · pedido ${a.accessRequest.status} del ${a.accessRequest.requestedAt.slice(0, 10)}` : ''}`).join(' | ');
console.log(`Diego, otras áreas para Lic. Sofía Paz: ${otras(await api.pedir('GET', `/advisees/${diego}/shared-summaries`, { token: sofia }))}`);
console.log(`Diego, otras áreas para Prof. Martín Acosta: ${otras(await api.pedir('GET', `/advisees/${diego}/shared-summaries`, { token: martin }))}`);
const plan = await api.pedir('GET', `/advisees/${diego}/shared-summaries/ENTRENAMIENTO/plan`, { token: sofia });
console.log(`El plan de Entrenamiento de Diego para Lic. Sofía Paz: ${plan.data ? `de ${plan.data.author.displayName}, rige desde ${plan.data.activatedAt.slice(0, 10)}, próxima revisión ${plan.data.nextReviewAt}, ${plan.data.progress.weeks.length} semanas registradas` : 'sin plan vigente'}`);
const planN = await api.pedir('GET', `/advisees/${diego}/shared-summaries/NUTRICION/plan`, { token: martin });
console.log(`El plan de Nutrición de Diego para Prof. Martín Acosta: ${planN.data ? `de ${planN.data.author.displayName}, rige desde ${planN.data.activatedAt.slice(0, 10)}, próxima revisión ${planN.data.nextReviewAt}` : 'sin plan vigente'}`);
console.log(`Federico, otras áreas para Lic. Sofía Paz: ${otras(await api.pedir('GET', `/advisees/${federico}/shared-summaries`, { token: sofia }))}`);
const ajeno = await api.pedir('GET', `/advisees/${federico}/shared-summaries/ENTRENAMIENTO/plan`, { token: sofia, esperado: [200, 404] });
console.log(`El plan de Entrenamiento de Federico para Lic. Sofía Paz, sin que él diga que sí: ${ajeno?.data === undefined ? '404, como lo inexistente' : 'LO VE (mal)'}`);

// La toma de hoy de Federico Álvarez (la fase `etapa-a`, `tomaDeLeeDeFederico`): lo que lee la tarjeta de Antropometría de
// su Resumen (API-ANT-06, la ventana de 92 días que termina en la última toma) y la barra que arma con eso el website
// (`repartoDe`): con el músculo de Lee, grasa, músculo y resto.
{
  const metric = 'peso,masa-grasa-durnin-womersley,masa-libre-de-grasa-durnin-womersley,masa-muscular-esqueletica-lee';
  const r = await api.pedir('GET', `/advisees/${federico}/anthropometry/progress?periodStart=${diaMenos(91)}&periodEnd=${diaMenos(0)}&metric=${metric}`, { token: sofia });
  const ultimo = (codigo) => r.data.metrics.find((m) => m.metricCode === codigo)?.series.at(-1) ?? null;
  const peso = ultimo('peso');
  const grasa = ultimo('masa-grasa-durnin-womersley');
  const libre = ultimo('masa-libre-de-grasa-durnin-womersley');
  const lee = ultimo('masa-muscular-esqueletica-lee');
  const misma = [grasa, libre, lee].every((x) => x && x.sourceEvaluationId === peso?.sourceEvaluationId);
  if (!peso || !grasa || !libre || !lee || !misma) {
    console.log('Federico Álvarez: a la última toma le falta el peso, una masa de Durnin y Womersley o la de Lee.');
  } else {
    const resto = Math.round((libre.value - lee.value) * 10) / 10;
    const pc = (x) => (Math.round((x / peso.value) * 1000) / 10).toFixed(1).replace('.', ',');
    const kg = (x) => x.toFixed(1).replace('.', ',');
    console.log(`Federico Álvarez, la barra de la toma del ${peso.occurredAt.slice(0, 10)} (Lic. Sofía Paz): ${kg(peso.value)} kg = grasa ${kg(grasa.value)} kg (${pc(grasa.value)} %) + músculo ${kg(lee.value)} kg (${pc(lee.value)} %) + resto ${kg(resto)} kg (${pc(resto)} %)`);
  }
}
