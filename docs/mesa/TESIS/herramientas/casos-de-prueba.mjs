// Une, por caso de prueba, el diseño (DV-05: 59 casos del plan 11A, con precondiciones, pasos, datos sintéticos y oráculo),
// la conciliación de octubre (qué prueba lo ejercita y qué afirma) y el mapeo del 2026-10-16 (26 casos reclasificados).
// Además comprueba que cada prueba citada exista en el repositorio con su título: así el «resultado observado» en la
// versión de referencia sale de la CI de esa versión y no se supone. Uso: node casos-de-prueba.mjs → datos/casos-de-prueba.json
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const dv05 = join(raiz, 'docs/mesa/MESA_02/DV-05');

function csv(texto) {
  const filas = [];
  let fila = [];
  let campo = '';
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') comillas = false;
      else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === ',') {
      fila.push(campo);
      campo = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else campo += ch;
  }
  if (campo || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }
  const [cab, ...resto] = filas.filter((f) => f.some((x) => x.trim()));
  return resto.map((f) => Object.fromEntries(cab.map((c, k) => [c.replace(/^﻿/, '').trim(), (f[k] ?? '').trim()])));
}

const diseno = csv(readFileSync(join(dv05, 'DV-05_CASOS_DE_PRUEBA.csv'), 'utf8'));
const conciliacion = new Map(csv(readFileSync(join(dv05, 'MATRIZ_DE_RECONCILIACION_DV-05_2026-10.csv'), 'utf8')).map((f) => [f.caso, f]));
const mapeo = new Map();
for (const l of readFileSync(join(dv05, 'MAPEO_DE_LOS_26_CASOS_2026-10-16.md'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\| (TEST-[A-Z]+-[A-Z0-9-]+) \| ([A-Z_]+) \| (.*?) \| (.*?) \|$/);
  if (m) mapeo.set(m[1], { clase: m[2], detalle: m[3], nota: m[4] });
}

// Pruebas del repositorio, para comprobar las citas.
function recorrer(dir, acc = []) {
  const abs = join(raiz, dir);
  if (!existsSync(abs)) return acc;
  for (const n of readdirSync(abs)) {
    if (['node_modules', 'dist', '.git'].includes(n)) continue;
    const p = join(abs, n);
    if (statSync(p).isDirectory()) recorrer(relative(raiz, p), acc);
    else if (/\.(spec|test|int-spec)\.(ts|tsx|mjs|cjs|js)$/.test(n) || n === 'recorridos.mjs') acc.push(relative(raiz, p).replace(/\\/g, '/'));
  }
  return acc;
}
const archivos = ['test', 'apps', 'packages', 'scripts'].flatMap((d) => recorrer(d));
const porNombre = new Map();
for (const a of archivos) porNombre.set(a.split('/').pop(), a);
const contenido = new Map(archivos.map((a) => [a, readFileSync(join(raiz, a), 'utf8')]));
const normalizar = (s) => s.normalize('NFC').replace(/\s+/g, ' ').trim();

// Títulos que cambiaron después de la conciliación, comprobados a mano en 0fb1bff (archivo, título citado → título vigente).
const RENOMBRADAS = [
  ['historial-navegacion.test.mjs', 'la barra tiene las cinco zonas', 'la barra tiene los cinco destinos, en orden, con su texto y su raíz'],
];

/**
 * ¿Sigue la prueba citada en el repositorio? Se compara por fragmentos: la cita puede abreviar con «…», tener comillas
 * anidadas o nombrar una variante de una prueba parametrizada («PDP — V5 …» sale de la tabla `variantes`).
 * Devuelve 'vigente', 'titulo-actualizado' (la prueba con ese identificador sigue, con otro título) o 'no-hallada'.
 */
function vigencia(ruta, titulo) {
  const cuerpo = normalizar(contenido.get(ruta));
  const fragmentos = titulo
    .split(/…|\.\.\./)
    .map((f) => f.replace(/^[\s·:—-]+|[\s·:—-]+$/g, ''))
    .filter((f) => f.length >= 6);
  const sinPrefijo = (f) => f.replace(/^PDP — /, '');
  if (fragmentos.length && fragmentos.every((f) => cuerpo.includes(f) || cuerpo.includes(sinPrefijo(f)))) return 'vigente';
  const nombre = ruta.split('/').pop();
  const ren = RENOMBRADAS.find(([a, viejo]) => a === nombre && titulo.startsWith(viejo));
  if (ren && cuerpo.includes(ren[2])) return 'titulo-actualizado';
  const idCaso = titulo.match(/^(TEST-[A-Z]+-[A-Z0-9-]+)/)?.[1];
  if (idCaso && new RegExp(`(?:it|test)\\(\\s*['\`"]${idCaso}\\b`).test(contenido.get(ruta))) return 'titulo-actualizado';
  return 'no-hallada';
}

/** Citas «archivo › título» o `archivo:línea «título»` de un texto, comprobadas contra el repositorio. */
function citas(texto) {
  const res = [];
  // El título termina en «» seguido de fin, separador o cita siguiente; así se respetan las comillas anidadas.
  const re = /`([\w.-]+\.(?:int-spec|spec|test)\.(?:ts|tsx|mjs|cjs))(?::(\d+))?`\s*(?:›\s*)?(?:«((?:[^«»]|«[^«»]*»)+)»)?/g;
  let m;
  while ((m = re.exec(texto))) {
    const ruta = porNombre.get(m[1]) ?? null;
    const titulo = m[3] ? normalizar(m[3]) : null;
    let vigente = null;
    let situacion = 'archivo-no-hallado';
    if (ruta && titulo) {
      situacion = vigencia(ruta, titulo);
      vigente = situacion !== 'no-hallada';
    } else if (ruta) {
      vigente = true;
      situacion = 'archivo-vigente';
    }
    res.push({ archivo: m[1], ruta, linea: m[2] ? Number(m[2]) : null, titulo, vigente, situacion });
  }
  return res;
}

// Lo que cambió después de la conciliación (2026-10-02) o del mapeo (2026-10-16), comprobado en el código y las pruebas de
// 0fb1bff el 2026-10-20. No reescribe esos documentos (están firmados por su fecha): agrega una capa con su fuente.
const ACTUALIZACIONES = {
  'TEST-AUTH-003': {
    clase: 'cubierto',
    nota: 'Lo pendiente se escribió con DL-115 (opción A, 2026-10-02): a3-del-titular.int-spec.ts prueba la variante del titular (A3 nunca otorgado: 403) y que lo de otro titular sigue dando el mismo 404 (PE-01 de la conciliación).',
    pruebas: ['`a3-del-titular.int-spec.ts` › «A3 nunca otorgado: 403 (TEST-AUTH-003, variante del titular); lo de otro titular sigue siendo el mismo 404»'],
  },
  'TEST-AUTH-004': {
    clase: 'cubierto',
    nota: 'El hallazgo H-1 se corrigió con DL-115 (opción A): la evolución antropométrica propia, el detalle de los formularios y «Tu plan de hoy» exigen el A3 vigente, y a3-del-titular.int-spec.ts lo prueba con la misma sesión.',
    pruebas: [
      '`a3-del-titular.int-spec.ts` › «revocado el A3: 403 por /me y por la ruta del profesional con el propio id; el profesional, 404; con un A3 nuevo vuelve idéntica»',
      '`a3-del-titular.int-spec.ts` › «revocado el A3: detalle, responder y corregir dan 403 sin escribir nada; la lista sigue sin respuestas; lo ajeno y lo inexistente, 404»',
    ],
  },
  'TEST-ANT-001': {
    clase: 'cubierto',
    nota: 'La prueba de TEST-RF-047, agregada el 2026-10-16, lee la evaluación (API-ANT-04) con las mediciones directas y el resultado derivado aparte, con su método y sus entradas: era lo pendiente (PE-14).',
    pruebas: ['`antropometria.int-spec.ts` › «TEST-RF-047 · M1 y M2 quedan directas y el derivado aparte, en la historia»'],
  },
  'TEST-DOM-008': {
    clase: 'parcial',
    nota: 'La línea de tiempo (API-DSH-04) relee una comida registrada tarde: ocurrencia de hace tres días, distinta del registro, marcada como tardía. Falta hacerlo por la lectura de la ingesta, como pide el caso (PE-03).',
    pendiente: 'Registrar una ingesta con ocurrencia anterior (por ejemplo, ayer a las 13:00) y releerla por la lectura de ingestas: occurredAt igual a lo enviado, recordedAt del momento del registro y la fecha local de la ocurrencia (PE-03).',
    pruebas: ['`analisis.int-spec.ts` › «una entrada por hecho, con ocurrió y registrado independientes, y la carga tardía dicha»'],
  },
  'TEST-RF-054': {
    clase: 'parcial',
    nota: 'Corrección de la conciliación y del mapeo, que dicen que no hay línea temporal entre dominios: está en main desde el 2026-10-16 (API-DSH-04, DL-127, escritorio profesional). Sus pruebas verifican fecha de ocurrencia y de registro, dominio, autor, relación con el plan ejecutado y que un alcance denegado no aporte nada; ninguna nombra el caso ni la prueba con dos alcances permitidos.',
    pendiente: 'Una prueba que nombre el caso y afirme, con dos alcances permitidos, el dominio, el autor y la procedencia de cada entrada, y que lo planificado no se mezcle con lo ejecutado.',
    pruebas: [
      '`analisis.int-spec.ts` › «una entrada por hecho, con ocurrió y registrado independientes, y la carga tardía dicha»',
      '`dashboard.int-spec.ts` › «con dos alcances y uno solo consentido: el denegado no aporta ni un conteo»',
    ],
  },
  'TEST-RF-059': {
    clase: 'parcial',
    nota: 'El acceso con Google está integrado desde el 2026-10-17 (DL-138) y tiene su variante de caída probada (503 con el acceso local disponible; con las claves ya leídas se sigue entrando). Los avisos por Expo Push existen desde el 2026-10-16 (DL-133), pero falta probar que con Expo caído el centro de novedades sigue. El mapa (RF-051) sigue pendiente.',
    pendiente: 'Probar que con Expo Push caído el centro de novedades sigue, y afirmar el respaldo manual de wger (`details.fallback`) con el núcleo andando en la misma prueba (PE-11). La variante de mapas no es ejecutable: el descubrimiento con mapa (RF-051) no está implementado.',
    pruebas: [
      '`acceso-google.int-spec.ts` › «sin GOOGLE_CLIENT_IDS, las tres operaciones responden 503 DEPENDENCY_UNAVAILABLE con el acceso local a mano»',
      '`acceso-google.int-spec.ts` › «con Google caído antes de leer sus claves: 503; con las claves ya leídas, se sigue entrando aunque Google no responda»',
    ],
  },
  'TEST-RF-042': {
    clase: 'parcial',
    nota: 'La nota de modelo de la conciliación (BE no asignaba sesiones a días, DL-077) quedó superada el 2026-10-16: la agenda de entrenamiento (DL-137) ubica cada sesión del plan en días de la semana y distingue lo pendiente y lo salteado. Este caso no se volvió a conciliar con la agenda.',
    pendiente: 'Conciliar el caso con la agenda (DL-137): un día sin sesión, uno con la sesión planificada sin registro y uno con la ejecución registrada, en la misma semana. La pantalla en el teléfono se verifica con capturas, no con una prueba automática de interfaz.',
  },
};

// Notas de lectura de esta tesis: dicen qué hace exactamente la prueba citada cuando no coincide con los datos de DV-05.
// Se comprobaron en el código de la versión de referencia.
const NOTAS = {
  'TEST-CAL-001': 'La prueba citada de la parte 2 no usa MET-DEMO: crea su propio método (`MET-SUCESION`), con la v1 de tres decimales y la v2 de uno (`test/integration/calculos.int-spec.ts`). MET-DEMO es el de la parte 1.',
  'TEST-ANT-004': 'La prueba citada corrige un peso (72,5 kg a 71,2 kg y después a 71 kg) en lugar del perímetro de 92 cm de DV-05 (`test/integration/antropometria.int-spec.ts`); afirma el mismo comportamiento.',
};

// DV-05 no declara requisito ni caso de uso en los 34 casos de escenario (familias AUTH, DOM, CAL, FRM y ANT). Esta tesis
// los deriva de la fuente que cita cada caso (08, 06, 09) y de los requisitos y casos de uso que la contienen; en la ficha
// se marcan como derivados.
const DERIVADOS = {
  'TEST-AUTH-001': [['RF-002'], ['UC-P26']],
  'TEST-AUTH-002': [['RF-001', 'RF-020'], ['UC-P25']],
  'TEST-AUTH-003': [['RF-021'], ['UC-I02']],
  'TEST-AUTH-004': [['RF-022'], ['UC-P08']],
  'TEST-AUTH-005': [['RF-021', 'RF-022'], ['UC-I02']],
  'TEST-AUTH-006': [['RF-020', 'RF-021'], ['UC-I02']],
  'TEST-AUTH-007': [['RF-024'], ['UC-P06']],
  'TEST-AUTH-008': [['RF-024'], ['UC-P06']],
  'TEST-AUTH-009': [['RF-021'], ['UC-I02']],
  'TEST-AUTH-010': [['RF-021'], ['UC-I02']],
  'TEST-AUTH-011': [['RF-069'], ['UC-P27']],
  'TEST-AUTH-012': [['RF-069'], ['UC-P27']],
  'TEST-AUTH-013': [['RF-069', 'RF-024'], ['UC-P27']],
  'TEST-DOM-001': [['RF-034', 'RF-045'], ['UC-P13', 'UC-P18']],
  'TEST-DOM-002': [['RF-044', 'RF-050'], ['UC-I12']],
  'TEST-DOM-003': [['RF-050'], ['UC-I12']],
  'TEST-DOM-004': [['RF-047'], ['UC-P19']],
  'TEST-DOM-005': [['RF-048'], ['UC-I09']],
  'TEST-DOM-006': [['RF-048', 'RF-070'], ['UC-I13']],
  'TEST-DOM-007': [['RF-037', 'RF-040'], ['UC-P15']],
  'TEST-DOM-008': [['RF-033', 'RF-043'], ['UC-P12', 'UC-P17']],
  'TEST-DOM-009': [['RF-031', 'RF-041'], ['UC-I04']],
  'TEST-CAL-001': [['RF-048', 'RF-070'], ['UC-I09']],
  'TEST-CAL-002': [['RF-070'], ['UC-I13']],
  'TEST-CAL-003': [['RF-048', 'RF-060'], ['UC-I09']],
  'TEST-CAL-004': [['RF-048'], ['UC-I09']],
  'TEST-FRM-001': [['RF-071'], ['UC-P32']],
  'TEST-FRM-002': [['RF-071', 'RF-021'], ['UC-P32']],
  'TEST-FRM-003': [['RF-071'], ['UC-P33']],
  'TEST-FRM-004': [['RF-071', 'RF-017'], ['UC-P33', 'UC-P25']],
  'TEST-ANT-001': [['RF-047', 'RF-048'], ['UC-P19']],
  'TEST-ANT-002': [['RF-047', 'RF-049'], ['UC-P19', 'UC-P20']],
  'TEST-ANT-003': [['RF-047'], ['UC-P19']],
  'TEST-ANT-004': [['RF-050'], ['UC-I12']],
};

const titulosRf = new Map(JSON.parse(readFileSync(join(aqui, '../datos/evidencia-rf.json'), 'utf8')).requisitos.map((r) => [r.id, r.titulo]));
const lista = (s) => (s && s !== '—' ? s.split(/[\s,;]+/).filter((x) => /^(RF|UC)-/.test(x)) : []);
// Los pasos de DV-05 vienen numerados en un solo renglón («1. … 2. …»). Se corta solo en el número que sigue, para que
// un «0.» dentro de un paso (TEST-RF-001: «…asociadas al email: 0.») no se tome como el comienzo de otro.
const pasosEnLista = (s) => {
  let resto = s.trim();
  if (!/^1\.\s+/.test(resto)) return [resto];
  resto = resto.replace(/^1\.\s+/, '');
  const pasos = [];
  for (let n = 2; ; n++) {
    const m = resto.match(new RegExp(String.raw`(?:^|\s)${n}\.\s+`));
    if (!m) break;
    pasos.push(resto.slice(0, m.index).trim());
    resto = resto.slice(m.index + m[0].length);
  }
  pasos.push(resto.trim());
  return pasos.filter(Boolean);
};

const casos = diseno.map((d) => {
  const c = conciliacion.get(d.ID) ?? {};
  const mp = mapeo.get(d.ID) ?? null;
  const act = ACTUALIZACIONES[d.ID] ?? null;
  // Clase de ejecución: el mapeo del 16/10 manda sobre la conciliación anterior para los 26 casos que reclasificó, y la
  // actualización del 20/10, sobre los dos.
  let clase;
  if (mp) clase = { NO_IMPLEMENTADO: 'no-ejecutable', AGREGADO: 'cubierto', CUBIERTO: 'cubierto', PARCIAL: 'parcial' }[mp.clase] ?? 'parcial';
  else if (/^Cubierto/i.test(c.categoria ?? '')) clase = 'cubierto';
  else if (/^(Parcial|En parte)/i.test(c.categoria ?? '')) clase = 'parcial';
  else clase = 'no-ejecutable';
  const claseAnterior = clase;
  if (act) clase = act.clase;
  const textoEvidencia = [c.prueba_o_evidencia ?? '', mp?.detalle ?? '', ...(act?.pruebas ?? [])].join(' ');
  // Una cita que es el comienzo de otra del mismo archivo (la conciliación y el mapeo citan la misma prueba con títulos
  // de distinto largo) se cuenta una sola vez, con el título completo.
  const evidencia = citas(textoEvidencia).filter(
    (e, _, todas) => !e.titulo || !todas.some((o) => o !== e && o.archivo === e.archivo && o.titulo && o.titulo !== e.titulo && o.titulo.startsWith(e.titulo.replace(/…$/, ''))),
  );
  const declaradoRf = lista(d.RF);
  const declaradoUc = lista(d.UC);
  const derivado = !declaradoRf.length && DERIVADOS[d.ID] ? DERIVADOS[d.ID] : null;
  const rfs = derivado ? derivado[0] : declaradoRf;
  const ucs = derivado ? derivado[1] : declaradoUc;
  const esEscenario = !/^— \(TEST-RF/.test(d['Escenario 11A']);
  const objetivo = esEscenario
    ? `Comprobar el escenario «${d['Escenario 11A']}».`
    : `Comprobar el criterio de aceptación de ${rfs[0]} («${titulosRf.get(rfs[0]) ?? '—'}»).`;
  return {
    id: d.ID,
    rf: d.RF,
    uc: d.UC,
    rfs,
    ucs,
    relacionDerivada: Boolean(derivado),
    objetivo,
    pasosLista: pasosEnLista(d.Pasos),
    canal: d.Canal,
    prioridad: d.Prioridad,
    nivel: d.Nivel,
    escenario: d['Escenario 11A'],
    precondiciones: d.Precondiciones,
    pasos: d.Pasos,
    datos: d['Datos de prueba (sintéticos)'],
    esperado: d['Resultado esperado (oráculo)'],
    fuente: d['Fuente propietaria'],
    observado: mp?.clase === 'NO_IMPLEMENTADO' ? mp.detalle.replace(/`/g, '') : (c.que_verifica_la_asercion ?? '').replace(/`/g, '') || (mp?.detalle ?? '').replace(/`/g, ''),
    pendiente: act?.pendiente ?? (act?.clase === 'cubierto' ? '' : (c.pendiente ?? '').replace(/`/g, '')),
    pendienteOriginal: act?.pendiente || act?.clase === 'cubierto' ? (c.pendiente ?? mp?.nota ?? '').replace(/`/g, '') : null,
    clase,
    claseOrigen: mp ? `mapeo 2026-10-16: ${mp.clase}` : `conciliación 2026-10: ${c.categoria ?? '—'}`,
    claseAnterior,
    actualizacion: act?.nota ?? null,
    // De dónde sale lo «Observado»: cuando hay una actualización, la ficha lo muestra como cita de su documento.
    observadoFuente: mp?.clase === 'NO_IMPLEMENTADO' || !c.que_verifica_la_asercion ? 'el mapeo del 2026-10-16' : 'la conciliación del 2026-10-02',
    notaDeLectura: NOTAS[d.ID] ?? null,
    resultadoConciliacion: c.resultado ?? null,
    evidencia,
    citasVigentes: evidencia.filter((e) => e.vigente).length,
    citasNoHalladas: evidencia.filter((e) => e.vigente === false || !e.ruta).map((e) => `${e.archivo}${e.titulo ? ` «${e.titulo.slice(0, 50)}»` : ''}`),
  };
});

writeFileSync(join(aqui, '../datos/casos-de-prueba.json'), JSON.stringify({ fuentes: ['DV-05_CASOS_DE_PRUEBA.csv', 'MATRIZ_DE_RECONCILIACION_DV-05_2026-10.csv', 'MAPEO_DE_LOS_26_CASOS_2026-10-16.md'], generado: new Date().toISOString(), casos }, null, 1));
const cuenta = (k) => casos.filter((c) => c.clase === k).length;
console.log(`casos: ${casos.length} · cubiertos ${cuenta('cubierto')} · parciales ${cuenta('parcial')} · no ejecutables ${cuenta('no-ejecutable')}`);
console.log(`citas: ${casos.reduce((s, c) => s + c.evidencia.length, 0)} · vigentes ${casos.reduce((s, c) => s + c.citasVigentes, 0)} · no halladas ${casos.reduce((s, c) => s + c.citasNoHalladas.length, 0)}`);
for (const c of casos) if (c.citasNoHalladas.length) console.log(`  ${c.id}: ${c.citasNoHalladas.join(' | ')}`);
