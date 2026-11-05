/**
 * Las dos plantillas de inicio (FI-02) contra el contrato V2: cada campo pasa el esquema, los códigos no se repiten,
 * cada condición apunta a una pregunta anterior con valores que existen, la v2 de entrenamiento conserva los seis
 * códigos de la v1 (DL-100), cada pregunta dice para qué se usa y ningún texto califica. Y una respuesta completa y
 * sintética se valida sin problemas: si una plantilla no se pudiera responder, se sabe acá y no en la APK.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CampoDePlantillaV2Schema, SeccionDePlantillaV2Schema, type CampoDePlantillaV2, type RespuestaDeCampoV2Entrada, type ValorDeRespuestaV2 } from './contratos-formularios-v2';
import { camposEnOrden, camposVisibles, obligatoriosSinResponder, problemasDeValor, sinRespuestasOcultas, usaTiposNuevos, validarRespuestasV2 } from './formularios-v2';
import { CONTEXTO_DE_ENTRENAMIENTO, CONTEXTO_DE_NUTRICION, propositoSugerido } from './formularios';
import { COPY_FORMULARIOS, terminosProhibidosDeFormulariosEn } from './copy-formularios';
import {
  PLANTILLAS_DE_INICIO,
  PLANTILLA_ENTRENAMIENTO_V2,
  PLANTILLA_NUTRICION_INICIO,
  SUGERENCIAS_DE_ALIMENTOS,
  contenidoDePlantillaDeInicio,
  type PlantillaDeInicio,
} from './plantillas-de-inicio';

const campos = (p: PlantillaDeInicio) => camposEnOrden(p.sections);
const CODIGOS_REUTILIZADOS = ['condiciones_declaradas', 'dolor_o_lesiones', 'medicacion_relevante', 'horas_de_sueno', 'nivel_de_actividad', 'fuma'];
const PREFIJO: Readonly<Record<string, string>> = { 'FRM-NUTRICION-INICIO': 'nut_', 'FRM-ENTRENAMIENTO': 'trn_' };

function sinRepetidos(codigos: readonly string[], donde: string): void {
  assert.equal(new Set(codigos).size, codigos.length, `códigos repetidos en ${donde}: ${codigos.join(', ')}`);
}

/** Los valores que una condición puede mirar en un campo: `true`/`false` en un Sí o no, los códigos en opciones. */
function valoresAdmitidos(campo: CampoDePlantillaV2): (string | boolean)[] | null {
  if (campo.dataType === 'BOOLEAN') return [true, false];
  if (campo.dataType === 'CHOICE' || campo.dataType === 'MULTI_CHOICE') return campo.options.map((o) => o.code);
  return null;
}

function textosDeOpciones(c: CampoDePlantillaV2): string[] {
  switch (c.dataType) {
    case 'CHOICE':
    case 'MULTI_CHOICE': return c.options.map((o) => o.label);
    case 'MATRIX': return [...c.rows, ...c.columns].map((o) => o.label);
    case 'TIMES': return c.parts.map((o) => o.label);
    case 'FOODS': return [...c.reasons.map((o) => o.label), ...c.suggestions];
    case 'LIST': return c.itemFields.flatMap((s) => [s.label, ...(s.dataType === 'CHOICE' ? s.options.map((o) => o.label) : [])]);
    default: return [];
  }
}

