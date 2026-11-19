/**
 * WP-ENTORNO-DEL-TUTOR (DL-184) · las pruebas del generador de la muestra del tutor y de su verificador.
 *
 * - TEST-TUT-01 · la misma semilla y el mismo día dan la misma huella (REQ-TUT-61).
 * - TEST-TUT-02 · otro «hoy» da la misma forma, corrida en el tiempo (REQ-TUT-63).
 * - TEST-TUT-03 · ponerse al día contiene lo anterior sin cambiarlo (REQ-TUT-62, TUT-D05).
 * - TEST-TUT-04 · el verificador da todo bien con varios orígenes (REQ-TUT-71).
 * - TEST-TUT-05 · el verificador falla con los casos que tienen que fallar: un descanso de 17 minutos, un RIR imposible y
 *   macros que no cierran (REQ-TUT-71).
 * - TEST-TUT-06 · el generador no tiene fechas fijas (REQ-TUT-63) y la lista de los seis con barra es la del dominio.
 * - TEST-TUT-07 · las cuentas son de example.invalid y ningún nombre es de la lista que no va (REQ-TUT-45 y 46).
 *
 * Uso: node --test scripts/entorno-del-tutor.test.mjs (con el dominio compilado: `npm run build:domain`).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { generar, huellaDe, constantes } from './entorno-del-tutor/historia.mjs';
import { verificar } from './entorno-del-tutor/reglas.mjs';
import { verificarMatriz } from './entorno-del-tutor/matriz.mjs';
import { SEIS_CON_BARRA } from './entorno-del-tutor/catalogo.mjs';
import { NOMBRES_QUE_NO_VAN, PERSONAS, DOMINIO_DE_CORREO } from './entorno-del-tutor/personas.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const dominio = createRequire(import.meta.url)(path.join(AQUI, '../packages/domain/dist/index.js'));
const ORIGEN = '2026-11-19';
const h = generar({ origen: ORIGEN });
const fallasDe = (historia, regla) => verificar(historia, { dominio }).resultado.filter((x) => x.regla === regla && x.fallas.length);

test('TEST-TUT-01 · la misma semilla y el mismo día dan la misma huella', () => {
  assert.equal(huellaDe(generar({ origen: ORIGEN })), huellaDe(h));
  assert.notEqual(huellaDe(generar({ origen: '2026-11-20' })), huellaDe(h));
});

test('TEST-TUT-02 · otro día da la misma forma, corrida en el tiempo', () => {
  const otra = generar({ origen: '2027-02-03' });
  for (const p of h.personas) {
    const q = otra.personas.find((x) => x.clave === p.clave);
    assert.equal(q.trn.versiones.length, p.trn.versiones.length, p.nombre);
    assert.equal(q.nut.versiones.length, p.nut.versiones.length, p.nombre);
    assert.equal(q.tomas.length, p.tomas.length, p.nombre);
    assert.equal(constantes.masDias(q.inicio, 0) > p.inicio, true, `${p.nombre} empieza después`);
    assert.ok(Math.abs(q.trn.sesiones.length - p.trn.sesiones.length) <= Math.max(3, p.trn.sesiones.length * 0.06), `${p.nombre}: sesiones ${p.trn.sesiones.length} y ${q.trn.sesiones.length}`);
  }
});

test('TEST-TUT-03 · ponerse al día contiene lo anterior sin cambiarlo', () => {
  const despues = generar({ origen: ORIGEN, hoy: constantes.masDias(ORIGEN, 10) });
  let nuevas = 0;
  for (const p of h.personas) {
    const q = despues.personas.find((x) => x.clave === p.clave);
    for (const lista of ['sesiones', 'comidas']) {
      const a = lista === 'sesiones' ? p.trn.sesiones : p.nut.comidas;
      const b = new Map((lista === 'sesiones' ? q.trn.sesiones : q.nut.comidas).map((x) => [x.clave, JSON.stringify(x)]));
      for (const x of a) assert.equal(b.get(x.clave), JSON.stringify(x), `${p.nombre}: ${x.clave} cambió`);
      nuevas += b.size - a.length;
    }
    assert.deepEqual(JSON.stringify(q.tomas), JSON.stringify(p.tomas), `${p.nombre}: las tomas no cambian`);
    assert.deepEqual(JSON.stringify(q.revisiones), JSON.stringify(p.revisiones), `${p.nombre}: las revisiones no cambian`);
  }
  assert.ok(nuevas > 100, `ponerse al día agrega registros (${nuevas})`);
  assert.ok(verificar(despues, { dominio }).ok, 'la historia puesta al día sigue cumpliendo');
});

test('TEST-TUT-04 · el verificador da todo bien con varios orígenes', () => {
  for (const origen of [ORIGEN, '2026-12-24', '2027-03-02', '2027-07-20']) {
    const x = generar({ origen });
    const v = verificar(x, { dominio });
    const fallas = v.resultado.filter((r) => r.fallas.length).map((r) => `${r.regla} ${r.persona}: ${r.fallas[0]}`);
    assert.deepEqual(fallas, [], `origen ${origen}`);
    const m = verificarMatriz(x);
    assert.deepEqual(m.celdas.filter((c) => !c.ok).map((c) => `${c.id} ${c.persona}`), [], `matriz, origen ${origen}`);
  }
});

test('TEST-TUT-05 · el verificador falla con un descanso de 17 minutos, un RIR imposible y macros que no cierran', () => {
  const descanso = structuredClone(h);
  const s = descanso.personas[0].trn.sesiones.find((x) => x.tiempos);
  s.tiempos.descansos[0].segundos = 17 * 60;
  assert.ok(fallasDe(descanso, 'R-TRN-07').length, 'el descanso de 17 minutos');

  const rir = structuredClone(h);
  const sesion = rir.personas[0].trn.sesiones.filter((x) => x.granularidad === 'SERIE' && x.ejercicios.some((e) => e.ejercicio === SEIS_CON_BARRA[0])).at(-1);
  const serie = sesion.ejercicios.find((e) => e.ejercicio === SEIS_CON_BARRA[0]).sets.find((x) => x.setKind !== 'WARM_UP');
  serie.rir = 9;
  assert.ok(fallasDe(rir, 'R-TRN-04').length, 'el RIR imposible para la carga');

  const macros = structuredClone(h);
  macros.personas.find((p) => p.clave === 'valeria').nut.versiones[0].macros.c += 60;
  assert.ok(fallasDe(macros, 'R-NUT-01').length, 'los macros que no cierran');

  const carne = structuredClone(h);
  carne.personas.find((p) => p.clave === 'carolina').nut.versiones[0].plan[0].comidas[1].opciones[0].items.push(['pollo', 120]);
  assert.ok(fallasDe(carne, 'R-NUT-06').length, 'el pollo en el plan de Carolina');

  const texto = structuredClone(h);
  texto.personas[0].notas.push({ clave: 'x', texto: 'Excelente cumplimiento del asesorado.', fecha: ORIGEN });
  assert.ok(fallasDe(texto, 'R-TXT-01').length, 'el vocabulario prohibido');
});

test('TEST-TUT-06 · sin fechas fijas en el generador, y los seis con barra son los del dominio', () => {
  for (const archivo of ['historia.mjs', 'personas.mjs', 'herramientas.mjs', 'textos.mjs', 'reglas.mjs', 'matriz.mjs', 'cargar.mjs']) {
    const texto = fs.readFileSync(path.join(AQUI, 'entorno-del-tutor', archivo), 'utf8');
    assert.deepEqual(texto.match(/\b20\d\d-\d\d-\d\d\b/g) ?? [], [], archivo);
  }
  assert.deepEqual([...SEIS_CON_BARRA].sort(), dominio.EJERCICIOS_DE_LA_ESTIMACION_V1.map((e) => e.nombre).sort());
});

test('TEST-TUT-07 · las cuentas son de example.invalid y ningún nombre es de la lista que no va', () => {
  assert.equal(DOMINIO_DE_CORREO, 'example.invalid');
  const nombres = PERSONAS.map((p) => p.nombre);
  for (const n of nombres) assert.ok(!NOMBRES_QUE_NO_VAN.some((x) => x.split(' ')[0] === n.split(' ')[0] && x.split(' ')[1]?.[0] === n.split(' ')[1]?.[0]), n);
  assert.equal(new Set(nombres).size, nombres.length);
  assert.equal(PERSONAS.filter((p) => !p.liviana).length, 5);
  assert.equal(PERSONAS.filter((p) => p.liviana).length, 10);
  assert.ok(fallasDe(h, 'R-PRV-01').length === 0);
});
