/**
 * WP-APP-VUELTA-DE-ROSCA (DL-166): las partes solo de app, con sus oráculos TEST-AVR
 * (`docs/paquetes/WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`). Lógica pura de la APK, sin teléfono: la regla de los
 * desplegables, la barra con Perfil y dónde quedó cada cosa, Perfil y su marca, «Quién ve qué», Inicio, el desglose de
 * «Tu historial», los íconos nuevos y la sesión (el descanso automático, sus ajustes, el aviso del 100 %, la fila fija y
 * «Empezar serie N»).
 *
 * **Lo que esto no prueba:** el dibujo, TalkBack, la vibración con la pantalla bloqueada ni la letra al máximo en un
 * teléfono. Eso queda para la candidata (AV-16).
 * Uso: node --test scripts/vuelta-de-rosca.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Los módulos de la APK se importan entre sí sin extensión, como los resuelve Metro: Node necesita que se la agreguen.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MOVIL = join(RAIZ, 'apps/mobile/src');
const leer = (archivo) => readFileSync(join(MOVIL, archivo), 'utf8');
/** Todos los archivos de la APK, con App.tsx. */
function archivosDeLaApk() {
  const lista = [join(RAIZ, 'apps/mobile/App.tsx')];
  const recorrer = (dir) => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (/\.tsx?$/.test(nombre) && !/\.test\.ts$/.test(nombre)) lista.push(ruta);
    }
  };
  recorrer(MOVIL);
  return lista;
}

const desplegable = await import('../apps/mobile/src/desplegable.ts');

// ─── TEST-AVR-001 · la regla de los desplegables (AV-01) ────────────────────────────────────────

test('TEST-AVR-001 · el desplegable es un botón con su estado y un nombre que dice qué guarda', () => {
  assert.deepEqual(desplegable.accesibilidadDelDesplegable(false, '6 ejercicios · 18 series'), {
    accessibilityRole: 'button',
    accessibilityState: { expanded: false },
    accessibilityLabel: '6 ejercicios · 18 series',
  });
  assert.equal(desplegable.accesibilidadDelDesplegable(true, 'Qué incluye').accessibilityState.expanded, true);
  assert.deepEqual(desplegable.accesibilidadDelDesplegable(true, 'Peso', true).accessibilityState, { expanded: true, selected: true });
});

test('TEST-AVR-001 · el estado, la fecha, quién y si se puede responder nunca se pliegan', () => {
  assert.deepEqual([...desplegable.LO_QUE_NUNCA_SE_PLIEGA].sort(), ['estado', 'fecha', 'quien', 'si-se-puede-responder']);
  for (const c of ['estado', 'fecha', 'quien', 'si-se-puede-responder']) assert.equal(desplegable.sePuedePlegar(c), false, c);
  for (const c of ['para-que', 'que-incluye', 'detalle', 'preparacion', 'cantidades', 'como-funciona']) assert.equal(desplegable.sePuedePlegar(c), true, c);
  assert.deepEqual(desplegable.problemasDelPliegue({ nombre: 'mal', visible: [], plegado: ['para-que', 'fecha'] }), ['fecha']);
});