/** Un valor válido para el campo; `abre` son los valores que necesita alguna pregunta que depende de él. */
function valorSintetico(c: CampoDePlantillaV2, abre: readonly (string | boolean)[]): ValorDeRespuestaV2 {
  switch (c.dataType) {
    case 'TEXT': return { type: 'TEXT', text: 'Respuesta de prueba' };
    case 'NUMBER': return { type: 'NUMBER', number: c.limits?.minimum ?? 1, unit: c.unit };
    case 'BOOLEAN': return { type: 'BOOLEAN', yes: abre.length ? abre[0] === true : true };
    case 'CHOICE': {
      const option = abre.find((v): v is string => typeof v === 'string') ?? c.options[0]!.code;
      return { type: 'CHOICE', option, otherText: option === c.otherOptionCode ? 'Detalle de prueba' : null };
    }
    case 'MULTI_CHOICE': {
      const pedidas = abre.filter((v): v is string => typeof v === 'string');
      const normales = pedidas.filter((v) => !c.exclusiveOptionCodes.includes(v));
      const options = (normales.length ? [...new Set(normales)] : pedidas.length ? [pedidas[0]!] : [c.options.find((o) => !c.exclusiveOptionCodes.includes(o.code))!.code])
        .slice(0, c.maxSelected ?? 40);
      return { type: 'MULTI_CHOICE', options, otherText: c.otherOptionCode !== null && options.includes(c.otherOptionCode) ? 'Detalle de prueba' : null };
    }
    case 'LIST': {
      const renglon = Object.fromEntries(c.itemFields.filter((s) => s.required).map((s) => [
        s.code,
        s.dataType === 'TEXT' ? 'Renglón de prueba' : s.dataType === 'NUMBER' ? (s.limits?.minimum ?? 1) : s.dataType === 'CHOICE' ? s.options[0]!.code : true,
      ]));
      return { type: 'LIST', items: Array.from({ length: Math.max(c.minItems, 1) }, () => ({ ...renglon })) };
    }
    case 'MATRIX': return { type: 'MATRIX', cells: c.rows.map((fila) => ({ row: fila.code, column: c.columns[0]!.code })) };
    case 'FOODS': return { type: 'FOODS', foods: [{ name: c.suggestions[0] ?? 'Tomate', reason: c.reasons[0]?.code ?? null }] };
    case 'TIMES': return { type: 'TIMES', times: c.parts.map((parte) => ({ part: parte.code, time: '07:30' })) };
  }
}

/** Para cada campo del que depende alguna condición, el primer valor que abre a cada pregunta que depende de él. */
function valoresQueAbren(p: PlantillaDeInicio): Map<string, (string | boolean)[]> {
  const abren = new Map<string, (string | boolean)[]>();
  for (const c of campos(p)) if (c.showIf) abren.set(c.showIf.fieldCode, [...(abren.get(c.showIf.fieldCode) ?? []), c.showIf.anyOf[0]!]);
  return abren;
}

/** Las respuestas mínimas que dejan visible a `objetivo`: cada campo del que depende, con el valor que lo abre. */
function cadenaQueAbre(p: PlantillaDeInicio, objetivo: CampoDePlantillaV2): RespuestaDeCampoV2Entrada[] {
  const porCodigo = new Map(campos(p).map((c) => [c.fieldCode, c] as const));
  const respuestas: RespuestaDeCampoV2Entrada[] = [];
  let actual = objetivo;
  while (actual.showIf) {
    const padre = porCodigo.get(actual.showIf.fieldCode);
    assert.ok(padre, `${objetivo.fieldCode} depende de ${actual.showIf.fieldCode}, que no existe`);
    respuestas.push({ fieldCode: padre.fieldCode, answer: valorSintetico(padre, [actual.showIf.anyOf[0]!]) });
    actual = padre;
  }
  return respuestas;
}

test('las dos plantillas son las pedidas: clave, versión, nombre, dominio y minutos', () => {
  assert.deepEqual(PLANTILLAS_DE_INICIO.map((p) => [p.clave, p.version, p.nombre, p.dominio]), [
    ['FRM-NUTRICION-INICIO', '1', 'Cómo comés hoy', 'NUTRICION'],
    ['FRM-ENTRENAMIENTO', '2', 'Antes de entrenar', 'ENTRENAMIENTO'],
  ]);
  assert.equal(PLANTILLA_ENTRENAMIENTO_V2.clave, CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla);
  assert.equal(PLANTILLA_NUTRICION_INICIO.clave, CONTEXTO_DE_NUTRICION.clavePlantilla);
  for (const p of PLANTILLAS_DE_INICIO) {
    assert.ok(p.estimatedMinutes >= 10 && p.estimatedMinutes <= 15, `${p.clave}: de 10 a 15 minutos`);
    assert.ok(p.proposito.trim().length > 0 && p.sections.length > 0, p.clave);
    assert.deepEqual(contenidoDePlantillaDeInicio(p), { format: 2, estimatedMinutes: p.estimatedMinutes, sections: p.sections });
  }
});

