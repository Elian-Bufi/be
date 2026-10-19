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

/** Qué necesita cada recorrido. Las áreas son las del vínculo (y las de la habilitación del profesional). */
export const RECORRIDOS = {
  sesion: { alcances: ['NUTRICION'], datos: [] },
  pistas: { alcances: ['NUTRICION'], datos: [] },
  primerPlan: { alcances: ['NUTRICION'], datos: [] },
  borrador: { alcances: ['NUTRICION'], datos: ['borrador'] },
  conflicto: { alcances: ['NUTRICION'], datos: ['borrador'] },
  retorno: { alcances: ['NUTRICION'], datos: ['plan-con-revision'] },
  grafico: { alcances: ['ANTROPOMETRIA'], datos: ['tomas'] },
};

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
    .flatMap(([recorrido, r]) => r.alcances.map((alcance) => `${estado[recorrido].pro.id}|${alcance}|SANITARIO|${nombreDelProfesional(recorrido)}`))
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
    for (const alcance of r.alcances) e.vinculos[alcance] = await vincular(pro, ase, e.ase.id, alcance);

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
