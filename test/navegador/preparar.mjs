// Las cuentas y los datos de CADA recorrido, propios y nuevos en cada corrida (bloque 6): ningún recorrido usa lo que
// prepara o deja otro, así que se pueden correr solos, en cualquier orden, y una falla no arrastra a los demás.
// - `cuentas`: registra un profesional y una persona por recorrido y devuelve BE_DEMO_PROFESIONALES. La habilitación
//   profesional de los ambientes de prueba se declara al arrancar la API (DL-036): por eso la API se arranca una segunda
//   vez, ANTES de cualquier recorrido. No es un reinicio para esconder una falla ni para vaciar un límite.
// - `datos`: con la API ya habilitando a esos profesionales, los vínculos con su consentimiento y lo que cada recorrido
//   necesita encontrar hecho (un borrador, un plan con revisión acordada, tres tomas de peso).
import { randomUUID } from 'node:crypto';
import { dominio, pedir, ponerNombre, registrar, sesion, vincular } from './api.mjs';

const ZONA = 'America/Argentina/Buenos_Aires';
export const hoyCivil = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function diaMas(fecha, dias) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
const instante = (fecha, hora) => new Date(`${fecha}T${hora}:00-03:00`);

/**
 * Qué necesita cada recorrido: las áreas en que el profesional está habilitado, las de sus vínculos con la persona (por
 * omisión, las mismas) y lo que tiene que encontrar hecho.
 */
export const RECORRIDOS = {
  sesion: { habilitado: ['NUTRICION'], datos: [] },
  pistas: { habilitado: ['NUTRICION'], datos: [] },
  primerPlan: { habilitado: ['NUTRICION'], datos: [] },
  borrador: { habilitado: ['NUTRICION'], datos: ['borrador'] },
  conflicto: { habilitado: ['NUTRICION'], datos: ['borrador'] },
  retorno: { habilitado: ['NUTRICION'], datos: ['plan-con-revision'] },
  grafico: { habilitado: ['ANTROPOMETRIA'], datos: ['tomas'] },
  // El área sugerida al invitar (bloque 5): sin vínculos, ninguna; con vínculos en una sola de dos áreas, esa.
  primeraInvitacion: { habilitado: ['NUTRICION', 'ENTRENAMIENTO'], vinculos: [], datos: [] },
  areaSugerida: { habilitado: ['NUTRICION', 'ENTRENAMIENTO'], vinculos: ['NUTRICION'], datos: [] },
  // Bloque 3: el servidor sigue decidiendo; recargar recupera la sesión, no un permiso ni una sesión revocados.
  sesionRevocada: { habilitado: ['NUTRICION'], datos: [] },
  accesoRevocado: { habilitado: ['NUTRICION'], datos: [] },
  // Bloque 5: una lectura que falla no borra el resto de la vista.
  faltaUnaParte: { habilitado: ['NUTRICION'], datos: ['plan-con-revision'] },
  // DL-153 (encargo del 2026-10-23): el número de Nutrición dice qué representa y qué falta registrar del plan.
  completitud: { habilitado: ['NUTRICION'], datos: ['comidas-del-plan'] },
  // DL-154: una revisión registrada dice en qué evidencia se apoyó, y lo que cambió después.
  evidencia: { habilitado: ['NUTRICION'], datos: ['comidas-del-plan', 'revision-con-evidencia'] },
};
const vinculosDe = (r) => r.vinculos ?? r.habilitado;

export const nombreDeLaPersona = (recorrido) => `Persona ${recorrido}`;
export const nombreDelProfesional = (recorrido) => `Lic. Recorrido ${recorrido}`;

export async function cuentas(corrida) {
  const estado = {};
  for (const recorrido of Object.keys(RECORRIDOS)) {
    const pro = { correo: `rec-${corrida}-${recorrido}-pro@example.invalid` };
    const ase = { correo: `rec-${corrida}-${recorrido}-persona@example.invalid` };
    pro.id = await registrar(pro.correo);
    ase.id = await registrar(ase.correo);
    estado[recorrido] = { pro, ase };
  }
  const demo = Object.entries(RECORRIDOS)
    .flatMap(([recorrido, r]) => r.habilitado.map((alcance) => `${estado[recorrido].pro.id}|${alcance}|SANITARIO|${nombreDelProfesional(recorrido)}`))
    .join(';');
  return { estado, demo };
}