test('FR-02 · cada formulario de inicio sugiere su «para qué», corto y sin calificar a la persona; los demás no sugieren nada', () => {
  assert.equal(propositoSugerido(CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla), COPY_FORMULARIOS.propositoDeContextoDeEntrenamiento);
  assert.equal(propositoSugerido(CONTEXTO_DE_NUTRICION.clavePlantilla), COPY_FORMULARIOS.propositoDeContextoDeNutricion);
  for (const p of PLANTILLAS_DE_INICIO) {
    const sugerido = propositoSugerido(p.clave);
    assert.ok(sugerido && sugerido.length <= 40, `${p.clave}: una frase corta`);
    assert.deepEqual(terminosProhibidosDeFormulariosEn(sugerido), [], p.clave);
  }
  assert.notEqual(propositoSugerido(CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla), propositoSugerido(CONTEXTO_DE_NUTRICION.clavePlantilla));
  for (const clave of ['FRM-HABITOS', 'FRM-SALUD', '']) assert.equal(propositoSugerido(clave), null, clave);
  for (const t of [COPY_FORMULARIOS.pedidoDesdeNutricion, COPY_FORMULARIOS.volverANutricion]) assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
});

test('cada sección y cada campo pasan el contrato V2', () => {
  for (const p of PLANTILLAS_DE_INICIO) {
    sinRepetidos(p.sections.map((s) => s.sectionCode), `${p.clave} (secciones)`);
    for (const s of p.sections) {
      for (const c of s.fields) {
        const r = CampoDePlantillaV2Schema.safeParse(c);
        assert.ok(r.success, `${p.clave} · ${c.fieldCode}: ${r.success ? '' : JSON.stringify(r.error.issues.slice(0, 3))}`);
      }
      assert.ok(SeccionDePlantillaV2Schema.safeParse(s).success, `${p.clave} · ${s.sectionCode}`);
    }
  }
});

test('los códigos no se repiten: de campo en la plantilla; de opción, fila, columna, parte, motivo y subcampo en el campo', () => {
  for (const p of PLANTILLAS_DE_INICIO) {
    const todos = campos(p);
    sinRepetidos(todos.map((c) => c.fieldCode), p.clave);
    for (const c of todos) {
      const donde = `${p.clave} · ${c.fieldCode}`;
      switch (c.dataType) {
        case 'CHOICE':
        case 'MULTI_CHOICE': sinRepetidos(c.options.map((o) => o.code), donde); break;
        case 'MATRIX':
          sinRepetidos(c.rows.map((o) => o.code), `${donde} (filas)`);
          sinRepetidos(c.columns.map((o) => o.code), `${donde} (columnas)`);
          break;
        case 'TIMES': sinRepetidos(c.parts.map((o) => o.code), donde); break;
        case 'FOODS':
          sinRepetidos(c.reasons.map((o) => o.code), `${donde} (motivos)`);
          sinRepetidos(c.suggestions.map((s) => s.toLocaleLowerCase('es-AR')), `${donde} (sugeridos)`);
          break;
        case 'LIST':
          sinRepetidos(c.itemFields.map((s) => s.code), `${donde} (subcampos)`);
          for (const sub of c.itemFields) if (sub.dataType === 'CHOICE') sinRepetidos(sub.options.map((o) => o.code), `${donde} · ${sub.code}`);
          assert.ok(c.minItems <= c.maxItems, donde);
          break;
        default: break;
      }
    }
  }
});

test('cada condición apunta a una pregunta anterior, de Sí o no o de opciones, con valores que esa pregunta admite', () => {
  for (const p of PLANTILLAS_DE_INICIO) {
    const anteriores = new Map<string, CampoDePlantillaV2>();
    for (const c of campos(p)) {
      const donde = `${p.clave} · ${c.fieldCode}`;
      if (c.showIf !== null) {
        const padre = anteriores.get(c.showIf.fieldCode);
        assert.ok(padre, `${donde}: la condición apunta a ${c.showIf.fieldCode}, que no está antes`);
        const admitidos = valoresAdmitidos(padre);
        assert.ok(admitidos, `${donde}: ${padre.fieldCode} no es de Sí o no ni de opciones`);
        for (const v of c.showIf.anyOf) assert.ok(admitidos.includes(v), `${donde}: ${String(v)} no es un valor de ${padre.fieldCode}`);
      }
      anteriores.set(c.fieldCode, c);
      // «Otro» y las opciones que van solas tienen que ser opciones del campo.
      if (c.dataType === 'CHOICE' && c.otherOptionCode !== null) assert.ok(c.options.some((o) => o.code === c.otherOptionCode), donde);
      if (c.dataType === 'MULTI_CHOICE') {
        const codigos = new Set(c.options.map((o) => o.code));
        if (c.otherOptionCode !== null) assert.ok(codigos.has(c.otherOptionCode), donde);
        for (const e of c.exclusiveOptionCodes) assert.ok(codigos.has(e), `${donde}: ${e}`);
        if (c.maxSelected !== null) assert.ok(c.maxSelected <= c.options.length, donde);
      }
    }
  }
});

