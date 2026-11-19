// WP-ENTORNO-DEL-TUTOR (DL-184) · lo que la carga crea por la API además de la historia de cada persona: las recetas (y
// la receta como opción del plan), las comidas y sesiones habituales, las vistas de «Analizar», los formularios de inicio
// respondidos, el pedido de información a Silvia y la invitación a una persona nueva. Todo con la fecha del armado
// (TUT-D13), y sin duplicar: antes de crear, se busca por nombre o por plantilla.
import { ALIMENTO } from './catalogo.mjs';
import { estructuraDeEntrenamiento } from './historia.mjs';
import { HERRAMIENTAS } from './herramientas.mjs';

/** `c`: { pedir, sesion, ids, versionesDeAlimentos(claves) → (clave) → { catalogItemId, catalogItemVersionId }, dominio }. */
const FORMATO_3 = 'forms-format-3';

export function extras(c) {
  const lista = async (ruta, token) => (await c.pedir('GET', ruta, { token })).data ?? [];
  const ingrediente = (version) => ([k, g]) => ({ ...version(k), quantity: { value: g, unit: 'g' }, preparationState: ALIMENTO[k].estado });

  async function crearReceta(token, nombre, porciones, items, pasos) {
    const ya = (await lista('/nutrition/recipes?limit=50', token)).find((x) => x.name === nombre);
    if (ya) return ya.recipeVersionId ?? (await c.pedir('GET', `/nutrition/recipes/${ya.recipeId}`, { token })).data.recipeVersionId;
    const version = await c.versionesDeAlimentos(items.map(([k]) => k));
    const r = await c.pedir('POST', '/nutrition/recipes', { token, cuerpo: { name: nombre, description: null, steps: pasos, servings: porciones, ingredients: items.map(ingrediente(version)) } });
    return r.data.recipeVersionId;
  }

  async function recetas() {
    const token = await c.sesion('julieta');
    for (const [nombre, porciones, items, pasos] of HERRAMIENTAS.recetas) await crearReceta(token, nombre, porciones, items, pasos);
    return HERRAMIENTAS.recetas.length;
  }

  /** La receta que va como opción en la última versión del plan: los ítems de esa opción, en una porción (REQ-TUT-34). */
  async function recetaParaElPlan(p) {
    const donde = HERRAMIENTAS.recetasEnElPlan[p.clave];
    if (!donde || !p.nut.versiones.length) return null;
    const [comida, opcion] = donde;
    const o = p.nut.versiones[p.nut.versiones.length - 1].plan[0].comidas.find((x) => x.rotulo === comida).opciones[opcion];
    const recipeVersionId = await crearReceta(await c.sesion('julieta'), o.rotulo, 1, o.items, ['Preparar en el momento.']);
    return { comida, opcion, recipeVersionId };
  }

  async function habituales() {
    const token = await c.sesion('julieta');
    const comidas = await lista('/nutrition/meal-presets?limit=50', token);
    for (const [nombre, comida, items] of HERRAMIENTAS.comidasHabituales) {
      if (comidas.some((x) => x.name === nombre)) continue;
      const it = items.map(([k, g]) => ({ catalogItemId: ALIMENTO[k].id, quantity: { value: g, unit: 'g' }, preparationState: ALIMENTO[k].estado }));
      await c.pedir('POST', '/nutrition/meal-presets', { token, cuerpo: { name: nombre, structure: { label: comida, prescriptionMode: 'DISH_OPTIONS', options: [{ label: nombre, items: it }] }, copyQuantities: true } });
    }
    const sesiones = await lista('/training/session-presets?limit=50', token);
    for (const x of HERRAMIENTAS.sesionesHabituales) {
      if (sesiones.some((y) => y.name === x.nombre)) continue;
      const estructura = estructuraDeEntrenamiento({ liviana: true }, { nombre: x.nombre, sesiones: [x.sesion] }).blocks[0].sessions[0];
      await c.pedir('POST', '/training/session-presets', { token, cuerpo: { name: x.nombre, structure: estructura } });
    }
    return HERRAMIENTAS.comidasHabituales.length + HERRAMIENTAS.sesionesHabituales.length;
  }

  async function vistas() {
    const token = await c.sesion('julieta');
    const ya = await lista('/me/analysis-views', token);
    const m = (metricId) => ({ metricId, exerciseKey: null, setIndex: null, unit: null });
    const config = (metricas) => ({ schemaVersion: 1, metrics: metricas.map(m), mode: 'PANELS', grain: 'WEEK', period: { kind: 'LAST_DAYS', days: 365 }, layers: { planBands: true, events: true }, reference: { kind: 'FIRST_DAYS', days: 7 }, comparison: null });
    const METRICAS = { 'Fuerza de los básicos': ['entrenamiento.series-registradas', 'entrenamiento.volumen-carga-externa'], 'Peso y cintura': ['antropometria.peso'], 'Energía y peso por etapa': ['nutricion.energia', 'antropometria.peso'], 'Proteína por semana': ['nutricion.proteinas'] };
    for (const nombre of HERRAMIENTAS.vistasDeAnalizar) {
      if (ya.some((x) => x.name === nombre)) continue;
      await c.pedir('POST', '/me/analysis-views', { token, cuerpo: { usage: 'ANALYSIS', name: nombre, configuration: config(METRICAS[nombre]) } });
    }
    return HERRAMIENTAS.vistasDeAnalizar.length;
  }

  /** La respuesta de la persona a un campo de texto, por lo que pregunta; los demás quedan sin responder, como la gente. */
  function respuestaDe(p, campo) {
    const e = p.formulario.entrenamiento ?? {};
    const n = p.formulario.nutricion ?? {};
    const t = `${campo.fieldCode} ${campo.label}`.toLowerCase();
    if (/lesi|molest|dolor/.test(t)) return e.lesiones ?? null;
    if (/medica/.test(t)) return n.medicacion ?? null;
    if (/horari|disponib/.test(t)) return e.horario ?? null;
    if (/objetiv|meta|busc/.test(t)) return e.objetivo ?? null;
    if (/no come|alerg|intoler|evit/.test(t)) return n.noCome ?? null;
    if (/trabaj|ocupac/.test(t)) return p.formulario.habitos?.trabajo ?? null;
    return null;
  }

  let plantillas = null;
  async function plantillaDelArea(token, area, excluir = []) {
    plantillas ??= await lista('/form-templates?limit=50', token);
    const t = plantillas.find((x) => x.domain === area && !excluir.includes(x.templateId)) ?? plantillas.find((x) => !excluir.includes(x.templateId));
    // Las plantillas de inicio son de formato 3: se leen como un cliente que lo declara (DL-165).
    const def = (await c.pedir('GET', `/form-templates/${t.templateId}/versions/${t.latestVersionId}/definition`, { token, capacidades: FORMATO_3 })).data;
    return { t, campos: def.sections.flatMap((s) => s.fields) };
  }
  const plantillaDe = (x) => x.templateId ?? x.template?.templateId ?? x.templateVersion?.templateId ?? null;

  /** Los formularios de inicio de las áreas con Julieta: pedidos y respondidos por la persona desde la app (REQ-TUT-17). */
  async function formularios(p) {
    const token = await c.sesion('julieta');
    const aseId = c.ids[p.clave];
    const pedidos = await lista(`/advisees/${aseId}/form-requests?limit=50`, token);
    let n = 0;
    for (const area of ['NUTRICION', 'ENTRENAMIENTO'].filter((a) => p.areas[a] === 'J')) {
      const { t, campos } = await plantillaDelArea(token, area);
      if (pedidos.some((x) => plantillaDe(x) === t.templateId)) continue;
      const codigos = campos.map((x) => x.fieldCode).slice(0, 60);
      const r = await c.pedir('POST', `/advisees/${aseId}/form-requests`, { token, cuerpo: { templateVersionId: t.latestVersionId, purpose: 'Formulario de inicio.', scope: area, requestedFieldCodes: codigos, requiredFieldCodes: [] } });
      const textos = campos.filter((x) => x.dataType === 'TEXT' && !x.showIf && codigos.includes(x.fieldCode));
      let respuestas = textos.map((x) => ({ x, texto: respuestaDe(p, x) })).filter((y) => y.texto);
      if (!respuestas.length && textos.length) respuestas = [{ x: textos[0], texto: p.formulario.entrenamiento?.objetivo ?? 'Mejorar mi salud.' }];
      await c.pedir('POST', `/me/form-requests/${r.data.formRequestId}/answers`, { token: await c.sesion(p.clave, 'APK'), superficie: 'APK', capacidades: FORMATO_3, cuerpo: { answers: respuestas.map(({ x, texto }) => ({ fieldCode: x.fieldCode, answer: { type: 'TEXT', text: texto.slice(0, x.maxLength ?? 500) } })), fromProposal: null } });
      n++;
    }
    return n;
  }

  /** El pedido de información a Silvia (REQ-TUT-14): un formulario de otro tema, que espera su respuesta. */
  async function pedidoDeInformacion() {
    const token = await c.sesion('julieta');
    const aseId = c.ids.silvia;
    const pedidos = await lista(`/advisees/${aseId}/form-requests?limit=50`, token);
    if (pedidos.some((x) => (x.state ?? x.status) === 'PENDING')) return 'ya';
    const { t, campos } = await plantillaDelArea(token, 'ANTROPOMETRIA', pedidos.map(plantillaDe));
    await c.pedir('POST', `/advisees/${aseId}/form-requests`, { token, cuerpo: { templateVersionId: t.latestVersionId, purpose: 'Para preparar el plan 2.', scope: ['ENTRENAMIENTO', 'ANTROPOMETRIA'].includes(t.domain) ? t.domain : 'ENTRENAMIENTO', requestedFieldCodes: campos.map((x) => x.fieldCode).slice(0, 60), requiredFieldCodes: [] } });
    return 'hecho';
  }

  /** Una invitación a una persona nueva, que espera (REQ-TUT-14). */
  async function invitacion() {
    const token = await c.sesion('julieta');
    const ya = await lista('/relationship-invitations?limit=50', token);
    if (ya.some((x) => ['PENDING', 'ACTIVE'].includes(x.state))) return 'ya';
    await c.pedir('POST', '/relationship-invitations', { token, cuerpo: { scope: { code: 'NUTRICION' }, purpose: c.dominio.FINALIDAD_DE_ALCANCE.NUTRICION } });
    return 'hecho';
  }

  return { recetas, recetaParaElPlan, habituales, vistas, formularios, pedidoDeInformacion, invitacion };
}