const evaluacionNutricional = (ocurrio) => ({
  occurredAt: ocurrio.toISOString(),
  context: 'Primera consulta del recorrido.',
  assessment: { entries: [{ concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' }] },
  evidenceReferences: [],
  professionalNotes: 'Datos sintéticos del recorrido de navegador.',
});
const objetivoNutricional = (evaluationId, desde) => ({
  evaluationId,
  effectiveFrom: desde.toISOString(),
  effectiveUntil: null,
  estimatedEnergyRequirement: { value: 2100, unit: 'kcal/day' },
  macronutrientDistribution: { protein: { value: 130, unit: 'g/day' }, carbohydrate: { value: 220, unit: 'g/day' }, fat: { value: 65, unit: 'g/day' } },
  mealDistribution: 'Cuatro comidas.',
  rationale: 'Objetivo sintético del recorrido de navegador.',
  methodStatement: null,
});

async function alimento(pro, texto) {
  const r = await pedir('POST', '/nutrition/catalog-items/search', { token: pro, cuerpo: { q: texto, limit: 5 }, clave: false });
  const primero = r.data[0];
  if (!primero) throw new Error(`el catálogo base no tiene «${texto}» (¿se aplicaron las migraciones?)`);
  return primero.catalogItemId;
}

/** El plan de los recorridos: un día tipo con dos comidas, cada una con una opción con un alimento del catálogo base. */
async function estructura(pro) {
  const avena = await alimento(pro, 'avena');
  const arroz = await alimento(pro, 'arroz');
  return {
    dayTypes: [
      {
        label: 'Día habitual',
        meals: [
          { label: 'Desayuno', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Avena', items: [{ catalogItemId: avena, quantity: { value: 50, unit: 'g' }, preparationState: 'RAW' }] }] },
          { label: 'Almuerzo', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Arroz', items: [{ catalogItemId: arroz, quantity: { value: 150, unit: 'g' }, preparationState: 'COOKED' }] }] },
        ],
      },
    ],
  };
}

async function evaluacionYObjetivo(pro, aseId) {
  const evaluacion = (await pedir('POST', `/advisees/${aseId}/nutrition/evaluations`, { token: pro, cuerpo: evaluacionNutricional(new Date(Date.now() - 2 * 3600_000)) })).data.evaluationId;
  const objetivo = (await pedir('POST', `/advisees/${aseId}/nutrition/objectives`, { token: pro, cuerpo: objetivoNutricional(evaluacion, new Date(Date.now() - 3600_000)) })).data;
  return { evaluacion, objetivo: objetivo.versionId };
}

/** Una toma de peso por el flujo de la web (borrador y registro, API-ANT-07 y 11). */
async function toma(pro, aseId, fecha, peso) {
  const creada = (
    await pedir('POST', `/advisees/${aseId}/anthropometry/evaluation-drafts`, {
      token: pro,
      cuerpo: {
        occurredAt: instante(fecha, '08:30').toISOString(),
        // El «Perfil antropométrico completo» del catálogo que siembran las migraciones.
        specificationVersionId: '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f10',
        source: { type: 'DIRECT_CAPTURE' },
        directMeasurements: [{ metricCode: 'peso', value: peso, unit: 'kg' }],
      },
    })
  ).data;
  return (await pedir('POST', `/anthropometry/evaluation-drafts/${creada.evaluationId}/register`, { token: pro, cuerpo: { expectedVersion: creada.version } })).data.evaluationId;
}

export async function datos(estado) {
  const hoy = hoyCivil();
  for (const [recorrido, r] of Object.entries(RECORRIDOS)) {
    const e = estado[recorrido];
    const pro = await sesion(e.pro.correo);
    const ase = await sesion(e.ase.correo, 'APK');
    e.ase.nombre = nombreDeLaPersona(recorrido);
    await ponerNombre(ase, e.ase.nombre);
    await pedir('POST', '/me/health-data-consents', { token: ase, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id } });
    e.vinculos = {};
    e.consentimientos = {};
    for (const alcance of vinculosDe(r)) {
      const { vinculoId, consentId } = await vincular(pro, ase, e.ase.id, alcance);
      e.vinculos[alcance] = vinculoId;
      e.consentimientos[alcance] = consentId;
    }

    if (r.datos.includes('borrador')) {
      const { objetivo } = await evaluacionYObjetivo(pro, e.ase.id);
      const plan = (await pedir('POST', `/advisees/${e.ase.id}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivo, initialStructure: await estructura(pro) } })).data;
      e.borrador = { planId: plan.planId };
    }
    if (r.datos.includes('plan-con-revision')) {
      const { objetivo } = await evaluacionYObjetivo(pro, e.ase.id);
      const proxima = diaMas(hoy, 3);
      const plan = (await pedir('POST', `/advisees/${e.ase.id}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivo, initialStructure: await estructura(pro), nextReviewAt: proxima } })).data;
      await pedir('POST', `/nutrition/plans/${plan.planId}/activate`, { token: pro, cuerpo: { expectedVersion: plan.version } });
      e.plan = { planId: plan.planId, proximaRevision: proxima };
    }
    if (r.datos.includes('comidas-del-plan')) {
      // Un plan activo de dos comidas (desayuno y almuerzo). La persona registra desde la APK: anteayer las dos, con las
      // porciones del plan; ayer, solo el desayuno. Hoy, nada todavía.
      const { objetivo } = await evaluacionYObjetivo(pro, e.ase.id);
      const plan = (await pedir('POST', `/advisees/${e.ase.id}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivo, initialStructure: await estructura(pro) } })).data;
      await pedir('POST', `/nutrition/plans/${plan.planId}/activate`, { token: pro, cuerpo: { expectedVersion: plan.version } });
      const opciones = (await pedir('GET', '/me/nutrition/today/options', { token: ase, superficie: 'APK' })).data;
      const [desayuno, almuerzo] = opciones.meals;
      const registrarComida = (comida, fecha, hora) =>
        pedir('POST', '/me/nutrition/meal-records', {
          token: ase,
          superficie: 'APK',
          cuerpo: { kind: 'PLAN_OPTION', activePlanId: opciones.plan.planId, dayTypeId: opciones.selectedDayTypeId, mealId: comida.mealId, optionId: comida.options[0].optionId, occurredAt: instante(fecha, hora).toISOString(), consumption: { status: 'PLAN_PORTIONS' }, observation: null },
        });
      const anteayer = diaMas(hoy, -2);
      const ayer = diaMas(hoy, -1);
      const desayunoAnteayer = (await registrarComida(desayuno, anteayer, '08:30')).data;
      const almuerzoAnteayer = (await registrarComida(almuerzo, anteayer, '13:00')).data;
      await registrarComida(desayuno, ayer, '08:30');
      // DL-153, D-2 (criterios de Dirección del 2026-10-24): hace tres días, el desayuno con la opción del plan y, en el
      // almuerzo, una comida diferente sin cantidades. El almuerzo tiene registro sin ser la opción del plan; el día es un
      // subtotal por la cantidad, no por una comida sin registro.
      const haceTres = diaMas(hoy, -3);
      await registrarComida(desayuno, haceTres, '08:30');
      await pedir('POST', '/me/nutrition/meal-records', {
        token: ase,
        superficie: 'APK',
        cuerpo: { kind: 'DIFFERENT', activePlanId: opciones.plan.planId, dayTypeId: opciones.selectedDayTypeId, mealId: almuerzo.mealId, occurredAt: instante(haceTres, '13:00').toISOString(), description: 'Una pizza con amigos', approximateQuantity: null, mediaIds: [] },
      });
      e.comidas = { anteayer, ayer, haceTres, faltante: almuerzo.label, desayuno: desayuno.label, almuerzo: almuerzo.label, planVersionId: opciones.plan.planId, objetivo, desayunoAnteayer, almuerzoAnteayer };
    }
    if (r.datos.includes('revision-con-evidencia')) {
      // DL-154: el profesional revisa con las dos comidas de anteayer y la versión del plan (no con el desayuno de ayer, que
      // está en el período). Después de la revisión, la persona deshace el almuerzo de anteayer desde la APK, y el
      // profesional activa otra versión del plan: la revisada no cambia, deja de ser la vigente (D-2).
      const { anteayer, ayer, desayunoAnteayer, almuerzoAnteayer, planVersionId, objetivo } = e.comidas;
      const revision = (
        await pedir('POST', `/advisees/${e.ase.id}/nutrition/reviews`, {
          token: pro,
          cuerpo: {
            period: { start: anteayer, end: ayer, timeZone: ZONA },
            evidenceReferences: [
              { type: 'EXECUTION', id: desayunoAnteayer.recordId },
              { type: 'EXECUTION', id: almuerzoAnteayer.recordId },
              { type: 'PLAN_VERSION', id: planVersionId },
            ],
            interpretation: 'Registró las dos comidas de anteayer. Interpretación sintética del recorrido.',
            result: 'MAINTAIN',
            rationale: 'Fundamento sintético del recorrido.',
            nextAction: { description: 'Seguir con el plan.' },
          },
        })
      ).data;
      await pedir('POST', `/nutrition/meal-records/${almuerzoAnteayer.recordId}/annulment`, { token: ase, superficie: 'APK', cuerpo: { reason: 'Me equivoqué de día', expectedVersion: almuerzoAnteayer.version } });
      const sucesora = (await pedir('POST', `/advisees/${e.ase.id}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivo, initialStructure: await estructura(pro) } })).data;
      await pedir('POST', `/nutrition/plans/${sucesora.planId}/activate`, { token: pro, cuerpo: { expectedVersion: sucesora.version } });
      e.revision = { reviewId: revision.reviewId };
    }
    if (r.datos.includes('tomas')) {
      const pesos = [
        [diaMas(hoy, -20), 81.2],
        [diaMas(hoy, -12), 80.5],
        [diaMas(hoy, -4), 79.9],
      ];
      e.tomas = [];
      for (const [fecha, peso] of pesos) e.tomas.push({ fecha, peso, evaluationId: await toma(pro, e.ase.id, fecha, peso) });
    }
  }
  return estado;
}

export const nuevaCorrida = () => randomUUID().slice(0, 8);
