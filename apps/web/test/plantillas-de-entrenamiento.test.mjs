/**
 * WP-PLANTILLAS-DE-ENTRENAMIENTO (DL-182) · el website: crear y editar una plantilla de entrenamiento sin persona, con el
 * mismo editor del plan. Lo puro se prueba con datos; de las pantallas se lee la fuente, como en el resto del editor.
 * Cada punto tiene al menos una mutación verificada en rojo (la lista, en el documento del paquete).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const Q = await import('../src/app/pro/advisees/training/lo-que-se-edita.ts');
const M = await import('../src/app/pro/advisees/es-lo-que-mande.ts');
const fuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = fuente('../src/app/pro/advisees/training/editor.tsx');
const EDICION = fuente('../src/app/pro/advisees/training/edicion-de-plantilla.tsx');
const PAGINA = fuente('../src/app/pro/templates/training/editor-de-la-plantilla.tsx');
const COLECCION = fuente('../src/app/pro/templates/mis-plantillas.tsx');
const DETALLE = fuente('../src/app/pro/templates/detalle-de-la-plantilla.tsx');
const ORIGEN = fuente('../src/app/pro/advisees/training/plantillas.tsx');
const EJERCICIO = fuente('../src/app/pro/advisees/training/ejercicio-del-editor.tsx');
const CATALOGO = fuente('../src/app/pro/advisees/training/agregar-ejercicio.tsx');
const CONTEXTO = fuente('../src/app/pro/advisees/training/entrenamiento.tsx');
const P = d.COPY_PREPARACION_DE_PLANTILLA;

/** Una preparación como la da API-TPL-09. */
function preparacion(extra = {}) {
  return {
    draftId: 'd1',
    templateId: null,
    baseVersionId: null,
    baseVersionNumber: null,
    version: 'v3',
    name: 'Fuerza 3 días',
    description: null,
    templateState: null,
    copySuggestedLoads: false,
    sessionCount: 1,
    createdAt: '2026-11-19T10:00:00.000Z',
    updatedAt: '2026-11-19T10:05:00.000Z',
    structure: { blocks: [{ blockId: 'b1', label: 'Fase 1', purpose: null, microcycles: [], sessions: [{ sessionId: 's1', label: 'A', instructions: null, prescriptions: [{ prescriptionId: 'p1', exerciseVersionId: 'ev1', sets: [{ repetitions: { value: 8 }, note: null }], intensity: null, suggestedLoad: null, professionalParameters: [], note: null }] }] }] },
    exercises: { ev1: { exerciseId: 'e1', exerciseName: 'Sentadilla', available: true, image: null } },
    ...extra,
  };
}

// ─── PLT-D01 · la frontera: el editor recibe qué edita ───────────────────────────────────────────────────────────

test('PLT-D01 · lo guardado es el plan de una persona o la preparación de una plantilla, y se distinguen sin adivinar', () => {
  const g = Q.guardadoDeLaPlantilla(preparacion());
  assert.equal(Q.esDelPlan(g), false);
  assert.equal(g.version, 'v3');
  assert.equal(Q.comoPlan(g), null);
  // Un plan (API-SER-01) no tiene `tipo`: es del plan.
  const plan = { planId: 'x', version: 'v2', state: 'DRAFT', activatedAt: null };
  assert.equal(Q.esDelPlan(plan), true);
  assert.equal(Q.comoPlan(plan), plan);
  assert.equal(Q.comoPlan(null), null);
  // Lo que el editor edita: la estructura (una copia) y, por versión de ejercicio, el nombre, la imagen y el ejercicio.
  const p = preparacion();
  const bloques = Q.bloquesDeLaPreparacion(p);
  assert.deepEqual(bloques, p.structure.blocks);
  assert.notEqual(bloques, p.structure.blocks, 'una copia: editar no toca lo leído');
  assert.deepEqual(Q.delCatalogoDeLaPreparacion(p), { nombres: { ev1: 'Sentadilla' }, imagenes: { ev1: null }, ejercicios: { ev1: 'e1' } });
  assert.deepEqual(Q.metadatosDe(preparacion({ description: 'Inicial', copySuggestedLoads: true })), { nombre: 'Fuerza 3 días', descripcion: 'Inicial', conCargas: true });
});