test('«Antes de entrenar» v2 conserva los seis códigos de la v1 y «días por semana» sigue siendo un entero de 1 a 7 (DL-100, DL-101)', () => {
  const porCodigo = new Map(campos(PLANTILLA_ENTRENAMIENTO_V2).map((c) => [c.fieldCode, c] as const));
  for (const codigo of CONTEXTO_DE_ENTRENAMIENTO.campos) assert.ok(porCodigo.has(codigo), `falta ${codigo}`);
  const dias = porCodigo.get('trn_dias_por_semana');
  assert.ok(dias && dias.dataType === 'NUMBER', 'días por semana es un número');
  assert.deepEqual(dias.limits, { minimum: 1, maximum: 7, integer: true });
  const minutos = porCodigo.get('trn_minutos_por_sesion');
  assert.ok(minutos && minutos.dataType === 'NUMBER' && minutos.limits?.integer === true, 'minutos por sesión es un entero');
});

test('las dos usan tipos nuevos, tienen como mucho 80 campos y entran enteras en una Solicitud', () => {
  for (const p of PLANTILLAS_DE_INICIO) {
    assert.equal(usaTiposNuevos(p.sections), true, p.clave);
    const n = campos(p).length;
    assert.ok(n <= 80, `${p.clave}: ${n} campos`);
    // FRM-03 admite hasta 60 códigos pedidos (`CrearSolicitudDeFormularioRequestSchema`): con más, no se podría pedir entera.
    assert.ok(n <= 60, `${p.clave}: ${n} campos no entran en una Solicitud`);
  }
});

test('cada pregunta dice para qué se usa y ningún texto califica ni usa los términos prohibidos', () => {
  const juicios = ['adherencia', 'puntaje', 'incumpl', 'saludable'];
  for (const p of PLANTILLAS_DE_INICIO) {
    const textos: [string, string][] = [['nombre', p.nombre], ['proposito', p.proposito]];
    for (const s of p.sections) {
      textos.push([s.sectionCode, s.title]);
      if (s.intro) textos.push([s.sectionCode, s.intro]);
    }
    for (const c of campos(p)) {
      assert.ok(typeof c.purpose === 'string' && c.purpose.trim().length > 0, `${p.clave} · ${c.fieldCode} no dice para qué se usa`);
      textos.push([c.fieldCode, c.label], [c.fieldCode, c.purpose]);
      if (c.helpText) textos.push([c.fieldCode, c.helpText]);
      for (const o of textosDeOpciones(c)) textos.push([c.fieldCode, o]);
    }
    for (const [donde, t] of textos) {
      assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], `${p.clave} · ${donde}: «${t}»`);
      for (const j of juicios) assert.ok(!t.toLowerCase().includes(j), `${p.clave} · ${donde} dice «${j}»`);
    }
  }
});

test('los códigos llevan el prefijo del formulario, salvo los que reutilizan FRM-SALUD, FRM-HABITOS y la v1', () => {
  for (const p of PLANTILLAS_DE_INICIO) {
    for (const c of campos(p)) {
      assert.ok(c.fieldCode.startsWith(PREFIJO[p.clave]!) || CODIGOS_REUTILIZADOS.includes(c.fieldCode), `${p.clave} · ${c.fieldCode}`);
    }
  }
  const nut = new Set(campos(PLANTILLA_NUTRICION_INICIO).map((c) => c.fieldCode));
  const trn = new Set(campos(PLANTILLA_ENTRENAMIENTO_V2).map((c) => c.fieldCode));
  for (const codigo of ['condiciones_declaradas', 'medicacion_relevante', 'nivel_de_actividad']) assert.ok(nut.has(codigo), `Nutrición reutiliza ${codigo}`);
  for (const codigo of ['dolor_o_lesiones', 'medicacion_relevante', 'horas_de_sueno', 'nivel_de_actividad', 'fuma']) assert.ok(trn.has(codigo), `Entrenamiento reutiliza ${codigo}`);
});

