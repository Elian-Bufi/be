// Reproduce los dos fallos del guardado local que señaló la revisión del 2026-10-06 (precierre, §1), con el almacén tal
// como estaba en 58567ec, y muestra lo mismo con el almacén corregido. Sin teléfono: un AsyncStorage en memoria que
// rechaza a pedido.
//
// Uso, desde la raíz del repositorio y con @be/domain construido:
//   node EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/precierre/reproducir-guardado.mjs
// Escribe EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/07-reproduccion-del-guardado.json.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { register } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

// El almacén de 58567ec, con sus dependencias de esa versión, en una carpeta temporal dentro del repo (para que resuelva
// @be/domain), que se borra al terminar.
const VIEJO = '58567ecfb377331f72e21eeed9f91d98f7a5837a';
const temporal = fs.mkdtempSync(path.join(RAIZ, 'apps', 'mobile', '.reproduccion-'));
try {
  for (const archivo of ['almacen-de-entrenamiento.ts', 'corrida-de-entrenamiento.ts', 'series-de-la-sesion.ts', 'reloj-de-sesion.ts']) {
    fs.writeFileSync(path.join(temporal, archivo), execFileSync('git', ['show', `${VIEJO}:apps/mobile/src/${archivo}`], { cwd: RAIZ }));
  }
  const viejo = await import(pathToFileURL(path.join(temporal, 'almacen-de-entrenamiento.ts')).href);
  const nuevo = await import(pathToFileURL(path.join(RAIZ, 'apps/mobile/src/almacen-de-entrenamiento.ts')).href);
  const { crearReloj } = await import(pathToFileURL(path.join(RAIZ, 'apps/mobile/src/reloj-de-sesion.ts')).href);
  const { SesionConObjetivosSchema } = await import('@be/domain');

  const SESION = SesionConObjetivosSchema.parse({
    sessionId: 's1',
    label: 'Piernas A',
    order: 1,
    instructions: null,
    prescriptions: [
      {
        prescriptionId: 'pA',
        order: 1,
        exerciseId: 'ej-a',
        exerciseVersionId: 'ev-a',
        exerciseName: 'Sentadilla goblet',
        image: null,
        sets: [{ setIndex: 1, note: null, target: { repetitions: { min: 10, max: 12 }, rir: null, suggestedLoad: null, restSeconds: 90 }, targetOrigin: { rir: 'NONE', suggestedLoad: 'NONE', restSeconds: 'SET' } }],
        intensity: null,
        suggestedLoad: null,
        restSeconds: 90,
        loadBasis: null,
        repetitionBasis: null,
        professionalParameters: [],
        note: null,
      },
    ],
  });
  const API = { consultarBorradorDeEjecucion: async () => null, guardarBorradorDeEjecucion: async () => null, registrarEventosDeTiempo: async () => null, tiemposDelBorrador: async () => null };
  const reloj = crearReloj({ ancla: 'proceso-reproduccion', monotonico: () => 0, civil: () => Date.parse('2026-10-06T16:00:00.000Z') });
  let n = 0;
  const nuevoId = (p) => `${p}-${String(++n).padStart(6, '0')}`;
  const PREPARAR = { draftId: 'borrador-1', occurrenceId: 'occ_1', fecha: '2026-10-06', modo: 'en-vivo', etiqueta: 'Piernas A', sesion: SESION };
  const SERIE = { prescriptionId: 'pA', performedExerciseVersionId: 'ev-a', serie: { setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: 12, rir: 2, perceivedExertion: null } };
  const almacenEnMemoria = (inicial = new Map()) => {
    const datos = new Map(inicial);
    return { datos, fallarLectura: false, fallarEscritura: false, async leer(k) { if (this.fallarLectura) throw new Error('no responde'); return datos.get(k) ?? null; }, async guardar(k, v) { if (this.fallarEscritura) throw new Error('no escribe'); datos.set(k, v); }, async borrar(k) { datos.delete(k); } };
  };
  // El texto de la fila pendiente en 58567ec (sesion-enfocada.tsx, TEXTO_DE_ESTADO): fijo, sin mirar el guardado.
  const textoViejo = execFileSync('git', ['show', `${VIEJO}:apps/mobile/src/pantallas/sesion-enfocada.tsx`], { cwd: RAIZ }).toString().match(/'pendiente-de-enviar': '([^']+)'/)[1];

  const resultados = [];
  // 1. Una escritura que falla.
  for (const [nombre, m] of [['58567ec', viejo], ['corregido', nuevo]]) {
    const almacen = almacenEnMemoria();
    const a = m.crearAlmacenDeEntrenamiento({ almacen, api: API, reloj, nuevoId, esperar: async () => undefined });
    await a.abrirCuenta('cuenta-a', 'token');
    almacen.fallarEscritura = true;
    a.preparar(PREPARAR);
    a.registrarSerie('borrador-1', SERIE);
    await a.escrituras();
    resultados.push({
      caso: 'escritura rechazada',
      version: nombre,
      enElTelefono: almacen.datos.size,
      estadoDelGuardado: typeof a.estadoDelGuardado === 'function' ? a.estadoDelGuardado() : '(no existe: el error se descartaba con .catch(() => undefined))',
      textoDeLaFila: nombre === '58567ec' ? textoViejo : (await import(pathToFileURL(path.join(RAIZ, 'apps/mobile/src/textos-del-guardado.ts')).href)).TEXTOS_DEL_GUARDADO.fila[a.proteccionDeSerie('borrador-1', a.sesion('borrador-1').series[0])],
    });
  }
  // 2. Una lectura que falla con datos previos, y después una escritura.
  for (const [nombre, m] of [['58567ec', viejo], ['corregido', nuevo]]) {
    const previo = almacenEnMemoria();
    const antes = m.crearAlmacenDeEntrenamiento({ almacen: previo, api: API, reloj, nuevoId, esperar: async () => undefined });
    await antes.abrirCuenta('cuenta-a', 'token');
    antes.preparar({ ...PREPARAR, draftId: 'borrador-anterior' });
    antes.registrarSerie('borrador-anterior', SERIE);
    await antes.escrituras();
    const almacen = almacenEnMemoria(previo.datos);
    almacen.fallarLectura = true;
    const a = m.crearAlmacenDeEntrenamiento({ almacen, api: API, reloj, nuevoId, esperar: async () => undefined });
    await a.abrirCuenta('cuenta-a', 'token');
    almacen.fallarLectura = false;
    a.preparar(PREPARAR);
    await a.escrituras();
    const quedo = JSON.parse(almacen.datos.get('be-entrenamiento-en-curso:cuenta-a'));
    resultados.push({
      caso: 'lectura rechazada con datos previos, y después un cambio',
      version: nombre,
      sesionesQueQuedaronEnLaClave: quedo.sesiones.map((s) => s.draftId),
      seConservoLaAnterior: quedo.sesiones.some((s) => s.draftId === 'borrador-anterior') || [...almacen.datos.keys()].some((k) => k.startsWith('be-entrenamiento-recuperacion:')),
      estadoDelGuardado: typeof a.estadoDelGuardado === 'function' ? a.estadoDelGuardado() : '(no existe)',
    });
  }
  const salida = path.join(RAIZ, 'EVIDENCIA/ENTRENAMIENTO-SERIES/resultados/07-reproduccion-del-guardado.json');
  fs.writeFileSync(salida, JSON.stringify({ base: VIEJO, generado: 'reproducir-guardado.mjs', resultados }, null, 2) + '\n');
  console.log(JSON.stringify(resultados, null, 2));
} finally {
  fs.rmSync(temporal, { recursive: true, force: true });
}
void os;
