/**
 * DL-164 · soporte de las pruebas de los formularios V2 (WP-FORMULARIOS-DE-INICIO).
 *
 * Una plantilla sintética con tipos nuevos, sembrada directo en la base para no depender de la del catálogo
 * (FRM-NUTRICION-INICIO la siembra otra migración): una opción con «otro», varias opciones con una excluyente, una
 * pregunta condicional obligatoria, una lista de comidas, alimentos con motivo, horarios y un número con límites. Y las
 * respuestas completas con que se la ejercita, en su forma canónica (lo que se guarda y se lee es igual a lo enviado).
 * Todo lo demás (el profesional, la persona, el vínculo, el B2, la Solicitud) va por la API real, como en las otras pruebas.
 */
import type { INestApplication } from '@nestjs/common';
import type { Alcance, RespuestaDeCampoV2Entrada, SeccionDePlantillaV2 } from '@be/domain';
import type { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { conSesion } from './soporte-api';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

const op = (code: string, label: string) => ({ code, label });
const base = { helpText: null, purpose: null, showIf: null, requiredByDefault: false } as const;

export const SECCIONES_V2: SeccionDePlantillaV2[] = [
  {
    sectionCode: 'tu_dia',
    title: 'Tu día',
    intro: 'Para armar un plan que entre en tu semana.',
    fields: [
      {
        ...base,
        fieldCode: 'ini_jornada',
        label: '¿Cómo es tu jornada?',
        category: 'HABITOS_Y_CONTEXTO',
        dataType: 'CHOICE',
        options: [op('oficina', 'En una oficina'), op('turnos', 'Por turnos'), op('casa', 'Desde casa'), op('otro', 'Otra')],
        otherOptionCode: 'otro',
        requiredByDefault: true,
      },
      { ...base, fieldCode: 'ini_horarios', label: '¿A qué hora te levantás y te acostás?', category: 'HABITOS_Y_CONTEXTO', dataType: 'TIMES', parts: [op('levanto', 'Me levanto'), op('acuesto', 'Me acuesto')] },
      {
        ...base,
        fieldCode: 'ini_comidas',
        label: 'Las comidas de tu semana',
        category: 'HABITOS_Y_CONTEXTO',
        dataType: 'LIST',
        itemLabel: 'comida',
        minItems: 1,
        maxItems: 8,
        requiredByDefault: true,
        itemFields: [
          { code: 'momento', label: 'Momento', required: true, dataType: 'CHOICE', options: [op('desayuno', 'Desayuno'), op('almuerzo', 'Almuerzo'), op('merienda', 'Merienda'), op('cena', 'Cena')] },
          { code: 'que', label: 'Qué comés', required: true, dataType: 'TEXT', maxLength: 120 },
          { code: 'veces', label: 'Veces por semana', required: false, dataType: 'NUMBER', unit: 'veces por semana', limits: { minimum: 1, maximum: 7, integer: true } },
        ],
      },
      { ...base, fieldCode: 'ini_agua', label: '¿Cuántos vasos de agua tomás por día?', category: 'HABITOS_Y_CONTEXTO', dataType: 'NUMBER', unit: 'vasos', limits: { minimum: 0, maximum: 30, integer: true } },
    ],
  },
  {
    sectionCode: 'salud',
    title: 'Tu salud',
    intro: null,
    fields: [
      {
        ...base,
        fieldCode: 'ini_condiciones',
        label: '¿Tenés alguna de estas condiciones?',
        category: 'SALUD_Y_SEGURIDAD',
        dataType: 'MULTI_CHOICE',
        options: [op('diabetes', 'Diabetes'), op('hipertension', 'Hipertensión'), op('ninguna', 'Ninguna'), op('otra', 'Otra')],
        maxSelected: null,
        exclusiveOptionCodes: ['ninguna'],
        otherOptionCode: 'otra',
        requiredByDefault: true,
      },
      {
        ...base,
        fieldCode: 'ini_diabetes_tipo',
        label: '¿Qué tipo de diabetes?',
        category: 'SALUD_Y_SEGURIDAD',
        dataType: 'CHOICE',
        options: [op('tipo_1', 'Tipo 1'), op('tipo_2', 'Tipo 2')],
        otherOptionCode: null,
        showIf: { fieldCode: 'ini_condiciones', anyOf: ['diabetes'] },
        requiredByDefault: true,
      },
      {
        ...base,
        fieldCode: 'ini_alimentos_no',
        label: 'Alimentos que no comés',
        category: 'HABITOS_Y_CONTEXTO',
        dataType: 'FOODS',
        suggestions: ['Leche', 'Cerdo', 'Pescado'],
        reasons: [op('no_gusta', 'No me gusta'), op('cae_mal', 'Me cae mal')],
        maxItems: 10,
      },
    ],
  },
];
/** Todos los campos, en el orden del formulario, y los que la plantilla sugiere como obligatorios. */
export const CAMPOS_V2: readonly string[] = SECCIONES_V2.flatMap((s) => s.fields.map((f) => f.fieldCode));
export const REQUERIDOS_V2: readonly string[] = SECCIONES_V2.flatMap((s) => s.fields.filter((f) => f.requiredByDefault).map((f) => f.fieldCode));

/** Respuestas completas y coherentes, en su forma canónica (lo que se guarda es igual a esto). */
export const RESPUESTAS_V2: readonly RespuestaDeCampoV2Entrada[] = [
  { fieldCode: 'ini_jornada', answer: { type: 'CHOICE', option: 'oficina', otherText: null } },
  { fieldCode: 'ini_horarios', answer: { type: 'TIMES', times: [{ part: 'levanto', time: '07:00' }, { part: 'acuesto', time: '23:30' }] } },
  { fieldCode: 'ini_comidas', answer: { type: 'LIST', items: [{ momento: 'desayuno', que: 'Café con leche y tostadas' }, { momento: 'almuerzo', que: 'Milanesa con puré', veces: 3 }] } },
  { fieldCode: 'ini_agua', answer: { type: 'NUMBER', number: 6, unit: 'vasos' } },
  { fieldCode: 'ini_condiciones', answer: { type: 'MULTI_CHOICE', options: ['diabetes'], otherText: null } },
  { fieldCode: 'ini_diabetes_tipo', answer: { type: 'CHOICE', option: 'tipo_2', otherText: null } },
  { fieldCode: 'ini_alimentos_no', answer: { type: 'FOODS', foods: [{ name: 'Leche', reason: 'cae_mal' }] } },
];

/** Las mismas respuestas con un valor distinto en un campo (lo que corrige la persona, o lo que cambia el profesional al reemplazar). */
export function conAgua(vasos: number): RespuestaDeCampoV2Entrada[] {
  return RESPUESTAS_V2.map((r) => (r.fieldCode === 'ini_agua' ? { fieldCode: r.fieldCode, answer: { type: 'NUMBER' as const, number: vasos, unit: 'vasos' } } : r));
}

/**
 * Una plantilla V2 sintética con su primera versión, escrita directo en la base como lo hace la migración del catálogo.
 * `dominio` null la hace transversal a los tres Alcances (D-D de WP-07); con uno, se pide solo en ese Alcance.
 */
export async function sembrarPlantillaV2(prisma: PrismaClient, etiqueta: string, dominio: Alcance | null = 'NUTRICION'): Promise<{ plantillaId: string; versionId: string }> {
  const plantillaId = randomUUID();
  const versionId = randomUUID();
  await prisma.plantillaDeFormulario.create({
    data: {
      id: plantillaId,
      clave: `FRM-PRUEBA-V2-${etiqueta}-${randomUUID().slice(0, 8)}`,
      versiones: {
        create: {
          id: versionId,
          version: '1',
          nombre: 'Cómo comés hoy (prueba)',
          proposito: 'Plantilla sintética de prueba de los formularios V2 (DL-164)',
          dominio,
          contenido: { format: 2, estimatedMinutes: 10, sections: SECCIONES_V2 } as unknown as Prisma.InputJsonValue,
          procedencia: { rotulo: 'Catálogo sintético de prueba: no es un catálogo clínico (DL-164).' },
        },
      },
    },
  });
  return { plantillaId, versionId };
}

/** FRM-03 sobre la versión V2: todos los campos, con los obligatorios que sugiere la plantilla. */
export async function pedirV2(app: INestApplication, pro: Parte, asesoradoId: string, versionId: string, alcance: Alcance): Promise<string> {
  const r = await conSesion(app, pro.token)
    .post(`/api/v1/advisees/${asesoradoId}/form-requests`)
    .send({ templateVersionId: versionId, purpose: 'Para empezar tu plan', scope: alcance, requestedFieldCodes: [...CAMPOS_V2], requiredFieldCodes: [...REQUERIDOS_V2] })
    .expect(201);
  return r.body.data.formRequestId as string;
}

export interface CircuitoV2 {
  readonly pro: Parte;
  readonly ase: Parte;
  readonly vinculoId: string;
  readonly consentId: string;
  readonly plantillaId: string;
  readonly versionId: string;
  readonly formRequestId: string;
}

/** Profesional del Alcance, persona con A3, vínculo aceptado con B2, la plantilla V2 y una Solicitud sobre ella. */
export async function circuitoV2(app: INestApplication, prisma: PrismaClient, etiqueta: string, alcance: Alcance = 'NUTRICION'): Promise<CircuitoV2> {
  const pro = await prepararProfesional(app, `v2-${etiqueta}`, [alcance]);
  const ase = await prepararAsesorado(app, `v2-${etiqueta}`, { a3: true });
  const v = await vinculoCompleto(app, pro, ase, alcance);
  const { plantillaId, versionId } = await sembrarPlantillaV2(prisma, etiqueta, alcance);
  const formRequestId = await pedirV2(app, pro, ase.id, versionId, alcance);
  return { pro, ase, vinculoId: v.vinculoId, consentId: v.consentId as string, plantillaId, versionId, formRequestId };
}

/** Las ocho operaciones FRI con la sesión de un actor; las escrituras llevan una Idempotency-Key nueva salvo que se pase una. */
export function fri(app: INestApplication, token: string) {
  const s = conSesion(app, token);
  return {
    definicion: (templateId: string, versionId: string) => s.get(`/api/v1/form-templates/${templateId}/versions/${versionId}/definition`),
    bandeja: (consulta = '') => s.get(`/api/v1/me/form-inbox${consulta}`),
    vista: (formRequestId: string) => s.get(`/api/v1/form-requests/${formRequestId}/view`),
    responder: (formRequestId: string, cuerpo: unknown, clave?: string) => s.post(`/api/v1/me/form-requests/${formRequestId}/answers`, clave).send(cuerpo as object),
    corregir: (formResponseId: string, cuerpo: unknown, clave?: string) => s.post(`/api/v1/me/form-responses/${formResponseId}/corrections`, clave).send(cuerpo as object),
    cargar: (formRequestId: string, cuerpo: unknown, clave?: string) => s.put(`/api/v1/form-requests/${formRequestId}/proposal`, clave).send(cuerpo as object),
    retirar: (formRequestId: string, cuerpo: unknown, clave?: string) => s.post(`/api/v1/form-requests/${formRequestId}/proposal/withdrawal`, clave).send(cuerpo as object),
    rechazar: (formRequestId: string, cuerpo: unknown, clave?: string) => s.post(`/api/v1/me/form-requests/${formRequestId}/proposal/rejection`, clave).send(cuerpo as object),
  };
}