test('TEST-AVR-001 · un solo desplegable en la APK: nadie declara «expanded» por su cuenta, y la pieza no escribe', () => {
  for (const archivo of archivosDeLaApk()) {
    if (archivo.endsWith('desplegable.ts')) continue;
    assert.doesNotMatch(readFileSync(archivo, 'utf8'), /expanded\s*:/, `${archivo} declara su propio desplegable`);
  }
  const ui = leer('ui.tsx');
  const pieza = ui.slice(ui.indexOf('export function Desplegable('), ui.indexOf('function Chevron('));
  assert.match(pieza, /accesibilidadDelDesplegable\(abierto/);
  assert.doesNotMatch(pieza, /api\.|almacen|AsyncStorage|SecureStore/, 'abrir un desplegable no escribe nada');
  assert.match(ui, /export function Ayuda[\s\S]*?<Desplegable titulo=\{titulo\} variante="ayuda"/, 'la ayuda es una variante de la misma pieza');
});

// ─── TEST-AVR-014 · registrar una comida y responder un formulario (AV-08) ──────────────────────

test('TEST-AVR-014 · «Comí esta opción» queda a la vista; ingredientes, preparación y «Para qué lo pide», plegados', () => {
  const opcion = leer('pantallas/opcion-de-comida.tsx');
  assert.match(opcion, /<Desplegable titulo=\{COPY_REGISTRO_DE_COMIDAS\.ingredientes\}/);
  assert.match(opcion, /<Desplegable titulo=\{COPY_REGISTRO_DE_COMIDAS\.preparacion\}/);
  // El botón de registrar está fuera de todo desplegable: después del último cierre de un desplegable del detalle.
  const detalle = opcion.slice(opcion.indexOf('function DetalleDeLaOpcion'), opcion.indexOf('function FilaDeIngrediente'));
  assert.doesNotMatch(detalle, /comiEstaOpcion/);
  const solicitud = leer('pantallas/formularios.tsx');
  const cabeza = solicitud.slice(solicitud.indexOf('<Titulo>{request.templateName}</Titulo>'), solicitud.indexOf('{/* DL-165 D-1 y D-3'));
  assert.match(cabeza, /\{COPY_FORMULARIOS\.pedidoPor\} \{request\.professional\.displayName\}\s*<\/Parrafo>/, 'quién lo pide, a la vista');
  assert.match(cabeza, /<Desplegable titulo=\{TEXTOS_DE_LA_VUELTA\.paraQueLoPide\}[\s\S]*request\.purpose[\s\S]*podesNoResponder[\s\S]*<\/Desplegable>/);
  // «Queda como declarado por vos» se sigue diciendo una vez, al empezar, fuera de lo plegado (DL-165 D-2).
  assert.match(solicitud, /\{alEmpezar \? <Parrafo tenue>\{COPY_FORMULARIOS\.loQueRespondesEsTuyo\}<\/Parrafo> : null\}/);
  assert.doesNotMatch(cabeza, /loQueRespondesEsTuyo/);
});

// ─── TEST-AVR-002 y 003 · la barra con Perfil y dónde quedó cada cosa (AV-02, AV-03) ─────────────

const nav = await import('../apps/mobile/src/navegacion.ts');
const barra = await import('../apps/mobile/src/disposicion-de-la-barra.ts');
const perfil = await import('../apps/mobile/src/perfil.ts');

test('TEST-AVR-002 · Perfil es el quinto destino; lo de la persona resalta Perfil y Atrás vuelve como antes', () => {
  assert.deepEqual(nav.ZONAS.map((z) => z.zona), ['inicio', 'nutricion', 'entrenamiento', 'evolucion', 'perfil']);
  assert.deepEqual(nav.ZONAS[4], { zona: 'perfil', texto: 'Perfil', ruta: { nombre: 'perfil' } });
  for (const ruta of [{ nombre: 'cuenta', seccion: 'datos' }, { nombre: 'cuenta', seccion: 'avisos' }, { nombre: 'quien-ve-que' }, { nombre: 'vinculos' }, { nombre: 'privacidad' }, { nombre: 'mis-habitos' }, { nombre: 'mis-solicitudes' }]) {
    const desdePerfil = nav.navegar({ nombre: 'perfil' }, ruta);
    assert.equal(nav.pestanaActiva(desdePerfil), 'perfil', ruta.nombre);
    assert.deepEqual(nav.anterior(desdePerfil), { nombre: 'perfil' }, `Atrás desde ${ruta.nombre}`);
    // Sin origen, también vuelve a Perfil.
    assert.deepEqual(nav.anterior(ruta), { nombre: 'perfil' }, `${ruta.nombre} sin origen`);
  }
  assert.equal(nav.textoDeVolverA({ nombre: 'cuenta', seccion: 'cierre' }), 'Volver a Cerrar mi cuenta');
  // El ícono de persona, que pasa del avatar a la barra.
  assert.match(leer('barra-de-zonas.tsx'), /perfil: 'persona'/);
});

test('TEST-AVR-002 · con letra ×1 la barra va en una fila sin achicar; con ×1,3, en dos filas enteras', () => {
  const zonas = nav.ZONAS.map((z) => z.zona);
  const una = barra.disposicionDeLaBarra({ anchoDePantalla: 360, escalaDeLetra: 1, zonas });
  assert.equal(una.filas.length, 1);
  assert.equal(una.escalaEfectiva, 1);
  const dos = barra.disposicionDeLaBarra({ anchoDePantalla: 360, escalaDeLetra: 1.3, zonas });
  assert.deepEqual(dos.filas, [['inicio', 'nutricion', 'entrenamiento'], ['evolucion', 'perfil']]);
  assert.equal(dos.escalaEfectiva, 1.3, 'cambia la composición, no la letra');
});

test('TEST-AVR-002 · la cabecera tiene la marca y Novedades, sin menú ni avatar, con la franja del ambiente', () => {
  const cabecera = leer('cabecera.tsx');
  assert.doesNotMatch(cabecera, /Abrir el menú|accessibilityLabel="Cuenta"|menu-de-la-app/);
  assert.match(cabecera, /Ambiente de prueba · solo datos sintéticos/);
  assert.match(cabecera, /Novedades, \$\{sinLeer\} sin leer/);
});

test('TEST-AVR-003 · ninguna entrada del menú, de Cuenta ni de «Información» se pierde ni queda en dos lugares', () => {
  const tabla = perfil.DONDE_QUEDO_CADA_COSA;
  const que = tabla.map((m) => m.que);
  assert.equal(new Set(que).size, que.length, 'cada cosa, una sola vez');
  for (const esperada of ['Vínculos', 'Tu historial de entrenamiento', 'Registros nutricionales']) assert.ok(que.includes(esperada), `el menú: ${esperada}`);
  for (const esperada of ['Notas entre tus profesionales', 'Tengo un código', 'Estado de la cuenta', 'Tu nombre', 'Tu identificador BE', 'Privacidad y consentimientos', 'Apariencia', 'Avisos en este teléfono', 'Seguridad (cerrar sesión)', 'Cerrar mi cuenta']) {
    assert.ok(que.includes(esperada), `Cuenta: ${esperada}`);
  }
  for (const esperada of ['Información que me pidieron (la bandeja)', 'Mis hábitos']) assert.ok(que.includes(esperada), `Información: ${esperada}`);
  for (const m of tabla) assert.ok(leer(m.archivo).includes(m.abre), `«${m.que}»: ${m.archivo} no tiene ${m.abre}`);
  assert.throws(() => leer('menu-auxiliar.tsx'), /ENOENT/, 'el menú auxiliar ya no existe');
});

// ─── TEST-AVR-004 a 006 · Perfil y su marca (AV-03, AV-04) ──────────────────────────────────────

const solicitud = (id, status, extra = {}) => ({ formRequestId: id, status, templateName: `Formulario ${id}`, professional: { identityId: 'p1', displayName: 'Lic. Sofía Paz' }, createdAt: '2026-11-01T12:00:00Z', pendingProposal: null, respondable: true, ...extra });
const pedido = (id, profesional) => ({ accessRequestId: id, version: 'v1', professional: { identityId: profesional, displayName: `Prof. ${profesional}` }, scope: { code: 'ENTRENAMIENTO', label: 'Entrenamiento' }, requestedAt: '2026-11-02T12:00:00Z' });
const habitosCon = (profesionales) => ({ sharing: { status: 'ACTIVE', version: 'v', activeSince: '2026-10-01T00:00:00Z', withdrawnAt: null, acceptedTextVersionId: 't' }, professionals: profesionales });
const profesionalDeHabitos = (id, sharing, link = 'ACTIVE') => ({ professional: { identityId: id, displayName: `Prof. ${id}` }, scopes: [{ code: 'ENTRENAMIENTO', label: 'Entrenamiento' }], link, sharing, sharedSince: sharing === 'RECEIVES' ? '2026-10-01T00:00:00Z' : null });

test('TEST-AVR-004 · Perfil: quién sos, tu información, tus profesionales, formularios y ajustes, con Cerrar mi cuenta al final', () => {
  assert.deepEqual(perfil.BLOQUES_DE_PERFIL, ['quien-sos', 'tu-informacion', 'tus-profesionales', 'formularios-y-pedidos', 'ajustes']);
  assert.deepEqual(perfil.AJUSTES_DE_PERFIL, ['apariencia', 'avisos', 'privacidad', 'sesion', 'cerrar-mi-cuenta']);
  assert.deepEqual(perfil.nombreEnPerfil('Diego Sosa'), { texto: 'Diego Sosa', agregar: false });
  assert.deepEqual(perfil.nombreEnPerfil(null), { texto: 'Agregá tu nombre', agregar: true });
  assert.equal(perfil.nombreEnPerfil(undefined), null, 'mientras se lee, nada');
  assert.deepEqual(
    perfil.baldosasDePerfil({ habitos: { cargados: true, losReciben: 2 } }).map((b) => [b.titulo, b.detalle]),
    [
      ['Mis datos', 'Nombre, estado de la cuenta e identificador'],
      ['Mis hábitos', 'Los ven 2 profesionales'],
      ['Quién ve qué', 'Por profesional y por área'],
      ['Notas entre tus profesionales', 'Lo que se escriben sobre vos'],
    ],
  );
  const filas = perfil.paraResponder([solicitud('f1', 'PENDING')], habitosCon([]), [pedido('h1', 'martin')]);
  assert.deepEqual(perfil.filasDeFormularios({ paraResponder: filas, respondidos: 4 }), [
    { que: 'para-responder', titulo: 'Para responder', detalle: '1 formulario y 1 pedido de hábitos', cuenta: 2 },
    { que: 'respondidos', titulo: 'Respondidos', detalle: null, cuenta: 4 },
  ]);
  // La vuelta después de reautenticarse va al ajuste que se estaba usando.
  assert.deepEqual(nav.alIniciarSesion({ nombre: 'login', alEntrar: 'cuenta' }), { nombre: 'cuenta', seccion: 'cierre' });
  // «Podés no responder» se dice una vez, adentro: no en Perfil.
  assert.doesNotMatch(leer('pantallas/perfil.tsx') + leer('perfil.ts'), /podesNoResponder|Podés no responder/);
});

test('TEST-AVR-005 · «Para responder» cuenta formularios pendientes y pedidos de hábitos; la marca es un punto sin número', () => {
  const propuesta = { professional: { identityId: 'p1', displayName: 'X' }, loadedAt: '2026-11-01T00:00:00Z' };
  const formularios = [solicitud('f1', 'PENDING'), solicitud('f2', 'PENDING', { pendingProposal: propuesta }), solicitud('f3', 'RESPONDED')];
  const filas = perfil.paraResponder(formularios, habitosCon([profesionalDeHabitos('nuevo', 'NOT_ASKED')]), [pedido('h1', 'martin')]);
  assert.deepEqual(
    filas.map((f) => `${f.tipo}:${f.id}`),
    ['formulario:f1', 'formulario:f2', 'pedido-de-habitos:h1'],
    'el respondido no cuenta; con un pedido, no se pregunta por el nuevo',
  );
  assert.deepEqual(perfil.marcaDePerfil(filas), { visible: true, paraLeer: 'hay algo para responder' });
  // Sin pedidos, el profesional nuevo cuenta (como la tarjeta de Inicio de DL-165 D-17).
  assert.deepEqual(perfil.paraResponder([], habitosCon([profesionalDeHabitos('nuevo', 'NOT_ASKED')]), []).map((f) => f.tipo), ['profesional-nuevo']);
});

test('TEST-AVR-006 · la marca se va al responder o al negarse, no por abrir Perfil; Inicio y Perfil cuentan igual', () => {
  const lectura = () => perfil.paraResponder([solicitud('f1', 'PENDING')], habitosCon([]), [pedido('h1', 'martin')]);
  assert.equal(perfil.marcaDePerfil(lectura()).visible, true);
  // Abrir Perfil no cambia lo que se lee: la misma lectura da la misma marca.
  assert.equal(perfil.marcaDePerfil(lectura()).visible, true);
  // Responder el formulario y decir «No, por ahora» al pedido: la API ya no los lista.
  const despues = perfil.paraResponder([solicitud('f1', 'RESPONDED')], habitosCon([profesionalDeHabitos('martin', 'DOES_NOT_RECEIVE')]), []);
  assert.deepEqual(perfil.marcaDePerfil(despues), { visible: false, paraLeer: null });
  // Inicio y Perfil usan la misma función, y la barra la misma regla.
  assert.match(leer('pantallas/inicio-informacion.tsx'), /paraResponder\(p\.pendientes, habitos\.r\.datos\.data, pedidos\.r\.datos\.data\)/);
  assert.match(leer('pantallas/perfil.tsx'), /paraResponder\(/);
  assert.match(leer('marca-de-perfil.ts'), /marcaDePerfil\(filas\)\.visible/);
  assert.match(leer('barra-de-zonas.tsx'), /TEXTOS_DE_LA_VUELTA\.hayAlgoParaResponder/);
});

const marca = await import('../apps/mobile/src/marca-de-perfil.ts');
test('TEST-AVR-006 · el almacén de la marca avisa solo cuando cambia y se olvida al cerrar la sesión', () => {
  const m = marca.crearAlmacenDeLaMarca();
  let avisos = 0;
  m.suscribir(() => avisos++);
  assert.equal(m.visible(), false, 'sin lectura, sin marca');
  m.fijar(perfil.paraResponder([solicitud('f1', 'PENDING')], null, null));
  m.fijar(perfil.paraResponder([solicitud('f1', 'PENDING')], null, null));
  assert.deepEqual([m.visible(), avisos], [true, 1]);
  m.olvidar();
  assert.deepEqual([m.visible(), avisos], [false, 2]);
  assert.match(readFileSync(join(RAIZ, 'apps/mobile/App.tsx'), 'utf8'), /marcaEnPerfil\.olvidar\(\);/, 'cerrar la sesión la olvida');
});

// ─── TEST-AVR-007 a 009 · «Quién ve qué» (AV-05) ────────────────────────────────────────────────

const qvq = await import('../apps/mobile/src/quien-ve-que.ts');
const AREAS = { NUTRICION: ['Nutrición', 'ACOMPANAMIENTO_NUTRICIONAL'], ENTRENAMIENTO: ['Entrenamiento', 'PLANIFICACION_DEL_ENTRENAMIENTO'], ANTROPOMETRIA: ['Antropometría', 'EVALUACION_ANTROPOMETRICA'] };
const vinculo = (id, profesional, area, relationshipState, consentState) => ({
  relationshipId: id,
  version: 'v',
  professional: { identityId: profesional, displayName: `Prof. ${profesional}` },
  advisee: { identityId: 'yo', displayName: 'Diego' },
  scope: { code: area, label: AREAS[area][0] },
  purpose: AREAS[area][1],
  relationshipState,
  consentState,
  accessMode: 'FULL',
  pausedBy: null,
  acceptedAt: '2024-03-01T12:00:00Z',
});
const consentimiento = (relationshipId) => ({ consentId: `c-${relationshipId}`, relationshipId, state: 'ACTIVE', acceptedAt: '2024-03-02T12:00:00Z', revokedAt: null });
const a3 = (estado) => ({ currentConsent: estado ? { consentId: 'a', state: estado, consentVersionId: 'v', acceptedAt: '2024-01-01T00:00:00Z', revokedAt: null } : null });
const LECTURAS = {
  vinculos: [vinculo('v1', 'sofia', 'NUTRICION', 'ACEPTADO', 'ACTIVE'), vinculo('v2', 'martin', 'ENTRENAMIENTO', 'PAUSADO', 'ACTIVE'), vinculo('v3', 'lucia', 'ANTROPOMETRIA', 'FINALIZADO', 'ACTIVE')],
  consentimientos: [consentimiento('v1'), consentimiento('v2'), consentimiento('v3')],
  habitos: habitosCon([profesionalDeHabitos('sofia', 'RECEIVES'), profesionalDeHabitos('martin', 'DOES_NOT_RECEIVE', 'PAUSED')]),
  pedidos: [pedido('h1', 'martin')],
};
const diaDePrueba = (iso) => iso.slice(0, 10);

test('TEST-AVR-007 · con A3, una tarjeta por profesional: lo que autorizaste y desde cuándo, y si ve tus hábitos', () => {
  const v = qvq.quienVeQue({ a3: a3('ACTIVE'), ...LECTURAS }, diaDePrueba);
  assert.equal(v.a3.otorgado, true);
  const sofia = v.tarjetas.find((t) => t.nombre === 'Prof. sofia');
  assert.deepEqual(sofia.areas.map((a) => [a.linea, a.ve]), [['Nutrición · desde el 2024-03-02', true]]);
  assert.equal(sofia.habitos, 'Los ve');
  assert.equal(qvq.habitosParaLeer('No los ve'), 'Tus hábitos: no los ve');
  // «Qué incluye» sale del Alcance: su finalidad y su área.
  assert.match(sofia.areas[0].queIncluye[0], /^Para: .+\.$/);
  assert.equal(sofia.areas[0].queIncluye[1], 'Dentro del área: Nutrición.');
});

test('TEST-AVR-008 · en pausa, terminado o sin A3: dice que no ve, y por qué', () => {
  const v = qvq.quienVeQue({ a3: a3('ACTIVE'), ...LECTURAS }, diaDePrueba);
  const martin = v.tarjetas.find((t) => t.nombre === 'Prof. martin');
  assert.deepEqual(martin.areas.map((a) => a.ve), [false]);
  assert.match(martin.areas[0].linea, /en pausa: mientras tanto, no ve tus datos/);
  assert.equal(martin.habitos, 'Te pidió verlos · No los ve');
  const lucia = v.tarjetas.find((t) => t.nombre === 'Prof. lucia');
  assert.match(lucia.areas[0].linea, /terminó: ya no ve tus datos/);
  assert.equal(v.tarjetas[0].nombre, 'Prof. sofia', 'primero quien ve algo');
  const sinA3 = qvq.quienVeQue({ a3: a3(null), ...LECTURAS }, diaDePrueba);
  assert.equal(sinA3.a3.otorgado, false);
  assert.match(sinA3.a3.texto, /ningún profesional ve tus datos de salud/);
  assert.ok(sinA3.tarjetas.every((t) => t.areas.every((a) => !a.ve)), 'sin A3, nadie ve');
});

test('TEST-AVR-009 · «Quién ve qué» solo lee, y no dice nada que prohíba 10-B04', () => {
  const pantalla = leer('pantallas/quien-ve-que.tsx');
  const llamadas = [...pantalla.matchAll(/api\.([a-zA-Z0-9]+)\(/g)].map((m) => m[1]).sort();
  assert.deepEqual(llamadas, ['consultarConsentimientos', 'consultarRequisitoA3', 'consultarVinculos', 'misHabitos', 'pedidosDeAccesoAMisHabitos']);
  // Lo que se muestra, sin los comentarios (que citan la regla de 10-B04).
  const textos = (leer('textos-de-la-vuelta.ts') + leer('quien-ve-que.ts') + pantalla).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(textos, /todos tus datos|toda tu información|puede ver todo/i);
  for (const v of [qvq.PLIEGUE_DE_QUIEN_VE_QUE, perfil.PLIEGUE_DE_PERFIL]) assert.deepEqual(desplegable.problemasDelPliegue(v), [], v.nombre);
});

// ─── TEST-AVR-010 a 013 · Inicio y «Tu historial» (AV-06, AV-07) ────────────────────────────────

const inicio = await import('../apps/mobile/src/inicio-de-hoy.ts');
const DIA = {
  meals: [
    { mealId: 'cena', label: 'Cena', order: 4, options: [{}, {}] },
    { mealId: 'desayuno', label: 'Desayuno', order: 1, options: [{}] },
    { mealId: 'almuerzo', label: 'Almuerzo', order: 2, options: [{}, {}, {}] },
    { mealId: 'merienda', label: 'Merienda', order: 3, options: [{}, {}, {}] },
  ],
};
const ingesta = (mealId, occurredAt, origin = 'PRESCRIBED') => ({ origin, mealId, occurredAt, executionId: `e-${mealId ?? 'fuera'}` });
const horaDePrueba = (iso) => iso.slice(11, 16);

test('TEST-AVR-010 · «la que sigue» es la primera sin registrar en el orden del plan, nunca por la hora', () => {
  const c = inicio.comidasDeHoy(DIA, [ingesta('desayuno', '2026-11-07T08:40:00Z')], horaDePrueba);
  assert.deepEqual(c.fichas.map((f) => [f.nombre, f.estado]), [['Desayuno', 'registrada'], ['Almuerzo', 'la-que-sigue'], ['Merienda', 'sin-registrar'], ['Cena', 'sin-registrar']]);
  assert.equal(c.fichas[0].paraLeer, 'Desayuno, registrado a las 08:40');
  assert.equal(c.fichas[1].paraLeer, 'Almuerzo, registrar');
  // La cena registrada antes que el almuerzo, y un registro fuera del plan: sigue el almuerzo.
  const fueraDeOrden = inicio.comidasDeHoy(DIA, [ingesta('desayuno', '2026-11-07T08:40:00Z'), ingesta('cena', '2026-11-07T21:00:00Z'), ingesta(null, '2026-11-07T22:00:00Z', 'OUTSIDE_PRESCRIPTION')], horaDePrueba);
  assert.equal(inicio.laQueSigue(fueraDeOrden).nombre, 'Almuerzo');
  assert.equal(fueraDeOrden.fueraDelPlan, 1);
  assert.equal(fueraDeOrden.fichas.filter((f) => f.estado === 'registrada').length, 2, 'el registro fuera del plan no es una comida del plan');
});

test('TEST-AVR-011 · BE no elige el día tipo ni la sesión: sin día elegido, no hay fichas', () => {
  assert.equal(inicio.comidasDeHoy(null, [ingesta('desayuno', '2026-11-07T08:40:00Z')], horaDePrueba), null);
  assert.equal(inicio.laQueSigue(null), null);
  assert.match(leer('pantallas/inicio-nutricion.tsx'), /COPY_NUTRICION\.elegiDiaTipo/);
  assert.match(leer('pantallas/inicio-entrenamiento.tsx'), /Tu plan tiene varias sesiones\. Elegí la que hiciste o vas a hacer\./);
});

test('TEST-AVR-012 · «Tu actividad» es un número, las sesiones registradas en 30 días, sin porcentaje ni «Ir a…»', () => {
  assert.deepEqual(inicio.actividadEnUnNumero({ registradas: 11 }), { numero: 11, unidad: 'sesiones registradas', paraLeer: 'Últimos 30 días: 11 sesiones registradas' });
  assert.equal(inicio.actividadEnUnNumero({ registradas: 1 }).unidad, 'sesión registrada');
  const tarjeta = leer('pantallas/inicio-entrenamiento.tsx');
  assert.match(tarjeta, /actividadEnUnNumero\(r\.datos\)/);
  assert.doesNotMatch(tarjeta, /Realizadas con desvío/, 'el desglose está en «Tu historial»');
  for (const archivo of ['inicio.tsx', 'inicio-entrenamiento.tsx', 'inicio-nutricion.tsx', 'inicio-informacion.tsx']) assert.doesNotMatch(leer(`pantallas/${archivo}`), /texto="Ir a /, archivo);
  assert.deepEqual(desplegable.problemasDelPliegue(inicio.PLIEGUE_DE_LA_SESION_DE_HOY), []);
  assert.deepEqual(desplegable.problemasDelPliegue(inicio.PLIEGUE_DE_PARA_RESPONDER), []);
  assert.deepEqual(inicio.detalleDeLaSesion({ blockLabel: 'Bloque 2', microcycleLabel: 'Semana 3', prescriptions: [1, 2, 3, 4, 5, 6].map((i) => ({ exerciseName: `E${i}`, sets: [1, 2, 3] })) }), {
    bloque: 'Bloque 2 · Semana 3',
    ejercicios: ['E1 · 3 series', 'E2 · 3 series', 'E3 · 3 series'],
    yMas: 'y 3 más',
  });
});

test('TEST-AVR-013 · el total del desglose de «Tu historial» es el número de Inicio', () => {
  const a = { registradas: 11, realizadas: 8, conDesvio: 2, noRealizadas: 1 };
  const d = inicio.desgloseDeActividad(a);
  assert.equal(d.total, inicio.actividadEnUnNumero(a).numero);
  assert.equal(d.texto, 'Últimos 30 días: 8 realizadas, 2 con desvío y 1 no realizada.');
  const historial = leer('pantallas/historial.tsx');
  assert.match(historial, /leerActividadDeEntrenamiento\(api, token, periodo\)/);
  assert.match(historial, /`inicio-actividad:\$\{periodo\.periodStart\}:\$\{periodo\.periodEnd\}`/, 'la misma lectura y la misma clave que Inicio');
  assert.match(historial, /desgloseDeActividad\(r\.datos\)\.texto/);
});

// ─── TEST-AVR-015 · los íconos nuevos (AV-09) ───────────────────────────────────────────────────

const { ICONOS } = await import('../packages/domain/dist/index.js');
test('TEST-AVR-015 · el de «Mis hábitos» y el engranaje son de la familia, y van siempre con su palabra', () => {
  for (const nombre of ['habitos', 'engranaje']) assert.ok(ICONOS[nombre]?.formas.length > 0, nombre);
  assert.match(leer('perfil.ts'), /icono: 'habitos'/, 'en Perfil');
  assert.match(leer('pantallas/inicio-informacion.tsx'), /'habitos'/, 'en Inicio');
  assert.match(leer('pantallas/quien-ve-que.tsx'), /nombre="habitos"/, 'en «Quién ve qué»');
});

// ─── TEST-AVR-029 · una cuenta nueva (AV-17) ────────────────────────────────────────────────────

test('TEST-AVR-029 · una cuenta nueva: el paso que falta primero, líneas sin plan, sin «Para responder» y Perfil sin punto', () => {
  assert.equal(inicio.ORDEN_DE_INICIO[0], 'paso-que-falta');
  assert.equal(inicio.formaDelArea('NO_ACTIVE_PLAN'), 'linea');
  assert.equal(inicio.formaDelArea('AVAILABLE'), 'tarjeta');
  assert.equal(inicio.seDibujaParaResponder([]), false, 'sin filas, no se dibuja');
  assert.equal(inicio.seDibujaParaResponder(undefined), false, 'sin lectura, no se afirma nada');
  const nada = perfil.paraResponder([], habitosCon([]), []);
  assert.deepEqual(perfil.marcaDePerfil(nada), { visible: false, paraLeer: null });
  assert.equal(perfil.nombreEnPerfil(null).texto, 'Agregá tu nombre');
  assert.equal(perfil.estadoDeMisHabitos({ cargados: false, losReciben: 0 }), 'Todavía no los contaste');
  assert.deepEqual(perfil.filasDeFormularios({ paraResponder: nada, respondidos: 0 }), [{ que: 'para-responder', titulo: 'Para responder', detalle: 'Nada para responder', cuenta: null }], 'sin respondidos, sin fila; sin ceros');
  const pantalla = leer('pantallas/inicio.tsx');
  assert.ok(pantalla.indexOf('<AccesoIncompleto') < pantalla.indexOf('<EntrenamientoDeHoy'), 'el paso que falta va arriba de todo');
  assert.match(leer('pantallas/inicio-nutricion.tsx'), /formaDelArea\(r\.datos\.data\.planState\) === 'linea'/);
  assert.match(leer('pantallas/inicio-entrenamiento.tsx'), /<LineaDeInicio zona="entrenamiento" texto=\{COPY_ENTRENAMIENTO\.sinPlanAsesorado\} \/>/);
});

// ─── TEST-AVR-016 a 024 y 030 · la sesión en curso (AV-10 a AV-14 y AV-18) ───────────────────────

const corrida = await import('../apps/mobile/src/corrida-de-entrenamiento.ts');
const descanso = await import('../apps/mobile/src/descanso-automatico.ts');
const { crearReloj } = await import('../apps/mobile/src/reloj-de-sesion.ts');
const { calcularTiempos } = await import('../packages/domain/dist/index.js');

/** Una sesión de prueba: Sentadilla (pA) y un segundo ejercicio (pB), con un reloj que avanza cuando la prueba lo dice. */
function sesionDePrueba() {
  const t = { mono: 5_000, civil: Date.UTC(2026, 10, 7, 14, 0, 0) };
  let n = 0;
  const h = { reloj: crearReloj({ ancla: 'proceso-vuelta', monotonico: () => t.mono, civil: () => t.civil }), nuevoId: (p) => `${p}-${String(++n).padStart(6, '0')}` };
  const contexto = { prescripciones: new Set(['pA', 'pB']), otraSesionEnCurso: false };
  let c = corrida.CORRIDA_VACIA;
  const hacer = (accion) => {
    const r = corrida.armarAccion(c, accion, contexto, h);
    if (r.ok) c = r.corrida;
    return r;
  };
  hacer({ tipo: 'iniciar', prescriptionId: 'pA' });
  return {
    hacer,
    estado: () => corrida.estadoLocal(c),
    eventos: () => corrida.eventosDeLaCorrida(c),
    avanzar: (s) => {
      t.mono += s * 1000;
      t.civil += s * 1000;
    },
  };
}
const AUTO = descanso.AJUSTES_DE_FABRICA;
const MANUAL = { ...AUTO, inicio: 'manual' };
const serie2 = { prescriptionId: 'pA', setIndex: 2, ultimaDelEjercicio: false };

test('TEST-AVR-016 · con el ajuste automático, tildar la serie empieza su descanso, ligado a esa serie; con el manual, nada', () => {
  const s = sesionDePrueba();
  const accion = descanso.accionAlTildar(s.estado(), AUTO, serie2);
  assert.deepEqual(accion, { tipo: 'descanso-al-tildar', prescriptionId: 'pA', setIndex: 2 });
  const r = s.hacer(accion);
  assert.equal(r.ok, true, 'aplicarEventos acepta la secuencia');
  assert.deepEqual(r.eventos.map((e) => [e.type, e.prescriptionId, e.setIndex]), [['REST_STARTED', 'pA', 2]]);
  assert.equal(descanso.accionAlTildar(s.estado(), MANUAL, serie2), null, 'manual: «Iniciar descanso», como hoy');
});

test('TEST-AVR-017 · en pausa, tildar no arranca ningún descanso; sin corrida, tampoco', () => {
  const s = sesionDePrueba();
  s.hacer({ tipo: 'pausar' });
  assert.equal(descanso.accionAlTildar(s.estado(), AUTO, serie2), null);
  assert.equal(descanso.accionAlTildar(null, AUTO, serie2), null, 'otro día o sin empezar');
});

test('TEST-AVR-018 · con la serie cronometrada abierta, la misma acción la cierra y empieza el descanso, en el mismo instante', () => {
  const s = sesionDePrueba();
  s.hacer({ tipo: 'cronometrar-serie', prescriptionId: 'pA', setIndex: 2 });
  s.avanzar(40);
  const r = s.hacer(descanso.accionAlTildar(s.estado(), AUTO, serie2));
  assert.equal(r.ok, true);
  assert.deepEqual(r.eventos.map((e) => e.type), ['SET_TIMING_FINISHED', 'REST_STARTED']);
  assert.deepEqual(r.eventos[0].at, r.eventos[1].at, 'el mismo instante');
  assert.ok(r.eventos[0].compoundActionId && r.eventos[0].compoundActionId === r.eventos[1].compoundActionId, 'una sola acción compuesta');
  // Con el descanso de la serie 2 corriendo, tildar la 3 lo cierra y empieza el de la 3.
  s.avanzar(30);
  const r3 = s.hacer(descanso.accionAlTildar(s.estado(), AUTO, { prescriptionId: 'pA', setIndex: 3, ultimaDelEjercicio: false }));
  assert.deepEqual(r3.eventos.map((e) => [e.type, e.setIndex ?? null]), [['REST_FINISHED', null], ['REST_STARTED', 3]]);
  // «Iniciar descanso», a mano, sigue como era: con algo abierto, se rechaza.
  assert.deepEqual(s.hacer({ tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 4 }), { ok: false, motivo: 'MEASUREMENT_OPEN' });
});

test('TEST-AVR-019 · tras la última serie del ejercicio no arranca; destildar con el descanso corriendo lo termina; sin recomendado, sin barra', () => {
  const s = sesionDePrueba();
  assert.equal(descanso.accionAlTildar(s.estado(), AUTO, { prescriptionId: 'pA', setIndex: 4, ultimaDelEjercicio: true }), null, 'AVD-3');
  s.hacer(descanso.accionAlTildar(s.estado(), AUTO, serie2));
  assert.deepEqual(descanso.accionAlDestildar(s.estado(), { prescriptionId: 'pA', setIndex: 2 }), { tipo: 'finalizar-descanso' });
  assert.equal(descanso.accionAlDestildar(s.estado(), { prescriptionId: 'pA', setIndex: 1 }), null, 'otra serie: el descanso sigue');
  const r = s.hacer(descanso.accionAlDestildar(s.estado(), { prescriptionId: 'pA', setIndex: 2 }));
  assert.deepEqual(r.eventos.map((e) => e.type), ['REST_FINISHED'], 'un evento no se borra: se cierra');
  // La barra: de 0 al recomendado; pasado, queda llena y no corta nada. Sin recomendado, no hay barra.
  assert.equal(descanso.llenadoDeLaBarra(72_000, 90), 0.8);
  assert.equal(descanso.llenadoDeLaBarra(120_000, 90), 1);
  assert.equal(descanso.llenadoDeLaBarra(10_000, null), null);
  assert.equal(descanso.llegoAlRecomendado(89_000, 90_000, 90), true);
  assert.equal(descanso.llegoAlRecomendado(91_000, 92_000, 90), false, 'se anuncia una sola vez');
  assert.equal(descanso.llegoAlRecomendado(0, 500_000, null), false, 'sin recomendado no vibra');
});

test('TEST-AVR-020 · los ajustes del descanso quedan en el teléfono, con los de fábrica si la lectura falla', async () => {
  assert.deepEqual(descanso.AJUSTES_DE_FABRICA, { inicio: 'automatico', vibrar: true, tambienBloqueado: true });
  const guardado = new Map();
  const almacen = { getItem: async (k) => guardado.get(k) ?? null, setItem: async (k, v) => void guardado.set(k, v) };
  const a = descanso.crearAjustesDelDescanso(almacen);
  assert.deepEqual(await a.leer(), descanso.AJUSTES_DE_FABRICA);
  assert.equal(await a.cambiar({ inicio: 'manual' }), true);
  assert.equal((await descanso.crearAjustesDelDescanso(almacen).leer()).inicio, 'manual', 'en un proceso nuevo, lo guardado');
  const roto = descanso.crearAjustesDelDescanso({ getItem: async () => { throw new Error('sin almacenamiento'); }, setItem: async () => { throw new Error('no'); } });
  assert.deepEqual(await roto.leer(), descanso.AJUSTES_DE_FABRICA);
  assert.equal(await roto.cambiar({ vibrar: false }), false, 'no se pudo guardar: lo dice, y vale en esta sesión');
  assert.equal(roto.actuales().vibrar, false);
  assert.deepEqual(descanso.ajustesDe('{"inicio":"otra-cosa","vibrar":"sí"}'), descanso.AJUSTES_DE_FABRICA, 'basura: los de fábrica');
  // Hasta AV-15 no se ofrece «Arranca sola»: los ajustes no tienen el de la serie siguiente.
  assert.deepEqual(Object.keys(descanso.AJUSTES_DE_FABRICA).sort(), ['inicio', 'tambienBloqueado', 'vibrar']);
});

test('TEST-AVR-021 · el aviso del recomendado: cuándo se programa y cuándo no; el permiso en contexto', () => {
  const base = { descansoCorriendo: true, pausada: false, recomendadoS: 90, transcurridoMs: 12_000, ajustes: AUTO, permiso: 'dado' };
  assert.deepEqual(descanso.planDelAviso(base), { enSegundos: 78 });
  for (const [cambio, por] of [
    [{ descansoCorriendo: false }, 'el descanso terminó antes, se destildó o se finalizó'],
    [{ pausada: true }, 'en pausa'],
    [{ recomendadoS: null }, 'sin recomendado'],
    [{ ajustes: { ...AUTO, vibrar: false } }, 'vibrar apagado'],
    [{ ajustes: { ...AUTO, tambienBloqueado: false } }, 'solo con la app abierta'],
    [{ permiso: 'negado' }, 'sin permiso'],
    [{ transcurridoMs: 95_000 }, 'ya pasó el recomendado'],
  ]) {
    assert.equal(descanso.planDelAviso({ ...base, ...cambio }), null, por);
  }
  const permiso = (permisoDado, cerrado = false) => descanso.pedidoDelPermiso({ ajustes: AUTO, permiso: permisoDado, descansoCorriendo: true, cerradoEnEstaSesion: cerrado });
  assert.equal(permiso('dado'), 'nada');
  assert.equal(permiso('sin-pedir'), 'explicar', 'en el primer descanso, con el para qué');
  assert.equal(permiso('sin-pedir', true), 'nada', 'cerrado sin elegir: no se vuelve a preguntar en esa sesión');
  assert.equal(permiso('negado'), 'solo-con-la-app-abierta');
  assert.equal(descanso.pedidoDelPermiso({ ajustes: AUTO, permiso: 'sin-pedir', descansoCorriendo: false, cerradoEnEstaSesion: false }), 'nada', 'nunca al abrir la app');
  // El aviso no nombra el ejercicio ni muestra datos.
  assert.deepEqual(descanso.CONTENIDO_DEL_AVISO, { title: 'Tu descanso llegó al recomendado', body: '', data: { tipo: 'descanso-de-be' } });
  assert.equal(descanso.esElAvisoDelDescanso(descanso.CONTENIDO_DEL_AVISO.data), true);
});

test('TEST-AVR-022 · la lista de permisos: sin alarma exacta ni arranque del sistema, y la garantía de los avisos corregida', () => {
  const CONFIG = readFileSync(join(RAIZ, 'apps/mobile/app.config.ts'), 'utf8');
  const lista = CONFIG.slice(CONFIG.indexOf('const PERMISOS_QUE_BE_NO_USA = ['), CONFIG.indexOf('];', CONFIG.indexOf('const PERMISOS_QUE_BE_NO_USA')));
  for (const p of ['android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.USE_EXACT_ALARM', 'android.permission.RECEIVE_BOOT_COMPLETED']) assert.ok(lista.includes(`'${p}'`), `${p} bloqueado (AVD-5)`);
  assert.doesNotMatch(lista, /'android\.permission\.VIBRATE'/, 'vibrar con la app abierta hace falta');
  assert.doesNotMatch(CONFIG, /BE no programa avisos\s+locales/, 'la garantía vieja se corrigió (AVD-5)');
  const TELEFONO = leer('avisos-del-telefono.ts');
  assert.match(TELEFONO, /scheduleNotificationAsync/);
  assert.match(TELEFONO, /cancelScheduledNotificationAsync/);
  assert.doesNotMatch(TELEFONO, /exerciseName|nombreDelEjercicio/, 'el aviso no lleva el ejercicio');
});

test('TEST-AVR-023 · la fila fija: Pausar o Reanudar, la acción del momento y Siguiente ejercicio', () => {
  const fila = (d) => descanso.filaDeAcciones({ pausada: false, abierta: null, prescriptionId: 'pA', siguienteSinRegistrar: 3, haySiguienteEjercicio: true, ...d });
  const descansando = fila({ abierta: { kind: 'REST', measurementId: 'r', prescriptionId: 'pA', setIndex: 2 } });
  assert.deepEqual([descansando.izquierda.texto, descansando.medio.texto, descansando.siguienteEjercicio.texto], ['Pausar', 'Empezar serie 3', 'Siguiente ejercicio']);
  assert.equal(fila({ abierta: { kind: 'SET', measurementId: 's', prescriptionId: 'pA', setIndex: 3 } }).medio.texto, 'Terminar serie 3');
  assert.equal(fila({}).medio.texto, 'Empezar serie 3', 'sin nada abierto, mide la serie');
  const enPausa = fila({ pausada: true });
  assert.equal(enPausa.izquierda.texto, 'Reanudar');
  assert.equal(enPausa.motivo, 'En pausa no se mide nada: reanudá para seguir.');
  assert.equal(enPausa.siguienteEjercicio.habilitado, false);
  assert.equal(fila({ haySiguienteEjercicio: false }).siguienteEjercicio, null, 'en el último ejercicio');
  assert.equal(fila({ siguienteSinRegistrar: null }).medio, null, 'todas registradas');
  assert.doesNotMatch(JSON.stringify(fila({})), /Finalizar/, '«Finalizar entrenamiento» no está en la fila');
});

test('TEST-AVR-024 · «Empezar serie N» con un descanso corriendo: dos eventos, el mismo instante y una sola acción compuesta', () => {
  const s = sesionDePrueba();
  s.hacer(descanso.accionAlTildar(s.estado(), AUTO, serie2));
  s.avanzar(72);
  const r = s.hacer(descanso.accionDeEmpezarSerie('pA', 3));
  assert.deepEqual(r.eventos.map((e) => e.type), ['REST_FINISHED', 'SET_TIMING_STARTED']);
  assert.deepEqual(r.eventos[0].at, r.eventos[1].at);
  assert.ok(r.eventos[0].compoundActionId && r.eventos[0].compoundActionId === r.eventos[1].compoundActionId);
  // El doble toque: el segundo no agrega eventos.
  const antes = s.eventos().length;
  assert.equal(s.hacer(descanso.accionDeEmpezarSerie('pA', 3)).ok, false);
  assert.equal(s.eventos().length, antes);
  // Los tiempos: el descanso y la serie medidos, sin hueco entre ellos.
  s.avanzar(30);
  s.hacer({ tipo: 'finalizar-serie' });
  const tiempos = calcularTiempos(s.eventos(), () => 90);
  const elDescanso = tiempos.rests.find((d) => d.setIndex === 2);
  const laSerie = tiempos.timedSets.find((x) => x.setIndex === 3);
  assert.equal(elDescanso.finishedAt, laSerie.startedAt, 'sin hueco');
  // Sin descanso, «Empezar serie N» arranca solo la medición de la serie.
  const sin = sesionDePrueba();
  assert.deepEqual(sin.hacer(descanso.accionDeEmpezarSerie('pA', 1)).eventos.map((e) => e.type), ['SET_TIMING_STARTED']);
});

test('TEST-AVR-030 · con letra grande, la fila de acciones sigue en una fila y la navegación pasa a dos; nada se esconde', () => {
  const zonas = nav.ZONAS.map((z) => z.zona);
  assert.deepEqual(descanso.disposicionDeLaSesion(360, 1, zonas), { filasDeAcciones: 1, filasDeNavegacion: 1, navegacionVisible: true });
  for (const escala of [1.3, 2]) assert.deepEqual(descanso.disposicionDeLaSesion(360, escala, zonas), { filasDeAcciones: 1, filasDeNavegacion: 2, navegacionVisible: true }, `×${escala}`);
});

// ═══ WP-APP-VUELTA-2 (DL-170): la etapa A, con sus oráculos TEST-AV2 (docs/paquetes/WP-APP-VUELTA-2-ORACULOS.md) ═══

const receta = await import('../apps/mobile/src/receta-de-vidrio.ts');

/** Las paletas de tema.ts, leídas como texto: tema.ts importa react-native y no se puede importar acá. */
function paletaDe(nombre) {
  const ts = leer('tema.ts');
  const inicio = ts.search(new RegExp(`export const ${nombre}(: \\w+)? = \\{`));
  const cuerpo = ts.slice(inicio, ts.indexOf('};', inicio));
  return Object.fromEntries([...cuerpo.matchAll(/(\w+):\s*'([^']*)'/g)].map((m) => [m[1], m[2]]));
}
const AZUL = paletaDe('AZUL_NOCHE');
const CLARO = paletaDe('CLARO');
const PRENDIDO = { activo: true, altoContraste: false };
/** El código sin comentarios: lo que se ejecuta, no lo que se explica. */
const sinComentarios = (codigo) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

// ─── TEST-AV2-002 · la superficie por nivel, el interruptor y el alto contraste (AV2-02) ─────────

test('TEST-AV2-002 · nivel 1 con sombra y línea de luz, nivel 2 sin sombra, y sin relleno más adentro', () => {
  const n1 = receta.superficieDeVidrio(AZUL, 'azul-noche', 1, PRENDIDO);
  assert.equal(n1.backgroundColor, AZUL.vidrio);
  assert.equal(n1.borderColor, AZUL.vidrioFilo);
  assert.equal(n1.borderWidth, 1);
  assert.equal(n1.borderRadius, 20);
  assert.deepEqual(n1.boxShadow, [
    { offsetX: 0, offsetY: 8, blurRadius: 24, spreadDistance: -4, color: AZUL.sombraVidrio },
    { offsetX: 0, offsetY: 1, blurRadius: 0, inset: true, color: AZUL.vidrioLuz },
  ]);
  // En Claro, la sombra no se recoge y la línea de luz no se dibuja (sobre blanco no se vería).
  assert.deepEqual(receta.superficieDeVidrio(CLARO, 'claro', 1, PRENDIDO).boxShadow, [{ offsetX: 0, offsetY: 8, blurRadius: 24, spreadDistance: 0, color: CLARO.sombraVidrio }]);
  for (const [paleta, tema] of [[AZUL, 'azul-noche'], [CLARO, 'claro']]) {
    const n2 = receta.superficieDeVidrio(paleta, tema, 2, PRENDIDO);
    assert.equal(n2.backgroundColor, paleta.vidrioInterior, tema);
    assert.equal(n2.borderRadius, 14, tema);
    assert.equal(n2.boxShadow, undefined, `${tema}: el nivel 2 no lleva sombra`);
    const n3 = receta.superficieDeVidrio(paleta, tema, 3, PRENDIDO);
    assert.match(n3.backgroundColor, /00$/i, `${tema}: dentro de un nivel 2, sin relleno`);
    assert.equal(n3.boxShadow, undefined);
  }
  // El contexto: afuera, nivel 1; dentro de un nivel 1, nivel 2; dentro de un nivel 2, sin relleno (3).
  assert.deepEqual([0, 1, 2, 3].map(receta.nivelQueSigue), [1, 2, 3, 3]);
});

test('TEST-AV2-002 · con el interruptor apagado o con alto contraste, la superficie opaca de hoy', () => {
  for (const [paleta, tema] of [[AZUL, 'azul-noche'], [CLARO, 'claro']]) {
    for (const opciones of [{ activo: false, altoContraste: false }, { activo: true, altoContraste: true }, { activo: false, altoContraste: true }]) {
      for (const nivel of [1, 2, 3]) {
        assert.deepEqual(receta.superficieDeVidrio(paleta, tema, nivel, opciones), { backgroundColor: paleta.superficie, borderColor: paleta.borde, borderWidth: 1 }, `${tema} ${JSON.stringify(opciones)} nivel ${nivel}`);
      }
    }
  }
  // Sin el vidrio, el botón principal es el de siempre.
  assert.equal(receta.botonPrincipal(AZUL, { activo: false, altoContraste: false, habilitado: true }), null);
  assert.equal(receta.botonPrincipal(AZUL, { activo: true, altoContraste: true, habilitado: true }), null);
});

test('TEST-AV2-002 · el brillo de arriba se apaga dentro del relleno, en el mismo color con alfa 00; en Claro no se dibuja', () => {
  const brillo = receta.brilloDeArriba(AZUL);
  assert.equal(brillo, `linear-gradient(to bottom, ${AZUL.vidrioBrillo} 0px, ${AZUL.vidrioBrillo.slice(0, 7)}00 ${receta.ALTO_DEL_BRILLO}px)`);
  assert.ok(receta.ALTO_DEL_BRILLO <= receta.RELLENO_MINIMO_DEL_NIVEL_1, 'el brillo no llega al contenido de ningún nivel 1');
  assert.ok(receta.RELLENO_MINIMO_DEL_NIVEL_1 <= receta.RELLENO_DE_LA_TARJETA);
  assert.equal(receta.superficieDeVidrio(AZUL, 'azul-noche', 1, PRENDIDO).experimental_backgroundImage, brillo);
  assert.equal(receta.brilloDeArriba(CLARO), null);
  assert.equal(receta.superficieDeVidrio(CLARO, 'claro', 1, PRENDIDO).experimental_backgroundImage, undefined);
});

// ─── TEST-AV2-003 · sin vistas hijas y sin «elevation» (AV2-02) ─────────────────────────────────

test('TEST-AV2-003 · lo translúcido no usa «elevation»: la sombra es «boxShadow»', () => {
  for (const [paleta, tema] of [[AZUL, 'azul-noche'], [CLARO, 'claro']]) {
    for (const nivel of [1, 2, 3]) {
      const s = receta.superficieDeVidrio(paleta, tema, nivel, PRENDIDO);
      assert.equal('elevation' in s, false, `${tema} nivel ${nivel}`);
      assert.equal('shadowOpacity' in s, false, `${tema} nivel ${nivel}`);
    }
    const boton = receta.botonPrincipal(paleta, { ...PRENDIDO, habilitado: true });
    assert.equal('elevation' in boton, false);
  }
});

test('TEST-AV2-003 · el vidrio no agrega vistas hijas: la receta y el contexto solo devuelven estilos', () => {
  for (const archivo of ['receta-de-vidrio.ts', 'vidrio.tsx']) {
    const codigo = sinComentarios(leer(archivo));
    assert.doesNotMatch(codigo, /<(View|Svg|Animated|Image|Text)\b/, `${archivo} dibuja una vista`);
    assert.doesNotMatch(codigo, /position:\s*'absolute'/, `${archivo} posiciona algo`);
    assert.doesNotMatch(codigo, /from 'react-native-svg'/, archivo);
  }
  // `sombraDeVidrio`, con `elevation`, queda solo para la lámina y sus tarjetas, que son opacas.
  const usan = archivosDeLaApk()
    .filter((a) => !a.endsWith('vidrio.tsx') && /sombraDeVidrio\(/.test(readFileSync(a, 'utf8')))
    .map((a) => a.replace(/\\/g, '/').split('/').pop());
  assert.deepEqual(usan.sort(), ['figura-de-la-toma.tsx', 'indicadores.tsx', 'progreso.tsx']);
});

// ─── TEST-AV2-004 · el fondo de la app (AV2-03) ─────────────────────────────────────────────────

test('TEST-AV2-004 · el fondo sale de los tokens: dos destellos que se apagan y el degradé, con dp de la ventana', () => {
  for (const [paleta, tema, medio] of [[AZUL, 'azul-noche', '55%'], [CLARO, 'claro', '50%']]) {
    for (const [ancho, alto] of [[360, 800], [412, 915]]) {
      const capas = receta.recetaDelFondo(paleta, tema, ancho, alto);
      assert.deepEqual(capas.map((c) => c.type), ['radial-gradient', 'radial-gradient', 'linear-gradient'], 'los destellos encima del degradé');
      const [cian, azul, degrade] = capas;
      assert.deepEqual(cian.colorStops.map((p) => p.color), [paleta.destello, `${paleta.destello.slice(0, 7)}00`]);
      assert.deepEqual(azul.colorStops.map((p) => p.color), [paleta.destelloAzul, `${paleta.destelloAzul.slice(0, 7)}00`]);
      assert.deepEqual(degrade.colorStops.map((p) => [p.color, p.positions[0]]), [[paleta.fondoArriba, '0%'], [paleta.fondo, medio], [paleta.fondoAbajo, '100%']]);
      for (const d of [cian, azul]) {
        for (const v of [d.size.x, d.size.y, d.position.top, d.position.left]) assert.ok(Number.isInteger(v), `${tema} ${ancho}×${alto}: ${v} no es un número de dp`);
      }
      assert.ok(cian.position.top < azul.position.top, 'el cian arriba; el azul a media altura');
      assert.ok(cian.position.left > ancho / 2 && azul.position.left < ancho / 2, 'de lados opuestos');
    }
  }
});

test('TEST-AV2-004 · el fondo es el primer hijo de la raíz, fuera del desplazamiento, sin toques ni lector, y liso con alto contraste', () => {
  const app = sinComentarios(readFileSync(join(RAIZ, 'apps/mobile/App.tsx'), 'utf8'));
  const fondo = app.indexOf('<FondoDeLaApp');
  // El desplazamiento en el JSX (`useRef<ScrollView>` no cuenta).
  const desplazamiento = app.search(/<ScrollView\s/);
  assert.ok(desplazamiento > 0);
  assert.ok(fondo > app.indexOf('<KeyboardAvoidingView') && fondo < app.indexOf('<Cabecera') && fondo < desplazamiento, 'primer hijo de la raíz');
  assert.equal(app.indexOf('<FondoDeLaApp', desplazamiento), -1, 'fuera del desplazamiento');
  assert.match(app, /<ProveedorDeVidrio activo=\{ruta\.nombre === 'inicio'\} altoContraste=\{altoContraste\}>/, 'el interruptor, solo en Inicio');
  assert.match(app, /raiz: \{ flex: 1 \},/, 'la raíz no pinta el fondo liso');
  assert.match(app, /style=\{\[estilos\.raiz, altoContraste && estilos\.raizLisa\]\}/, 'salvo con alto contraste');
  const componente = sinComentarios(leer('fondo-de-la-app.tsx'));
  for (const regla of [/pointerEvents="none"/, /accessible=\{false\}/, /importantForAccessibility="no-hide-descendants"/, /accessibilityElementsHidden/, /useWindowDimensions\(\)/, /if \(altoContraste\) return null;/, /position: 'absolute'/]) {
    assert.match(componente, regla);
  }
  assert.doesNotMatch(componente, /%|react-native-svg/, 'sin porcentajes ni SVG');
  // El velo de la barra sale de abajo del degradé: con `fondo` quedaba una franja.
  assert.match(leer('barra-de-zonas.tsx'), /stopColor=\{COLOR\.fondoAbajo\.slice\(0, 7\)\}/);
  assert.doesNotMatch(leer('barra-de-zonas.tsx'), /COLOR\.fondo\.slice/);
});
