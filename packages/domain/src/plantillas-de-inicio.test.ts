/**
 * Las dos plantillas de inicio (FI-02) contra el contrato V2: cada campo pasa el esquema, los códigos no se repiten,
 * cada condición apunta a una pregunta anterior con valores que existen, la v2 de entrenamiento conserva los seis
 * códigos de la v1 (DL-100), cada pregunta dice para qué se usa y ningún texto califica. Y una respuesta completa y
 * sintética se valida sin problemas: si una plantilla no se pudiera responder, se sabe acá y no en la APK.
 *
 * WP-FORMULARIOS-RONDA-2 (DL-165, FR-06) suma las sucesoras de formato 3, FRM-NUTRICION-INICIO v2 y FRM-ENTRENAMIENTO v3,
 * con lo que decidió Dirección: el embarazo sin pedir (D-4), la tabla de días con su tope (D-5), otra actividad con sus
 * días (D-6) y los ejemplos como texto de muestra (D-2). Las de formato 2 no cambian: la APK 0.20 las sigue leyendo.
 *
 * La ronda 2.1 (D-15 nueva de Dirección, 2026-11-06) suma «Tus hábitos» como formulario aparte (FRM-HABITOS v2, la misma
 * parte, sola) y las de área sin la parte (FRM-NUTRICION-INICIO v3 y FRM-ENTRENAMIENTO v4). Las de la ronda 2 no cambian.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CampoDePlantillaV2Schema, SeccionDePlantillaV2Schema, type CampoDePlantillaV2, type RespuestaDeCampoV2Entrada, type ValorDeRespuestaV2 } from './contratos-formularios-v2';
import { camposEnOrden, camposVisibles, CODIGO_DE_PROBLEMA_V2, loQueUsaDelFormato3, obligatoriosSinResponder, problemasDeValor, sinRespuestasOcultas, usaTiposNuevos, validarRespuestasV2 } from './formularios-v2';
import { CLAVE_DEL_FORMULARIO_DE_HABITOS, CONTEXTO_DE_ENTRENAMIENTO, CONTEXTO_DE_NUTRICION, propositoSugerido } from './formularios';
import { COPY_FORMULARIOS, terminosProhibidosDeFormulariosEn } from './copy-formularios';
import {
  PLANTILLAS_DE_AREA_VIGENTES,
  PLANTILLAS_DE_INICIO,
  PLANTILLAS_VIGENTES_DE_INICIO,
  PLANTILLA_ENTRENAMIENTO_V2,
  PLANTILLA_ENTRENAMIENTO_V3,
  PLANTILLA_ENTRENAMIENTO_V4,
  PLANTILLA_HABITOS_V2,
  PLANTILLA_NUTRICION_INICIO,
  PLANTILLA_NUTRICION_INICIO_V2,
  PLANTILLA_NUTRICION_INICIO_V3,
  SECCION_DE_HABITOS,
  SUGERENCIAS_DE_ALIMENTOS,
  contenidoDePlantillaDeInicio,
  type PlantillaDeInicio,
} from './plantillas-de-inicio';
import { CAMPOS_DE_HABITOS } from './habitos-de-la-persona';
import { COPY_HABITOS } from './copy-habitos-de-la-persona';
import { partesDelFormulario } from './partes-de-formulario';

const campos = (p: PlantillaDeInicio) => camposEnOrden(p.sections);
const CODIGOS_REUTILIZADOS = ['condiciones_declaradas', 'dolor_o_lesiones', 'medicacion_relevante', 'horas_de_sueno', 'nivel_de_actividad', 'fuma'];
const PREFIJO: Readonly<Record<string, string>> = { 'FRM-NUTRICION-INICIO': 'nut_', 'FRM-ENTRENAMIENTO': 'trn_', 'FRM-HABITOS': 'habitos_' };

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
    case 'LIST': return c.itemFields.flatMap((s) => [s.label, ...(s.dataType === 'CHOICE' || s.dataType === 'MULTI_CHOICE' ? s.options.map((o) => o.label) : []), ...(s.dataType === 'TEXT' && s.helpText ? [s.helpText] : [])]);
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
        s.dataType === 'TEXT' ? 'Renglón de prueba' : s.dataType === 'NUMBER' ? (s.limits?.minimum ?? 1) : s.dataType === 'CHOICE' ? s.options[0]!.code : s.dataType === 'MULTI_CHOICE' ? [s.options[0]!.code] : true,
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

test('las siete versiones son las pedidas: clave, versión, nombre, dominio, formato y minutos; las vigentes son las de la ronda 2.1', () => {
  assert.deepEqual(PLANTILLAS_DE_INICIO.map((p) => [p.clave, p.version, p.nombre, p.dominio, p.formato]), [
    ['FRM-NUTRICION-INICIO', '1', 'Cómo comés hoy', 'NUTRICION', 2],
    ['FRM-ENTRENAMIENTO', '2', 'Antes de entrenar', 'ENTRENAMIENTO', 2],
    ['FRM-NUTRICION-INICIO', '2', 'Cómo comés hoy', 'NUTRICION', 3],
    ['FRM-ENTRENAMIENTO', '3', 'Antes de entrenar', 'ENTRENAMIENTO', 3],
    // Ronda 2.1 (D-15 nueva): «Tus hábitos» aparte, sin área propia, y las de área sin la parte.
    ['FRM-HABITOS', '2', 'Tus hábitos', null, 3],
    ['FRM-NUTRICION-INICIO', '3', 'Cómo comés hoy', 'NUTRICION', 3],
    ['FRM-ENTRENAMIENTO', '4', 'Antes de entrenar', 'ENTRENAMIENTO', 3],
  ]);
  assert.deepEqual(PLANTILLAS_VIGENTES_DE_INICIO, [PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_ENTRENAMIENTO_V4, PLANTILLA_HABITOS_V2]);
  assert.deepEqual(PLANTILLAS_DE_AREA_VIGENTES, [PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_ENTRENAMIENTO_V4]);
  assert.equal(PLANTILLA_ENTRENAMIENTO_V4.clave, CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla);
  assert.equal(PLANTILLA_NUTRICION_INICIO_V3.clave, CONTEXTO_DE_NUTRICION.clavePlantilla);
  assert.equal(PLANTILLA_HABITOS_V2.clave, CLAVE_DEL_FORMULARIO_DE_HABITOS);
  for (const p of PLANTILLAS_DE_INICIO) {
    assert.ok(p.proposito.trim().length > 0 && p.sections.length > 0, p.clave);
    if (p.formato === 2) {
      // Las de DL-164, como se sembraron: con sus minutos y sin nada del formato 3.
      assert.ok(p.estimatedMinutes !== null && p.estimatedMinutes >= 10 && p.estimatedMinutes <= 15, `${p.clave}: de 10 a 15 minutos`);
      assert.deepEqual(contenidoDePlantillaDeInicio(p), { format: 2, estimatedMinutes: p.estimatedMinutes, sections: p.sections });
      assert.deepEqual(loQueUsaDelFormato3(p.sections), [], `${p.clave} v${p.version}`);
    } else {
      // DL-165 D-3: sin minutos. D-10: usan algo del formato 3, y por eso la APK 0.20 no las recibe.
      assert.equal(p.estimatedMinutes, null);
      assert.deepEqual(contenidoDePlantillaDeInicio(p), { format: 3, sections: p.sections });
      assert.ok(loQueUsaDelFormato3(p.sections).length > 0, `${p.clave} v${p.version}`);
    }
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
  // Ronda 2.1: «Tus hábitos» sugiere el suyo, aparte o sumado a uno de área (D-22).
  assert.equal(propositoSugerido(CLAVE_DEL_FORMULARIO_DE_HABITOS), COPY_HABITOS.web.propositoDelFormulario);
  for (const clave of ['FRM-SALUD', '']) assert.equal(propositoSugerido(clave), null, clave);
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
          for (const sub of c.itemFields) if (sub.dataType === 'CHOICE' || sub.dataType === 'MULTI_CHOICE') sinRepetidos(sub.options.map((o) => o.code), `${donde} · ${sub.code}`);
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

test('«Antes de entrenar» v2 y v3 conservan los seis códigos de la v1 y «días por semana» sigue siendo un entero de 1 a 7 (DL-100, DL-101)', () => {
  for (const p of [PLANTILLA_ENTRENAMIENTO_V2, PLANTILLA_ENTRENAMIENTO_V3]) {
    const porCodigo = new Map(campos(p).map((c) => [c.fieldCode, c] as const));
    for (const codigo of CONTEXTO_DE_ENTRENAMIENTO.campos) assert.ok(porCodigo.has(codigo), `v${p.version}: falta ${codigo}`);
    const dias = porCodigo.get('trn_dias_por_semana');
    assert.ok(dias && dias.dataType === 'NUMBER', 'días por semana es un número');
    assert.deepEqual(dias.limits, { minimum: 1, maximum: 7, integer: true });
    const minutos = porCodigo.get('trn_minutos_por_sesion');
    assert.ok(minutos && minutos.dataType === 'NUMBER' && minutos.limits?.integer === true, 'minutos por sesión es un entero');
  }
});

test('todas usan tipos nuevos, tienen como mucho 80 campos y entran enteras en una Solicitud', () => {
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

test('los códigos llevan el prefijo del formulario, salvo los que reutilizan FRM-SALUD, FRM-HABITOS y la v1, y los de la parte común', () => {
  for (const p of PLANTILLAS_DE_INICIO) {
    for (const c of campos(p)) {
      // DL-165 D-9: la parte «Tus hábitos» es de las dos áreas, con códigos neutros (`habitos_`) o reutilizados.
      const deLaParteComun = p.formato === 3 && CAMPOS_DE_HABITOS.includes(c.fieldCode);
      if (p.clave === CLAVE_DEL_FORMULARIO_DE_HABITOS) assert.ok(deLaParteComun, `${p.clave} · ${c.fieldCode}: «Tus hábitos» solo trae la parte común`);
      assert.ok(c.fieldCode.startsWith(PREFIJO[p.clave]!) || CODIGOS_REUTILIZADOS.includes(c.fieldCode) || deLaParteComun, `${p.clave} · ${c.fieldCode}`);
    }
  }
  for (const codigo of CAMPOS_DE_HABITOS) assert.ok(codigo.startsWith('habitos_') || CODIGOS_REUTILIZADOS.includes(codigo), codigo);
  for (const [nutricion, entrenamiento] of [[PLANTILLA_NUTRICION_INICIO, PLANTILLA_ENTRENAMIENTO_V2], [PLANTILLA_NUTRICION_INICIO_V2, PLANTILLA_ENTRENAMIENTO_V3]] as const) {
    const nut = new Set(campos(nutricion).map((c) => c.fieldCode));
    const trn = new Set(campos(entrenamiento).map((c) => c.fieldCode));
    for (const codigo of ['condiciones_declaradas', 'medicacion_relevante', 'nivel_de_actividad']) assert.ok(nut.has(codigo), `Nutrición reutiliza ${codigo}`);
    for (const codigo of ['dolor_o_lesiones', 'medicacion_relevante', 'horas_de_sueno', 'nivel_de_actividad', 'fuma']) assert.ok(trn.has(codigo), `Entrenamiento reutiliza ${codigo}`);
  }
  // Ronda 2.1: las de área conservan los de la salud; el sueño y el día pasan a «Tus hábitos», que es la v2 de FRM-HABITOS
  // y reutiliza sus códigos de P0 (`horas_de_sueno`, `nivel_de_actividad`).
  for (const codigo of ['condiciones_declaradas', 'medicacion_relevante']) assert.ok(campos(PLANTILLA_NUTRICION_INICIO_V3).some((c) => c.fieldCode === codigo), codigo);
  for (const codigo of ['dolor_o_lesiones', 'medicacion_relevante', 'fuma']) assert.ok(campos(PLANTILLA_ENTRENAMIENTO_V4).some((c) => c.fieldCode === codigo), codigo);
  for (const codigo of ['horas_de_sueno', 'nivel_de_actividad']) assert.ok(campos(PLANTILLA_HABITOS_V2).some((c) => c.fieldCode === codigo), codigo);
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

// ─── WP-FORMULARIOS-RONDA-2 (DL-165, FR-06) ─────────────────────────────────────────────────────

const campoDeLa = (p: PlantillaDeInicio, codigo: string): CampoDePlantillaV2 => {
  const c = campos(p).find((x) => x.fieldCode === codigo);
  assert.ok(c, `${p.clave} v${p.version}: falta ${codigo}`);
  return c;
};

test('DL-165 D-4 · el embarazo no viene pedido ni es obligatorio en las dos versiones nuevas; en las de DL-164 sigue como estaba', () => {
  for (const [p, codigo] of [[PLANTILLA_NUTRICION_INICIO_V2, 'nut_embarazo'], [PLANTILLA_ENTRENAMIENTO_V3, 'trn_embarazo']] as const) {
    assert.deepEqual([campoDeLa(p, codigo).requestedByDefault, campoDeLa(p, codigo).requiredByDefault], [false, false], `${p.clave} v${p.version}`);
  }
  assert.equal(campoDeLa(PLANTILLA_ENTRENAMIENTO_V2, 'trn_embarazo').requiredByDefault, true);
  assert.equal('requestedByDefault' in campoDeLa(PLANTILLA_ENTRENAMIENTO_V2, 'trn_embarazo'), false);
  // Es la única que no viene pedida: las demás, como siempre.
  for (const p of [PLANTILLA_NUTRICION_INICIO_V2, PLANTILLA_ENTRENAMIENTO_V3, PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_ENTRENAMIENTO_V4]) {
    assert.deepEqual(campos(p).filter((c) => c.requestedByDefault === false).map((c) => c.fieldCode), [p.clave === 'FRM-NUTRICION-INICIO' ? 'nut_embarazo' : 'trn_embarazo'], `${p.clave} v${p.version}`);
  }
  assert.deepEqual(campos(PLANTILLA_HABITOS_V2).filter((c) => c.requestedByDefault === false), []);
  // La pregunta de las indicaciones médicas suma el ejemplo.
  assert.equal(campoDeLa(PLANTILLA_ENTRENAMIENTO_V3, 'trn_salud_supervision').helpText, 'Por ejemplo, por un embarazo o un parto reciente.');
});

test('DL-165 D-7 · «Cómo comés hoy» v2 sigue con las obligatorias de la v1 (más las de la parte común), y los ejemplos de las comidas van como texto de muestra del renglón', () => {
  const obligatorias = (p: PlantillaDeInicio) => campos(p).filter((c) => c.requiredByDefault).map((c) => c.fieldCode);
  // Las «20» de la prueba de Dirección son 22 en la plantilla: 21, y la de las alergias, que se ve solo si hay alergia.
  assert.equal(obligatorias(PLANTILLA_NUTRICION_INICIO).length, 22);
  // D-15: las que pasan a la parte común siguen obligatorias ahí; la parte suma las horas de sueño y la lista del deporte
  // (esta, solo con «Sí»). Quedan 24: 22 a la vista, y las alergias y el deporte, detrás de su condición.
  const MOVIDAS = ['nut_horarios', 'nivel_de_actividad', 'nut_actividad_semanal'];
  const deLaParte = SECCION_DE_HABITOS.fields.filter((c) => c.requiredByDefault).map((c) => c.fieldCode);
  assert.deepEqual(new Set(obligatorias(PLANTILLA_NUTRICION_INICIO_V2)), new Set([...obligatorias(PLANTILLA_NUTRICION_INICIO).filter((c) => !MOVIDAS.includes(c)), ...deLaParte]));
  assert.equal(obligatorias(PLANTILLA_NUTRICION_INICIO_V2).length, 24);
  assert.equal(campos(PLANTILLA_NUTRICION_INICIO_V2).filter((c) => c.requiredByDefault && c.showIf === null).length, 22);
  const comidas = campoDeLa(PLANTILLA_NUTRICION_INICIO_V2, 'nut_comidas_habituales');
  assert.ok(comidas.dataType === 'LIST');
  assert.deepEqual(comidas.itemFields.map((s) => s.code), ['momento', 'que', 'veces', 'porcion', 'preparacion', 'donde', 'bebida', 'gusto']);
  const ejemplos = Object.fromEntries(comidas.itemFields.flatMap((s) => (s.dataType === 'TEXT' && s.helpText ? [[s.code, s.helpText]] : [])));
  assert.deepEqual(ejemplos, { que: 'Milanesa de carne al horno con puré de papa', porcion: '1 plato playo, 2 unidades, 1 taza, 3 cucharadas…' });
  // Lo demás de la v1 no cambia: la parte común primero y, después, las mismas preguntas de la v1, en el mismo orden,
  // sin las tres que pasaron a la parte.
  assert.deepEqual(campos(PLANTILLA_NUTRICION_INICIO_V2).map((c) => c.fieldCode), [...CAMPOS_DE_HABITOS, ...campos(PLANTILLA_NUTRICION_INICIO).map((c) => c.fieldCode).filter((c) => !MOVIDAS.includes(c))]);
});

test('DL-165 D-9 · la parte «Tus hábitos» va primera en «Cómo comés hoy» y antes de «Tu semana para entrenar» en «Antes de entrenar»: siete partes en cada una (D-15)', () => {
  assert.deepEqual(PLANTILLA_NUTRICION_INICIO_V2.sections.map((s) => s.sectionCode), ['tus_habitos', 'tu_dia', 'tu_semana', 'si_y_no', 'lo_que_tomas', 'salud', 'lo_que_buscas']);
  assert.deepEqual(PLANTILLA_ENTRENAMIENTO_V3.sections.map((s) => s.sectionCode), ['salud', 'dolor', 'experiencia', 'lo_que_buscas', 'tus_habitos', 'tu_semana', 'preferencias']);
  for (const p of [PLANTILLA_NUTRICION_INICIO_V2, PLANTILLA_ENTRENAMIENTO_V3]) {
    assert.deepEqual(p.sections.find((s) => s.sectionCode === 'tus_habitos'), SECCION_DE_HABITOS, p.clave);
    // Pidiéndolo entero, «Parte N de 7»; las de DL-164 siguen con seis.
    const todo = { requestedFieldCodes: campos(p).map((c) => c.fieldCode) };
    assert.equal(partesDelFormulario(p.sections, todo).length, 7, p.clave);
  }
  for (const p of [PLANTILLA_NUTRICION_INICIO, PLANTILLA_ENTRENAMIENTO_V2]) assert.equal(partesDelFormulario(p.sections, { requestedFieldCodes: campos(p).map((c) => c.fieldCode) }).length, 6, p.clave);
  // «¿En qué momento del día solés entrenar?» es de Nutrición y se abre con el deporte de la parte común.
  assert.deepEqual(campoDeLa(PLANTILLA_NUTRICION_INICIO_V2, 'nut_hora_de_entrenamiento').showIf, { fieldCode: 'habitos_hace_deporte', anyOf: [true] });
  for (const codigo of ['nut_horarios', 'nut_actividad_semanal']) assert.ok(!campos(PLANTILLA_NUTRICION_INICIO_V2).some((c) => c.fieldCode === codigo), codigo);
  for (const codigo of ['trn_otro_deporte', 'trn_otros_deportes', 'trn_estres']) assert.ok(!campos(PLANTILLA_ENTRENAMIENTO_V3).some((c) => c.fieldCode === codigo), codigo);
  // «Descanso y preferencias» se quedó con las preferencias: el sueño y el estrés están en la parte común.
  const preferencias = PLANTILLA_ENTRENAMIENTO_V3.sections.find((s) => s.sectionCode === 'preferencias')!;
  assert.deepEqual([preferencias.title, preferencias.fields.map((c) => c.fieldCode)], ['Tus preferencias', ['trn_preferencias', 'trn_aerobico', 'trn_no_quiero', 'trn_algo_mas']]);
  // La salud sigue en cada área (D-9).
  for (const codigo of ['medicacion_relevante', 'condiciones_declaradas', 'nut_embarazo']) assert.ok(campos(PLANTILLA_NUTRICION_INICIO_V2).some((c) => c.fieldCode === codigo), codigo);
  for (const codigo of ['medicacion_relevante', 'trn_embarazo', 'fuma']) assert.ok(campos(PLANTILLA_ENTRENAMIENTO_V3).some((c) => c.fieldCode === codigo), codigo);
});

test('DL-165 D-5 · «Antes de entrenar» v3 pregunta los días y el momento en una tabla, y los días por semana no pasan de los marcados', () => {
  const codigos = campos(PLANTILLA_ENTRENAMIENTO_V3).map((c) => c.fieldCode);
  assert.ok(!codigos.includes('trn_dias_posibles') && !codigos.includes('trn_franja'), 'la tabla reemplaza a las dos preguntas');
  const tabla = campoDeLa(PLANTILLA_ENTRENAMIENTO_V3, 'trn_dias_y_horario');
  assert.ok(tabla.dataType === 'MATRIX');
  assert.deepEqual(tabla.rows.map((o) => o.label), ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
  assert.deepEqual(tabla.columns.map((o) => o.label), ['Temprano', 'Mañana', 'Mediodía', 'Tarde', 'Noche', 'Varía', 'No puedo']);
  assert.equal(tabla.requiredByDefault, true);
  const dias = campoDeLa(PLANTILLA_ENTRENAMIENTO_V3, 'trn_dias_por_semana');
  assert.ok(dias.dataType === 'NUMBER');
  assert.deepEqual(dias.maxFromMatrix, { fieldCode: 'trn_dias_y_horario', exceptColumns: ['no_puedo'] });
  // La tabla va antes que el número, en la misma parte.
  assert.equal(codigos.indexOf('trn_dias_y_horario') + 1, codigos.indexOf('trn_dias_por_semana'));
  const enLaSemana = PLANTILLA_ENTRENAMIENTO_V3.sections.find((s) => s.sectionCode === 'tu_semana')!.fields.map((c) => c.fieldCode);
  assert.ok(enLaSemana.includes('trn_dias_y_horario') && enLaSemana.includes('trn_dias_por_semana'));
  // Tres días posibles (y un «No puedo»): cuatro días por semana no pasa; tres, sí.
  const solicitud = { requestedFieldCodes: ['trn_dias_y_horario', 'trn_dias_por_semana'], requiredFieldCodes: [] };
  const tres = { fieldCode: 'trn_dias_y_horario', answer: { type: 'MATRIX' as const, cells: [{ row: 'lun', column: 'manana' }, { row: 'mie', column: 'noche' }, { row: 'vie', column: 'varia' }, { row: 'dom', column: 'no_puedo' }] } };
  const cuantos = (n: number) => ({ fieldCode: 'trn_dias_por_semana', answer: { type: 'NUMBER' as const, number: n, unit: 'días por semana' } });
  assert.deepEqual(validarRespuestasV2(PLANTILLA_ENTRENAMIENTO_V3.sections, solicitud, [tres, cuantos(3)]), []);
  assert.deepEqual(validarRespuestasV2(PLANTILLA_ENTRENAMIENTO_V3.sections, solicitud, [tres, cuantos(4)]).map((p) => p.code), [CODIGO_DE_PROBLEMA_V2.MORE_THAN_MARKED]);
});

test('DL-165 D-6 · cada otra actividad dice qué días (varios) y en qué momento; «Qué días» reemplaza a «Días por semana» (en la parte común, D-9)', () => {
  const otros = campoDeLa(PLANTILLA_ENTRENAMIENTO_V3, 'habitos_deportes');
  assert.ok(otros.dataType === 'LIST' && otros.showIf?.fieldCode === 'habitos_hace_deporte');
  assert.deepEqual(otros.itemFields.map((s) => [s.code, s.dataType, s.required]), [
    ['cual', 'TEXT', true],
    ['que_dias', 'MULTI_CHOICE', true],
    ['momento', 'CHOICE', true],
    ['minutos', 'NUMBER', true],
    ['exigencia', 'CHOICE', true],
  ]);
  const momento = otros.itemFields.find((s) => s.code === 'momento');
  assert.ok(momento?.dataType === 'CHOICE');
  assert.deepEqual(momento.options.map((o) => o.label), ['Temprano', 'Mañana', 'Mediodía', 'Tarde', 'Noche', 'Varía']);
  const cual = otros.itemFields.find((s) => s.code === 'cual');
  assert.equal(cual?.dataType === 'TEXT' ? cual.helpText : null, 'Fútbol, natación, baile…');
  // Lo de formato 3 de la v3: el ejemplo, el renglón con varias opciones, el tope y lo que no viene pedido.
  assert.deepEqual(loQueUsaDelFormato3(PLANTILLA_ENTRENAMIENTO_V3.sections).sort(), [
    'habitos_deportes.cual: el ejemplo del renglón',
    'habitos_deportes.que_dias: varias opciones en el renglón',
    'trn_dias_por_semana: el tope desde la tabla trn_dias_y_horario',
    'trn_embarazo: si viene pedida por defecto',
  ]);
  // Y la de «Cómo comés hoy» v2: la misma lista de la parte común, los ejemplos de las comidas y el embarazo sin pedir.
  assert.deepEqual(loQueUsaDelFormato3(PLANTILLA_NUTRICION_INICIO_V2.sections).sort(), [
    'habitos_deportes.cual: el ejemplo del renglón',
    'habitos_deportes.que_dias: varias opciones en el renglón',
    'nut_comidas_habituales.porcion: el ejemplo del renglón',
    'nut_comidas_habituales.que: el ejemplo del renglón',
    'nut_embarazo: si viene pedida por defecto',
  ]);
});

// ─── WP-FORMULARIOS-RONDA-2, ronda 2.1 (D-15 nueva, 2026-11-06; FR-12) ─────────────────────────────

test('ronda 2.1 · «Tus hábitos» es FRM-HABITOS v2: la misma parte de la ronda 2, sola, sin área propia y de formato 3', () => {
  assert.deepEqual(PLANTILLA_HABITOS_V2.sections, [SECCION_DE_HABITOS]);
  assert.equal(PLANTILLA_HABITOS_V2.dominio, null);
  assert.deepEqual(campos(PLANTILLA_HABITOS_V2).map((c) => c.fieldCode), [...CAMPOS_DE_HABITOS]);
  // Lo del formato 3 que trae: el renglón de la otra actividad (la 0.21 lo lee).
  assert.deepEqual(loQueUsaDelFormato3(PLANTILLA_HABITOS_V2.sections).sort(), ['habitos_deportes.cual: el ejemplo del renglón', 'habitos_deportes.que_dias: varias opciones en el renglón']);
  // Pedida entera, una sola parte; sus obligatorias son las de la parte: 5 en la plantilla, 4 a la vista (la lista del
  // deporte, detrás del «Sí»).
  assert.equal(partesDelFormulario(PLANTILLA_HABITOS_V2.sections, { requestedFieldCodes: [...CAMPOS_DE_HABITOS] }).length, 1);
  assert.equal(campos(PLANTILLA_HABITOS_V2).filter((c) => c.requiredByDefault).length, 5);
  assert.equal(campos(PLANTILLA_HABITOS_V2).filter((c) => c.requiredByDefault && c.showIf === null).length, 4);
  assert.deepEqual(terminosProhibidosDeFormulariosEn(`${PLANTILLA_HABITOS_V2.nombre} ${PLANTILLA_HABITOS_V2.proposito}`), []);
});

test('ronda 2.1 · «Cómo comés hoy» v3 y «Antes de entrenar» v4 son la v2 y la v3 sin la parte «Tus hábitos»: seis partes, y lo demás igual', () => {
  for (const [nueva, anterior] of [[PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_NUTRICION_INICIO_V2], [PLANTILLA_ENTRENAMIENTO_V4, PLANTILLA_ENTRENAMIENTO_V3]] as const) {
    assert.ok(!nueva.sections.some((s) => s.sectionCode === SECCION_DE_HABITOS.sectionCode), `${nueva.clave} v${nueva.version}`);
    assert.deepEqual(nueva.sections.map((s) => s.sectionCode), anterior.sections.map((s) => s.sectionCode).filter((c) => c !== SECCION_DE_HABITOS.sectionCode));
    assert.deepEqual(campos(nueva).map((c) => c.fieldCode), campos(anterior).map((c) => c.fieldCode).filter((c) => !CAMPOS_DE_HABITOS.includes(c)));
    assert.equal(partesDelFormulario(nueva.sections, { requestedFieldCodes: campos(nueva).map((c) => c.fieldCode) }).length, 6, nueva.clave);
    // Ninguna pregunta depende de una que ya no está.
    for (const c of campos(nueva)) if (c.showIf) assert.ok(campos(nueva).some((x) => x.fieldCode === c.showIf!.fieldCode), `${nueva.clave} · ${c.fieldCode}`);
    // Lo que no es de la parte queda igual, campo por campo, salvo la hora de entrenar de Nutrición (D-21).
    for (const c of campos(nueva).filter((x) => x.fieldCode !== 'nut_hora_de_entrenamiento')) assert.deepEqual(c, campoDeLa(anterior, c.fieldCode), `${nueva.clave} · ${c.fieldCode}`);
  }
  // D-21: «¿En qué momento del día solés entrenar?» se abría con el «Sí» de la parte; queda a la vista, opcional, con «No entreno».
  const hora = campoDeLa(PLANTILLA_NUTRICION_INICIO_V3, 'nut_hora_de_entrenamiento');
  assert.ok(hora.dataType === 'CHOICE');
  assert.equal(hora.showIf, null);
  assert.equal(hora.requiredByDefault, false);
  assert.deepEqual(hora.options.map((o) => o.label), ['Temprano a la mañana', 'Media mañana', 'Mediodía', 'Tarde', 'Noche', 'Cambia según el día', 'No entreno']);
  // Las obligatorias: las de la ronda 2 sin las de la parte, que pasan al formulario de hábitos.
  const obligatorias = (p: PlantillaDeInicio) => campos(p).filter((c) => c.requiredByDefault).length;
  assert.deepEqual([obligatorias(PLANTILLA_NUTRICION_INICIO_V3), obligatorias(PLANTILLA_ENTRENAMIENTO_V4)], [19, 18]);
  assert.equal(campos(PLANTILLA_NUTRICION_INICIO_V3).filter((c) => c.requiredByDefault && c.showIf === null).length, 18);
  // Conservan los seis códigos de la v1 de entrenamiento (DL-100) y siguen siendo de formato 3.
  for (const codigo of CONTEXTO_DE_ENTRENAMIENTO.campos) assert.ok(campos(PLANTILLA_ENTRENAMIENTO_V4).some((c) => c.fieldCode === codigo), codigo);
  assert.deepEqual(loQueUsaDelFormato3(PLANTILLA_ENTRENAMIENTO_V4.sections).sort(), ['trn_dias_por_semana: el tope desde la tabla trn_dias_y_horario', 'trn_embarazo: si viene pedida por defecto']);
  assert.deepEqual(loQueUsaDelFormato3(PLANTILLA_NUTRICION_INICIO_V3.sections).sort(), ['nut_comidas_habituales.porcion: el ejemplo del renglón', 'nut_comidas_habituales.que: el ejemplo del renglón', 'nut_embarazo: si viene pedida por defecto']);
});