test('PLT-D01 · el mismo editor: con una plantilla guarda, revisa, guarda como plantilla y descarta con sus operaciones', () => {
  assert.match(EDITOR, /if \(version && !esDelPlan\(version\)\) return guardarLaPreparacion\(automatico, version\);/);
  assert.match(EDITOR, /if \(!esDelPlan\(v\)\) return revisarLaPreparacion\(v\);/);
  assert.match(EDITOR, /if \(plantilla\) return descartarLaPreparacion\(\);/);
  assert.match(EDITOR, /const p = await api\.consultarPreparacionDePlantilla\(token, preparacionId\);/);
  assert.match(EDITOR, /api\.guardarPreparacionDePlantilla\(token, base\.preparacion\.draftId, \{\n\s*expectedVersion: base\.version,/);
  assert.match(EDITOR, /api\.publicarPreparacionDePlantilla\(token, p\.draftId, version\.version, intentoDeGuardarLaPlantilla\.actual\(/);
  assert.match(EDITOR, /api\.descartarPreparacionDePlantilla\(token, p\.draftId, version\.version, intentoDeDescartar\.actual\(\)\)/);
  // No es una copia del editor: hay un solo componente, y la plantilla lo usa con `plantilla`.
  assert.match(EDITOR, /export function EditorDePlantilla\(\{ plantilla \}: \{ readonly plantilla: EdicionDePlantilla \}\) \{\n\s*return <EditorDePlan /);
  assert.match(PAGINA, /<EditorDePlantilla key=\{preparacionId\} plantilla=\{plantilla\} \/>/);
  assert.equal((EDITOR.match(/export function EditorDe/g) ?? []).length, 2);
});

// ─── PLT-D12 · lo que depende de la persona no está ──────────────────────────────────────────────────────────────

test('PLT-D12 · sin persona: ni días, ni asistente, ni «Otras áreas», ni activar, ni lo que retiene su app', () => {
  assert.match(EDITOR, /const chipsDeDias = \(s: SesionE, n: number\) => \{\n[^\n]*\n\s*if \(plantilla\) return null;/);
  assert.match(EDITOR, /const diasDelPresetDe = \(s: SesionE\) => \{\n\s*if \(plantilla\) return null;/);
  assert.match(EDITOR, /\{plantilla \? \(\n\s*<p className="nota estacion__fechas" data-sin-dias-en-la-plantilla>/);
  assert.match(EDITOR, /const pasoDelAsistente = plantilla \? null : pasoPedido\(parametros\.get\('asistente'\)\);/);
  assert.match(EDITOR, /\{pestana === 'otras' && asesoradoId !== null \? \(/);
  assert.match(EDITOR, /\{plantilla \? null : \(\n\s*<div\n\s*className="estacion__pestanas"/);
  assert.match(EDITOR, /if \(!esDelPlan\(version\)\) return \{ bloqueadoPorLaApp: false, calentamientoBloqueado: false \};/);
  // Los cuadros del plan no se abren en una plantilla: cada uno tiene el suyo.
  assert.match(EDITOR, /\{esDelPlan\(version\) \? \(\n\s*<AntesDeActivar\n/);
  assert.match(EDITOR, /\) : \(\n\s*<AntesDeGuardarLaPlantilla\n/);
  assert.match(EDITOR, /\) : \(\n\s*<DescartarLaPreparacion\n/);
  // La fuerza estimada, «La vez pasada» y lo hecho en el buscador son de la persona: sin ella, no se piden.
  assert.match(EDITOR, /exerciseId=\{asesoradoId === null \? null : \(ejercicios\[p\.exerciseVersionId\] \?\? null\)\}/);
  assert.match(EJERCICIO, /\{conFuerza && asesoradoId !== null \? \(/);
  assert.match(EJERCICIO, /\{conLaVezPasada && exerciseId && asesoradoId !== null \? \(/);
  assert.match(CATALOGO, /if \(asesoradoId === null\) \{\n\s*setHistorial\(\{ tipo: 'sin-persona' \}\);\n\s*return;\n\s*\}/);
  // El contexto sin persona lo da la página de la plantilla; la pestaña de la persona, el de siempre.
  assert.match(CONTEXTO, /const c = sinPersona \?\? conPersona;/);
  assert.match(PAGINA, /\{ token, asesoradoId: null, sesionPerdida, accesoRetirado, parametros, ir \}/);
  // El contexto de la persona (DL-179) vive en el marco del área: la página de la plantilla no lo tiene.
  assert.doesNotMatch(PAGINA, /MarcoDelArea|PanelDeContexto|OtrasAreas/);
});

// ─── PLT-D05 y D-2 de DL-108 · la cabecera de la plantilla ────────────────────────────────────────────────────────

test('PLT-D05 · el nombre y la descripción se escriben en una nueva; en una existente, se cambian en «Mis plantillas»', () => {
  assert.match(EDICION, /\{nueva \? \(\n\s*<>\n\s*<Campo\n\s*id="nombre-de-la-plantilla"/);
  assert.match(EDICION, /<p className="nota">\{P\.nombreEnMisPlantillas\}<\/p>/);
  // Lo que viaja: el nombre y la descripción solo en una nueva; el interruptor de las cargas, siempre.
  assert.match(EDITOR, /\.\.\.\(nueva \? \{ name: m\.nombre\.trim\(\), description: m\.descripcion\.trim\(\) \|\| null \} : \{\}\),\n\s*copySuggestedLoads: m\.conCargas,/);
  // El nombre que falta lleva a su campo.
  assert.match(EDITOR, /if \(plantilla && p\.path === 'name'\) return setParaEnfocar\('nombre-de-la-plantilla'\);/);
  assert.equal(P.cambiosSobre(2), 'Cambios sobre la versión 2');
  assert.equal(P.laVersionSigue(2), 'La versión 2 sigue disponible y sin cambios hasta que guardes una nueva.');
});

test('D-2 de DL-108 · las cargas: el interruptor apagado por omisión y lo escrito que no va, dicho antes de guardar', () => {
  assert.equal(P.cargasEscritasNoVan(1), 'Un ejercicio tiene una carga sugerida escrita: con esto apagado, no va a la plantilla.');
  assert.equal(P.cargasEscritasNoVan(3), '3 ejercicios tienen una carga sugerida escrita: con esto apagado, no va a la plantilla.');
  assert.match(EDICION, /<input type="checkbox" checked=\{metadatos\.conCargas\}/);
  assert.match(EDITOR, /const bloquesQueIrian = metadatos\.conCargas \? bloques : sinCargasSugeridas\(\{ blocks: bloques \}\)\.blocks;/);
  assert.match(EDITOR, /cargas=\{cargasEscritas > 0 \? \(metadatos\.conCargas \? PLT\.cargasVan\(cargasEscritas\) : PLT\.cargasEscritasNoVan\(cargasEscritas\)\) : null\}/);
});

// ─── ED-61 en la plantilla ───────────────────────────────────────────────────────────────────────────────────────

test('ED-61 · ante un 409 se compara lo mandado con sus metadatos; la huella de un plan no cambia', () => {
  const m = { nombre: 'A', descripcion: '', conCargas: false };
  const bloques = preparacion().structure.blocks;
  const nueva = Q.cuerpoDeLaPreparacion(bloques, true, m);
  assert.equal(M.cualMande(nueva, [Q.cuerpoDeLaPreparacion(bloques, true, { ...m, nombre: 'B' })]), -1, 'otro nombre es otro guardado');
  assert.equal(M.cualMande(nueva, [Q.cuerpoDeLaPreparacion(bloques, true, { ...m, nombre: ' A ' })]), 0, 'los espacios no cambian lo guardado');
  assert.equal(M.cualMande(nueva, [Q.cuerpoDeLaPreparacion(bloques, true, { ...m, conCargas: true })]), -1, 'el interruptor es parte de lo guardado');
  // En una existente el nombre no viaja: no se compara.
  assert.equal(M.cualMande(Q.cuerpoDeLaPreparacion(bloques, false, m), [Q.cuerpoDeLaPreparacion(bloques, false, { ...m, nombre: 'otro' })]), 0);
  // Un plan no lleva metadatos: su huella es la de siempre.
  const plan = { estructura: bloques, proximaRevision: null, agenda: null, objetivo: 'o1' };
  assert.doesNotMatch(M.huellaDelGuardado(plan), /metadatos/);
  assert.match(EDITOR, /const cual = p \? cualMande\(cuerpoDeLaPreparacion\(p\.structure\.blocks, nueva, metadatosDe\(p\)\), mandados\) : -1;/);
  assert.match(EDITOR, /if \(motivo === 'SIN_RESPUESTA'\) sinRespuesta\.current = \[\.\.\.sinRespuesta\.current, cuerpo\];\n\s*autoguardado\.informar\(motivo, ediciones\.current !== edicionesAlEnviar\);\n\s*if \(motivo === 'DEMASIADO_GRANDE'\) \{\n\s*setProblemas\(null\);\n\s*setMensaje\(\{ tipo: 'error', texto: COPY_GUARDADO\.demasiadoGrande, sinFoco: automatico \}\);/);
});

// ─── PLT-D08 a D10 · «Antes de guardar» ──────────────────────────────────────────────────────────────────────────

test('PLT-D08 · «Guardar plantilla» espera la revisión, lo guardado y que nada lo impida; dice qué falta', () => {
  const base = { conflicto: false, revisando: false, sinGuardar: false, impiden: 0, sinRevisar: false };
  assert.equal(Q.motivoParaNoGuardar(base), null);
  assert.equal(Q.motivoParaNoGuardar({ ...base, revisando: true }), 'Revisando lo preparado…');
  assert.equal(Q.motivoParaNoGuardar({ ...base, sinGuardar: true, impiden: 2 }), 'Falta: guardar los cambios, corregir 2 cosas.');
  assert.equal(Q.motivoParaNoGuardar({ ...base, sinRevisar: true }), 'Falta: revisar de nuevo.');
  assert.equal(Q.motivoParaNoGuardar({ ...base, conflicto: true, impiden: 1 }), 'Falta: cargar lo guardado.');
  // Nueva: «Guardar plantilla»; existente: «Guardar nueva versión», con la consecuencia dicha.
  assert.match(EDICION, /textoConfirmar=\{nueva \? P\.guardarPlantilla : P\.guardarNuevaVersion\}/);
  assert.equal(P.consecuenciaVersion(2), 'Se guarda como la versión siguiente. La versión 2 no cambia, y los planes que ya creaste desde esta plantilla tampoco: la nueva se ofrece para los próximos.');
  // Lo de la persona no se revisa acá, y lo dice.
  assert.match(P.sinPersona, /se revisa en su plan, antes de activarlo/);
});

test('PLT-D09 y PLT-D10 · lo que impide guardar, dicho de la plantilla; lo incompleto queda para completar al usarla', () => {
  for (const codigo of ['TEMPLATE_NAME_REQUIRED', 'TEMPLATE_NAME_TAKEN', 'TEMPLATE_SESSION_REQUIRED', 'TEMPLATE_ARCHIVED', 'TEMPLATE_UNCHANGED']) {
    assert.equal(typeof Q.textoDelProblemaDeLaPlantilla(codigo), 'string', codigo);
    assert.match(EDITOR, /\.\.\.PLT\.problema,/);
  }
  assert.equal(Q.textoDelProblemaDeLaPlantilla('PRESCRIPTION_REQUIRED'), null);
  assert.match(EDITOR, /\.\.\.\(paraCompletar && paraCompletar\.version === version\.version \? paraCompletar\.problemas\.map/);
  assert.match(EDICION, /<h3 id="antes-de-guardar-completar">/);
  // Lo que cambia frente a la versión de la que partió, con la regla de siempre (la de «Antes de activar»).
  assert.match(EDITOR, /compararEntrenamiento\(baseDeLaPlantilla\.bloques, bloquesQueIrian, \{/);
  assert.match(EDITOR, /r\.ok && r\.datos\.data\.versionId === versionDeBase/);
});

// ─── La colección y el detalle ────────────────────────────────────────────────────────────────────────────────────

test('La colección: «Nueva plantilla» sin pedir nada antes, lo que está en preparación y «Editar» o «Retomar los cambios»', () => {
  assert.match(COLECCION, /data-nueva-plantilla disabled=\{abrirElEditor\.abriendo\} onClick=\{\(\) => void abrirElEditor\.nueva\(\)\}/);
  assert.match(COLECCION, /api\.crearPreparacionDePlantilla\(token, fromTemplateVersionId \? \{ fromTemplateVersionId \} : \{\}, intento\.actual\(/);
  assert.match(COLECCION, /api\.abrirPreparacionDePlantilla\(token, templateId\)/);
  assert.match(COLECCION, /const nuevas = preparaciones\.lista\.filter\(\(x\) => x\.templateId === null\);/);
  assert.match(COLECCION, /\{x\.name\.trim\(\) \|\| PLT\.sinTitulo\}/);
  // Una archivada se copia, pero no se edita (la API dice 422).
  assert.match(COLECCION, /\) : plantilla\.state === 'ACTIVE' \? \(\n\s*<button[^\n]*data-editar-la-plantilla>/);
  // Abrir el editor pasa por la guardia de salida, como cualquier navegación.
  assert.match(COLECCION, /antesDeSalir\(\(\) => router\.push\(hrefDelEditor\(r\.datos\.data\.draftId\)\)\);/);
  // Al volver, la plantilla guardada queda abierta y se dice qué se guardó.
  assert.match(COLECCION, /useState<string \| null>\(pedida\)/);
  assert.match(PAGINA, /dejarAvisoPara\(COLECCION, primera \? P\.guardadaPrimera : P\.guardadaVersion\(p\.versionNumber\)\);/);
  assert.equal(P.cambiosEnPreparacion(2), 'Versión 2 disponible · cambios en preparación');
});

test('El detalle: agrupado por fase, sesión y bloque, «Sin indicar» para lo no indicado, y las versiones con sus planes', () => {
  assert.match(DETALLE, /const partes = partesParaLeer\(\{ prescriptions: conOrden, exerciseGroups: s\.exerciseGroups \?\? \[\] \}\);/);
  assert.match(DETALLE, /data-bloque-de-la-plantilla/);
  assert.match(DETALLE, /const resumen = p\.sets\.length === 0 \? P\.sinIndicar : ejercicioPlegadoDelEditor\(p, 0\)\.resumen;/);
  assert.doesNotMatch(DETALLE, /Sin objetivo/);
  assert.match(DETALLE, /api\.versionesDePlantillaDeEntrenamiento\(token, templateId\)/);
  assert.match(DETALLE, /\{P\.planesCreados\(v\.plansCreated\)\}/);
  assert.deepEqual([0, 1, 4].map(P.planesCreados), ['todavía no se usó con nadie', 'se usó en 1 plan', 'se usó en 4 planes']);
  assert.match(COLECCION, /<EstructuraAgrupada estructura=\{p\.structure\} ejercicios=\{p\.exercises\} \/>/);
});

// ─── Aplicar con la versión correcta ─────────────────────────────────────────────────────────────────────────────

test('El plan dice el número de la versión que se aplicó, no el de la vigente', () => {
  // Antes: `r.datos.data.versionId === origen.templateVersionId ? r.datos.data.versionNumber : r.datos.data.versionNumber`.
  assert.doesNotMatch(ORIGEN, /\? r\.datos\.data\.versionNumber : r\.datos\.data\.versionNumber/);
  assert.match(ORIGEN, /const aplicada = v\.ok \? v\.datos\.data\.find\(\(x\) => x\.versionId === origen\.templateVersionId\) : undefined;/);
  assert.match(ORIGEN, /aplicada \? COPY_PLANTILLAS\.creadaDesde\(r\.datos\.data\.name, aplicada\.versionNumber\) : COPY_PREPARACION_DE_PLANTILLA\.creadaDesdeSinNumero/);
  assert.equal(d.COPY_PLANTILLAS.creadaDesde('Fuerza', 1), 'Creada desde la plantilla «Fuerza», versión 1. El plan es de esta persona: la plantilla no cambia si lo editás.');
  // «Empezar desde una plantilla» dice qué versión se aplica.
  assert.match(fuente('../src/app/pro/advisees/training/plan.tsx'), /detalle: `\$\{COPY_PREPARACION_DE_PLANTILLA\.version\(p\.versionNumber\)\} · /);
});

// ─── El idioma ────────────────────────────────────────────────────────────────────────────────────────────────────

test('Los textos de la plantilla ubican y no califican: sin «asesorado», sin «estación» y sin el vocabulario que B05 excluye', () => {
  const llamar = (f) => [2, 1, 'Fuerza', ['guardar los cambios']].flatMap((x) => {
    try {
      const t = f(x);
      return typeof t === 'string' ? [t] : [];
    } catch {
      return [];
    }
  });
  const textos = Object.values(P).flatMap((v) => (typeof v === 'string' ? [v] : typeof v === 'function' ? llamar(v) : Object.values(v)));
  assert.ok(textos.length > 60);
  for (const t of textos) assert.doesNotMatch(t, /asesorad|estaci[oó]n|cumplimiento|adherencia|racha|puntaje/i, t);
  const revision = fuente('../src/app/pro/advisees/training/revision-del-plan.tsx').match(/COPY_REVISION_DE_LA_PLANTILLA = \{[\s\S]*?\} as const;/)?.[0] ?? '';
  assert.ok(revision.length > 0);
  assert.doesNotMatch(revision, /activar/, 'la revisión de la plantilla no habla de activar');
});