test('lo que no puede faltar: las comidas de la semana (con los subcampos que lee el escritorio), los alimentos que sí y que no, y el otro deporte', () => {
  const nut = new Map(campos(PLANTILLA_NUTRICION_INICIO).map((c) => [c.fieldCode, c] as const));
  const comidas = nut.get('nut_comidas_habituales');
  assert.ok(comidas && comidas.dataType === 'LIST', 'las comidas habituales son una lista');
  assert.deepEqual(comidas.itemFields.map((s) => s.code), ['momento', 'que', 'veces', 'porcion', 'preparacion', 'donde', 'bebida', 'gusto']);
  assert.equal(comidas.minItems, 3);
  assert.equal(comidas.maxItems, 15);
  assert.equal(comidas.requiredByDefault, true);
  const si = nut.get('nut_alimentos_si');
  const no = nut.get('nut_alimentos_no');
  assert.ok(si && si.dataType === 'FOODS' && si.reasons.length === 0 && si.suggestions.length === SUGERENCIAS_DE_ALIMENTOS.length, 'alimentos que sí');
  assert.ok(no && no.dataType === 'FOODS' && no.reasons.map((r) => r.code).join(',') === 'no_me_gusta,me_cae_mal,por_eleccion', 'alimentos que no, con motivo');
  const otros = campos(PLANTILLA_ENTRENAMIENTO_V2).find((c) => c.fieldCode === 'trn_otros_deportes');
  assert.ok(otros && otros.dataType === 'LIST' && otros.showIf?.fieldCode === 'trn_otro_deporte', 'otro deporte es una lista detrás de un Sí o no');
  assert.deepEqual(otros.itemFields.map((s) => [s.code, s.dataType]), [['cual', 'TEXT'], ['dias', 'NUMBER'], ['minutos', 'NUMBER'], ['exigencia', 'CHOICE']]);
});

test('una respuesta completa y sintética no tiene problemas, cada pregunta condicional se puede abrir y la oculta no se exige', () => {
  for (const p of PLANTILLAS_DE_INICIO) {
    const todos = campos(p);
    const abre = valoresQueAbren(p);
    const completas: RespuestaDeCampoV2Entrada[] = todos.map((c) => ({ fieldCode: c.fieldCode, answer: valorSintetico(c, abre.get(c.fieldCode) ?? []) }));
    for (const r of completas) {
      const campo = todos.find((c) => c.fieldCode === r.fieldCode)!;
      assert.deepEqual(problemasDeValor(campo, r.answer, 'x'), [], `${p.clave} · ${r.fieldCode}`);
    }
    const solicitud = { requestedFieldCodes: todos.map((c) => c.fieldCode), requiredFieldCodes: todos.filter((c) => c.requiredByDefault).map((c) => c.fieldCode) };
    const visibles = sinRespuestasOcultas(p.sections, completas);
    assert.deepEqual(validarRespuestasV2(p.sections, solicitud, visibles), [], p.clave);
    for (const c of todos.filter((x) => x.showIf !== null)) {
      assert.ok(camposVisibles(p.sections, cadenaQueAbre(p, c)).has(c.fieldCode), `${p.clave} · ${c.fieldCode} no se puede abrir`);
    }
  }
  // El «¿a qué alimento?» es obligatorio solo si hay alergia: con «no», no se pide.
  const solicitud = { requestedFieldCodes: ['nut_alergias', 'nut_alergias_cuales'], requiredFieldCodes: ['nut_alergias', 'nut_alergias_cuales'] };
  const sinAlergias: RespuestaDeCampoV2Entrada[] = [{ fieldCode: 'nut_alergias', answer: { type: 'BOOLEAN', yes: false } }];
  assert.deepEqual(obligatoriosSinResponder(PLANTILLA_NUTRICION_INICIO.sections, solicitud, sinAlergias), []);
  assert.deepEqual(validarRespuestasV2(PLANTILLA_NUTRICION_INICIO.sections, solicitud, sinAlergias), []);
});
