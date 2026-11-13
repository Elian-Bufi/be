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

test('TEST-AVR-002 · la cabecera tiene la marca y Novedades, sin menú ni avatar, y la franja del aviso de prueba sale del ambiente', () => {
  const cabecera = leer('cabecera.tsx');
  assert.doesNotMatch(cabecera, /Abrir el menú|accessibilityLabel="Cuenta"|menu-de-la-app/);
  // Cambió con UF-08 de WP-USO-FINAL (DL-169, Dirección, 2026-11-11): la franja ya no va siempre. Lleva el texto del
  // dominio y va solo en las builds que muestran los avisos de prueba (en producción, nunca; en test, salvo con
  // BE_AVISOS_DE_PRUEBA=no).
  assert.match(cabecera, /\{AVISOS_DE_PRUEBA_VISIBLES \? \(\s*<Text[^>]*>\s*\{AVISOS_DE_PRUEBA\.franja\}/);
  assert.doesNotMatch(cabecera, /Ambiente de prueba/, 'el texto del aviso vive en el dominio');
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
/** El identificador de una cuenta de ejemplo, para la referencia neutral del dominio (DL-040). */
const IDENTIDAD = '0f6c2a1e-5b7d-4c3e-9a8f-2d1e0c36743a';
const { referenciaNeutral } = await import('../packages/domain/dist/index.js');

test('TEST-AVR-004 · Perfil: quién sos, tu información, tus profesionales, formularios y ajustes, con Cerrar mi cuenta al final', () => {
  assert.deepEqual(perfil.BLOQUES_DE_PERFIL, ['quien-sos', 'tu-informacion', 'tus-profesionales', 'formularios-y-pedidos', 'ajustes']);
  // Cambió con UF-06 de WP-USO-FINAL (DL-169, etapa 2, 2026-11-12): «Tus datos» (descargar lo propio y pedir el acceso,
  // la rectificación o la supresión) va entre los ajustes, después de Privacidad. «Cerrar mi cuenta» sigue al final.
  // Y con UF-07 (DL-169, etapa 2, 2026-11-12): «Ayuda y contacto» (el canal de ayuda, leído de la API) va después de «Tus
  // datos». «Cerrar mi cuenta» sigue al final.
  assert.deepEqual(perfil.AJUSTES_DE_PERFIL, ['apariencia', 'avisos', 'privacidad', 'tus-datos', 'ayuda-y-contacto', 'sesion', 'cerrar-mi-cuenta']);
  assert.equal(perfil.nombreEnPerfil('Diego Sosa', IDENTIDAD), 'Diego Sosa');
  // Cambió con UF-01 de WP-USO-FINAL (DL-169, Dirección, 2026-11-11): el nombre es obligatorio y lo pide «Antes de
  // seguir», así que Perfil ya no ofrece «Agregá tu nombre». Sin nombre (la app entró sin poder preguntar), la referencia.
  assert.equal(perfil.nombreEnPerfil(null, IDENTIDAD), referenciaNeutral(IDENTIDAD));
  assert.equal(perfil.nombreEnPerfil(null, undefined), null, 'sin el identificador, nada');
  assert.equal(perfil.nombreEnPerfil(undefined, IDENTIDAD), null, 'mientras se lee, nada');
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
// Desde DL-170 (AV2-13), Inicio lee API-ING-01, como Nutrición: las comidas traen el registro que las ocupa (`recordId`)
// y los registros son de las dos clases, con la comida de contexto.
const COMIDAS_DEL_DIA = [
  { mealId: 'cena', label: 'Cena', order: 4, options: [{}, {}, {}] },
  { mealId: 'desayuno', label: 'Desayuno', order: 1, options: [{}] },
  { mealId: 'almuerzo', label: 'Almuerzo', order: 2, options: [{}, {}, {}] },
  { mealId: 'merienda', label: 'Merienda', order: 3, options: [{}, {}, {}] },
];
/** Un registro de API-ING-01: de una opción del plan, o algo diferente (con su comida, o sin ninguna: fuera del plan). */
const registroDeHoy = (mealId, occurredAt, kind = 'PLAN_OPTION', extra = {}) => ({
  recordId: `r-${mealId ?? 'fuera'}${extra.sufijo ?? ''}`,
  kind,
  meal: mealId ? { mealId, label: mealId } : null,
  occurredAt,
  recordedAt: occurredAt,
  annulment: extra.anulado ? { annulledAt: occurredAt, reason: null } : null,
});
/** El día como lo arma la API: cada comida con el registro vigente que la ocupa. */
const diaCon = (registros) => ({
  meals: COMIDAS_DEL_DIA.map((m) => ({ ...m, recordId: registros.find((r) => r.annulment === null && r.meal?.mealId === m.mealId)?.recordId ?? null })),
});
const horaDePrueba = (iso) => iso.slice(11, 16);

// TEST-AVR-010 cambia con AV2-D1 (paso 1), ratificada por Dirección el 2026-11-11 (WP-APP-VUELTA-2 AV2-10): «la que
// sigue» se ancla en la última registrada hoy en el orden del plan, y ya no es la primera sin registrar (PV-2).
test('TEST-AVR-010 · «la que sigue» es la siguiente a la última registrada hoy en el orden del plan, nunca por la hora (AV2-D1)', () => {
  const desayuno = [registroDeHoy('desayuno', '2026-11-07T08:40:00Z')];
  const c = inicio.comidasDeHoy(diaCon(desayuno), desayuno, horaDePrueba);
  assert.deepEqual(c.fichas.map((f) => [f.nombre, f.estado]), [['Desayuno', 'registrada'], ['Almuerzo', 'la-que-sigue'], ['Merienda', 'por-venir'], ['Cena', 'por-venir']]);
  assert.equal(c.fichas[0].paraLeer, 'Desayuno, registrado a las 08:40');
  assert.equal(c.fichas[1].paraLeer, 'Almuerzo, registrar');
  // La cena registrada, y un registro fuera del plan: la cena es la última del plan, así que no se destaca ninguna, y el
  // almuerzo y la merienda quedan neutros.
  const conCena = [registroDeHoy('desayuno', '2026-11-07T08:40:00Z'), registroDeHoy('cena', '2026-11-07T21:00:00Z'), registroDeHoy(null, '2026-11-07T22:00:00Z', 'DIFFERENT')];
  const fueraDeOrden = inicio.comidasDeHoy(diaCon(conCena), conCena, horaDePrueba);
  assert.equal(inicio.laQueSigue(fueraDeOrden), null);
  assert.deepEqual(fueraDeOrden.fichas.map((f) => f.estado), ['registrada', 'sin-registrar', 'sin-registrar', 'registrada']);
  assert.equal(fueraDeOrden.fueraDelPlan, 1);
  assert.equal(fueraDeOrden.fichas.filter((f) => f.estado === 'registrada').length, 2, 'el registro fuera del plan no es una comida del plan');
});

test('TEST-AVR-011 · BE no elige el día tipo ni la sesión: sin día elegido, no hay fichas', () => {
  assert.equal(inicio.comidasDeHoy(null, [registroDeHoy('desayuno', '2026-11-07T08:40:00Z')], horaDePrueba), null);
  assert.equal(inicio.laQueSigue(null), null);
  assert.match(leer('pantallas/inicio-nutricion.tsx'), /COPY_NUTRICION\.elegiDiaTipo/);
  assert.match(leer('pantallas/inicio-entrenamiento.tsx'), /Tu plan tiene varias sesiones\. Elegí la que hiciste o vas a hacer\./);
});

// TEST-AVR-012 y 013 cambian con AV2-D2, ratificada por Dirección el 2026-11-11 (WP-APP-VUELTA-2 AV2-12): la actividad
// de Inicio deja de ser un solo número (PV-5) y va con su desglose; nunca un total que mezcle lo hecho con lo no hecho.
test('TEST-AVR-012 · la actividad de Inicio: realizadas y no realizadas por separado, sin porcentaje ni «Ir a…» (AV2-D2)', () => {
  const a = inicio.actividadDeInicio({ registradas: 11, realizadas: 8, conDesvio: 2, noRealizadas: 1 });
  assert.equal(a.texto, '10 realizadas · 1 no realizada · 30 días');
  assert.equal(a.paraLeer, 'Actividad de los últimos 30 días: 10 realizadas y 1 no realizada');
  assert.equal(inicio.actividadDeInicio({ realizadas: 1, conDesvio: 0, noRealizadas: 0 }).unidad, 'realizada');
  const tarjeta = [leer('pantallas/inicio.tsx'), leer('pantallas/inicio-entrenamiento.tsx')].join('\n');
  assert.match(tarjeta, /actividadDeInicio\(/);
  assert.doesNotMatch(tarjeta, /actividadEnUnNumero|sesiones registradas/, 'ya no es un solo número');
  for (const archivo of ['inicio.tsx', 'inicio-entrenamiento.tsx', 'inicio-nutricion.tsx', 'inicio-informacion.tsx']) assert.doesNotMatch(leer(`pantallas/${archivo}`), /texto="Ir a /, archivo);
  assert.deepEqual(desplegable.problemasDelPliegue(inicio.PLIEGUE_DE_LA_SESION_DE_HOY), []);
  assert.deepEqual(desplegable.problemasDelPliegue(inicio.PLIEGUE_DE_PARA_RESPONDER), []);
  assert.deepEqual(inicio.detalleDeLaSesion({ blockLabel: 'Bloque 2', microcycleLabel: 'Semana 3', prescriptions: [1, 2, 3, 4, 5, 6].map((i) => ({ exerciseName: `E${i}`, sets: [1, 2, 3] })) }), {
    bloque: 'Bloque 2 · Semana 3',
    ejercicios: ['E1 · 3 series', 'E2 · 3 series', 'E3 · 3 series'],
    yMas: 'y 3 más',
  });
});

test('TEST-AVR-013 · las realizadas de Inicio son las realizadas más las con desvío de «Tu historial», y las no realizadas, las mismas (AV2-D2)', () => {
  const a = { registradas: 11, realizadas: 8, conDesvio: 2, noRealizadas: 1 };
  const d = inicio.desgloseDeActividad(a);
  const i = inicio.actividadDeInicio(a);
  assert.equal(d.realizadas, a.realizadas + a.conDesvio);
  assert.equal(i.realizadas, d.realizadas);
  assert.equal(d.noRealizadas, a.noRealizadas);
  assert.equal(d.texto, 'Últimos 30 días: 10 realizadas (2 con desvío) y 1 no realizada.');
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
  // Desde DL-169 (UF-01) una cuenta nueva nace con su nombre, y la que no lo tiene lo completa en «Antes de seguir»:
  // Perfil no ofrece agregarlo.
  assert.equal(perfil.nombreEnPerfil('Persona Sintética', IDENTIDAD), 'Persona Sintética');
  assert.notEqual(perfil.nombreEnPerfil(null, IDENTIDAD), 'Agregá tu nombre');
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
    vivo: () => corrida.enVivoDeLaCorrida(c, h.reloj),
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
  // El filo de luz arriba (AV2-T24): el mismo borde de 1 dp, más claro arriba.
  assert.equal(n1.borderTopColor, AZUL.vidrioFiloArriba);
  assert.equal(n1.borderWidth, 1);
  assert.equal(n1.borderRadius, 20);
  // Más profundo (AV2-T24): una sola sombra, más baja y más larga que en la muestra, recogida a los costados.
  assert.deepEqual(n1.boxShadow, [
    { offsetX: 0, offsetY: 12, blurRadius: 32, spreadDistance: -6, color: AZUL.sombraVidrio },
    { offsetX: 0, offsetY: 1, blurRadius: 0, inset: true, color: AZUL.vidrioLuz },
  ]);
  // En Claro, la sombra azulada y la línea de luz no se dibuja (sobre blanco no se vería).
  const claroN1 = receta.superficieDeVidrio(CLARO, 'claro', 1, PRENDIDO);
  assert.deepEqual(claroN1.boxShadow, [{ offsetX: 0, offsetY: 10, blurRadius: 28, spreadDistance: -2, color: CLARO.sombraVidrio }]);
  assert.equal(claroN1.borderTopColor, CLARO.vidrioFiloArriba);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(CLARO.sombraVidrio.slice(i, i + 2), 16));
  assert.ok(b > g && g > r, `la sombra de Claro es levemente azulada: ${CLARO.sombraVidrio}`);
  // Sin el vidrio, ni filo ni sombra: la superficie opaca de hoy.
  assert.equal('borderTopColor' in receta.superficieDeVidrio(AZUL, 'azul-noche', 1, { activo: false, altoContraste: false }), false);
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
  const nivel1 = receta.superficieDeVidrio(AZUL, 'azul-noche', 1, PRENDIDO);
  assert.equal(nivel1.experimental_backgroundImage, brillo);
  // El brillo pinta solo su franja: sin tamaño, React Native dibuja el rectángulo del alto de toda la tarjeta (y lo
  // repite), una pasada de más sobre todo el vidrio aunque se vea en 12 dp.
  assert.equal(nivel1.experimental_backgroundSize, `100% ${receta.ALTO_DEL_BRILLO}px`);
  assert.equal(nivel1.experimental_backgroundRepeat, 'no-repeat');
  assert.equal(receta.brilloDeArriba(CLARO), null);
  const claro = receta.superficieDeVidrio(CLARO, 'claro', 1, PRENDIDO);
  assert.deepEqual([claro.experimental_backgroundImage, claro.experimental_backgroundSize, claro.experimental_backgroundRepeat], [undefined, undefined, undefined]);
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
      if (tema === 'azul-noche') {
        assert.ok(cian.position.top < azul.position.top, 'el cian arriba; el azul a media altura');
        assert.ok(cian.position.left > ancho / 2 && azul.position.left < ancho / 2, 'de lados opuestos');
      } else {
        // Claro (AV2-T25): los barridos celestes en dos esquinas opuestas, arriba a la izquierda y abajo a la derecha.
        assert.deepEqual([cian.position.left, cian.position.top], [0, 0]);
        assert.deepEqual([azul.position.left, azul.position.top], [ancho, alto]);
        for (const token of ['destello', 'destelloAzul']) {
          const [r, g, b] = [1, 3, 5].map((i) => parseInt(paleta[token].slice(i, i + 2), 16));
          assert.ok(b >= g && g > r, `${token} de Claro es celeste: ${paleta[token]}`);
        }
      }
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
  // Desde el visto bueno a la muestra (AV2-26), en toda la app; antes era `activo={ruta.nombre === 'inicio'}`.
  assert.match(app, /<ProveedorDeVidrio activo altoContraste=\{altoContraste\}>/, 'el interruptor, prendido en toda la app');
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

// ─── TEST-AV2-005 · las piezas base (AV2-04) ────────────────────────────────────────────────────

test('TEST-AV2-005 · el botón principal: degradé y radio 14 con el vidrio, y el resplandor quieto solo si está habilitado', () => {
  for (const paleta of [AZUL, CLARO]) {
    const habilitado = receta.botonPrincipal(paleta, { ...PRENDIDO, habilitado: true });
    assert.equal(habilitado.experimental_backgroundImage, `linear-gradient(to bottom, ${paleta.botonFondo}, ${paleta.botonFondoFin})`);
    assert.equal(habilitado.borderRadius, 14);
    // Sin borde: con uno sin color, React Native ubica el degradé en la caja de relleno, lo pinta en la del borde y lo
    // repite, y arriba y abajo quedaba una franja invertida de 2 dp. Los 2 dp pasan a relleno: el alto no cambia.
    for (const estado of [habilitado, receta.botonPrincipal(paleta, { ...PRENDIDO, habilitado: false })]) {
      assert.equal(estado.borderWidth, 0, 'sin borde: el degradé ocupa el botón entero');
      assert.equal(estado.paddingVertical, receta.BORDE_DEL_BOTON, 'el borde pasa a relleno arriba y abajo');
      assert.equal(estado.paddingHorizontal, receta.RELLENO_DEL_BOTON + receta.BORDE_DEL_BOTON, 'y a los costados');
      assert.equal('borderColor' in estado, false);
    }
    assert.deepEqual(habilitado.boxShadow, [{ offsetX: 0, offsetY: 6, blurRadius: 18, color: paleta.resplandorPrimario }]);
    const deshabilitado = receta.botonPrincipal(paleta, { ...PRENDIDO, habilitado: false });
    assert.equal(deshabilitado.boxShadow, undefined, 'deshabilitado, sin resplandor');
    assert.equal(deshabilitado.experimental_backgroundImage, habilitado.experimental_backgroundImage);
  }
  const ui = sinComentarios(leer('ui.tsx'));
  // El botón de siempre (sin el vidrio) conserva su borde de 2 dp y su relleno de 18: los mismos números de la receta.
  assert.deepEqual([receta.BORDE_DEL_BOTON, receta.RELLENO_DEL_BOTON], [2, 18]);
  assert.match(ui, /\n  boton: \{ minHeight: 48, paddingHorizontal: RELLENO_DEL_BOTON, borderRadius: 8, borderWidth: BORDE_DEL_BOTON,/);
  assert.match(ui, /const habilitado = !\(deshabilitado \|\| ocupado\);\s*\n[\s\S]*?const principal = useBotonPrincipal\(habilitado\);/);
  assert.match(ui, /tipo === 'primario' \? principal : null/);
  assert.doesNotMatch(ui, /Animated\.(loop|timing)\([^)]*resplandor/i, 'el resplandor no pulsa');
});

test('TEST-AV2-005 · el enlace con flecha no lleva subrayado y sigue siendo un enlace; sin flecha, sí', () => {
  assert.equal(receta.subrayadoDelEnlace(true), 'none');
  assert.equal(receta.subrayadoDelEnlace(false), 'underline');
  const ui = sinComentarios(leer('ui.tsx'));
  assert.match(ui, /const conFlecha = tipo === 'enlace' && icono === 'derecha' && iconoAlFinal;/);
  assert.match(ui, /const subrayado = tipo === 'enlace' && subrayadoDelEnlace\(conFlecha\) === 'underline';/);
  assert.match(ui, /textoBoton_enlace: \{ color: COLOR\.acento \},/, 'el subrayado ya no viene con el estilo del enlace');
  assert.match(ui, /tamano=\{conFlecha \? 18 : 20\}/, 'el chevron de 18 dp');
  assert.match(ui, /accessibilityRole=\{tipo === 'enlace' \? 'link' : 'button'\}/, 'TalkBack lo lee como enlace');
});

test('TEST-AV2-005 · la etiqueta de estado no tiene borde ni parece un botón; rellena donde se lee y sin sangría donde no; la tilde en éxito, solo con lo hecho', () => {
  const rellena = (paleta) => ({ backgroundColor: paleta.etiquetaFondo, borderWidth: 0, paddingHorizontal: 12 });
  for (const [paleta, tema] of [[AZUL, 'azul-noche'], [CLARO, 'claro']]) {
    // Sobre lo opaco: con el vidrio apagado (o con alto contraste), cualquier tarjeta es `superficie`, y rellena se lee.
    // Es Tu historial (Seccion › Tarjeta, nivel 2), los formularios y los vínculos.
    for (const lugar of [1, 2, 3]) assert.deepEqual(receta.estiloDeLaEtiqueta(paleta, lugar, false), rellena(paleta), `${tema}, vidrio apagado, lugar ${lugar}`);
    // Sobre el vidrio de nivel 1, rellena.
    assert.deepEqual(receta.estiloDeLaEtiqueta(paleta, 1, true), rellena(paleta), `${tema}, vidrio de nivel 1`);
    // Directo sobre el fondo con los destellos no se lee rellena (3,69:1 y 4,37:1): sin relleno y sin sangría, con el
    // vidrio o sin él, alineada con el texto de al lado.
    for (const prendido of [true, false]) {
      const suelta = receta.estiloDeLaEtiqueta(paleta, 0, prendido);
      assert.match(suelta.backgroundColor, /00$/i, `${tema}: sin relleno sobre el fondo`);
      assert.equal(suelta.paddingHorizontal, 0, `${tema}: sin relleno, sin la sangría de 12 dp`);
      assert.equal(suelta.borderWidth, 0);
    }
  }
  // Dentro de un nivel 2 con el vidrio: en Azul noche el nivel 2 es translúcido y el tenue sobre el relleno baja a
  // 3,89:1, así que va sin relleno y sin sangría; en Claro es blanco opaco, y rellena se lee (4,84:1).
  assert.equal(receta.esOpaco(AZUL.vidrioInterior), false);
  assert.equal(receta.esOpaco(CLARO.vidrioInterior), true);
  for (const lugar of [2, 3]) {
    const azul = receta.estiloDeLaEtiqueta(AZUL, lugar, true);
    assert.match(azul.backgroundColor, /00$/i, `Azul noche, nivel ${lugar}`);
    assert.equal(azul.paddingHorizontal, 0);
    assert.deepEqual(receta.estiloDeLaEtiqueta(CLARO, lugar, true), rellena(CLARO), `Claro, nivel ${lugar}`);
  }
  const ui = sinComentarios(leer('ui.tsx'));
  const estilo = /\n  insignia: \{([^}]*)\}/.exec(ui)[1];
  assert.doesNotMatch(estilo, /border(Width|Color)/, 'sin borde');
  assert.doesNotMatch(estilo, /paddingHorizontal/, 'la sangría la pone la receta, solo con relleno');
  assert.match(ui, /const \{ tema, nivel, prendido \} = useVidrio\(\);\s*\n\s*const dibujo/);
  assert.match(ui, /estiloDeLaEtiqueta\(PALETAS\[tema\], nivel, prendido\)/);
  assert.match(ui, /textoInsignia: \{ fontWeight: '700', color: COLOR\.tenue, fontSize: 15 \},/);
  assert.match(ui, /const dibujo: NombreDeIcono \| undefined = hecha \? 'tilde' : icono;/);
  assert.match(ui, /tono=\{hecha \? 'exito' : 'tenue'\}/);
  assert.doesNotMatch(ui, /positiva/, 'la etiqueta ya no se pinta de verde');
  // Las piezas que dicen lo hecho: la sesión realizada, la comida registrada y el formulario respondido.
  const vivo = archivosDeLaApk().map((a) => readFileSync(a, 'utf8'));
  assert.ok(vivo.every((c) => !/<Insignia[^>]*\bpositiva\b/.test(c)), 'nadie pide la etiqueta verde');
});

// ─── TEST-AV2-006 · la cabecera (AV2-05) ────────────────────────────────────────────────────────

test('TEST-AV2-006 · la campana: un punto sin número, y el número en el nombre para el lector', () => {
  const cabecera = sinComentarios(leer('cabecera.tsx'));
  // El nombre accesible: «Novedades, 47 sin leer» con 47, «Novedades» sin ninguna (el lector agrega «botón»).
  const nombre = /accessibilityLabel=\{(sinLeer \? `Novedades, \$\{sinLeer\} sin leer` : 'Novedades')\}/.exec(cabecera);
  assert.ok(nombre, 'el número en el nombre de la campana');
  const nombreCon = (sinLeer) => (sinLeer ? `Novedades, ${sinLeer} sin leer` : 'Novedades');
  assert.equal(nombreCon(47), 'Novedades, 47 sin leer');
  assert.equal(nombreCon(0), 'Novedades');
  assert.equal(nombreCon(null), 'Novedades');
  // El punto: 8 dp en el acento, solo con algo sin leer, y el lector no lo recorre aparte.
  assert.match(cabecera, /\{sinLeer \? <View style=\{estilos\.punto\} accessible=\{false\} importantForAccessibility="no-hide-descendants" \/> : null\}/);
  assert.match(cabecera, /punto: \{[^}]*width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR\.acento \}/);
  // Dentro de la campana no hay texto: ni el número ni «99+».
  // Lo que hay adentro de la campana: desde el final de su etiqueta de apertura hasta su cierre.
  const apertura = cabecera.indexOf('accessibilityLabel={sinLeer');
  const campana = cabecera.slice(cabecera.indexOf('presionado]}>', apertura), cabecera.indexOf('</Pressable>', apertura));
  assert.doesNotMatch(campana, /<Text|99\+|\{sinLeer\}/, 'la campana no dibuja el número');
});

test('TEST-AV2-006 · la cabecera: transparente, una fila de 48 dp, el logo con nombre en las raíces, «Volver» en un detalle y el ambiente', () => {
  const cabecera = sinComentarios(leer('cabecera.tsx'));
  assert.match(cabecera, /cabecera: \{ paddingTop: Constants\.statusBarHeight \+ 2 \},/, 'sin fondo ni línea abajo');
  assert.match(cabecera, /fila: \{[^}]*minHeight: 48/);
  assert.match(cabecera, /\{volverA \? \([\s\S]*?\) : conLogo \? \(\s*<Logo \/>\s*\) : null\}/, 'a la izquierda: «Volver» en un detalle o el logo en una raíz');
  assert.match(cabecera, /<View style=\{estilos\.logo\} accessible accessibilityLabel="BE">/, 'el logo es accesible y se llama «BE»');
  assert.doesNotMatch(cabecera, />\s*BE\s*</, 'sin el texto «BE» a la vista');
  assert.match(cabecera, /<Svg [^>]*accessible=\{false\} importantForAccessibility="no-hide-descendants"/, 'el brillo no se lee');
  // Desde UF-08 (DL-169, traído de main el 2026-11-12) la línea del aviso de prueba sale del ambiente y su texto, del
  // dominio: la cabecera la dibuja solo con AVISOS_DE_PRUEBA_VISIBLES y nunca la escribe a mano (TEST-UF-012).
  assert.match(
    cabecera,
    /\{AVISOS_DE_PRUEBA_VISIBLES \? \(\s*<Text style=\{estilos\.ambiente\}[^>]*>\s*\{AVISOS_DE_PRUEBA\.franja\}\s*<\/Text>\s*\) : null\}/,
    'la línea del aviso de prueba, según el ambiente y con el texto del dominio (UF-08, 08 §33)',
  );
  assert.doesNotMatch(cabecera, /solo datos sintéticos/, 'el texto del aviso no se escribe en la cabecera');
  assert.match(cabecera, /ambiente: \{[^}]*color: COLOR\.tenue/);
  const app = sinComentarios(readFileSync(join(RAIZ, 'apps/mobile/App.tsx'), 'utf8'));
  assert.match(app, /conLogo=\{raiz\}/, 'el logo, solo en las cinco raíces');
});

// ─── TEST-AV2-026 · el grano de Azul noche, liviano (AV2-T23, la vuelta de Dirección a la 0.25) ──

test('TEST-AV2-026 · el grano es una imagen chica en mosaico, píxel a píxel, que cubre la pantalla; en Claro no hay', () => {
  for (const [anchoPx, altoPx, densidad, tope] of [[1080, 2400, 2.625, 15], [720, 1600, 2, 8], [1440, 3200, 3.5, 21]]) {
    const [ancho, alto] = [anchoPx / densidad, altoPx / densidad];
    const m = receta.mosaicoDelGrano(AZUL, ancho, alto, densidad);
    assert.ok(Math.abs(m.lado * densidad - receta.LADO_DEL_GRANO) < 1e-9, 'cada pieza, píxel a píxel: sin escalar el grano');
    assert.equal(m.piezas.length, Math.ceil(anchoPx / 512) * Math.ceil(altoPx / 512));
    assert.ok(m.piezas.length <= tope, `${anchoPx}×${altoPx}: ${m.piezas.length} piezas`);
    const derecha = Math.max(...m.piezas.map((p) => p.left)) + m.lado;
    const abajo = Math.max(...m.piezas.map((p) => p.top)) + m.lado;
    assert.ok(derecha >= ancho && abajo >= alto, 'cubre la pantalla entera');
    for (const p of m.piezas) assert.ok([p.left, p.top].every((v) => Math.abs(Math.round(v * densidad) - v * densidad) < 1e-6), 'en píxeles enteros');
  }
  assert.equal(receta.mosaicoDelGrano(CLARO, 412, 915, 2.625), null, 'en Claro, sin grano');
  const fondo = sinComentarios(leer('fondo-de-la-app.tsx'));
  assert.match(fondo, /const GRANO = require\('\.\.\/assets\/grano\.png'\);/);
  assert.match(fondo, /<Image key=\{`[^`]+`\} source=\{GRANO\} fadeDuration=\{0\}/, 'quieto: sin el fundido de entrada de Android');
  // Un mosaico con «repeat» arma en Android un mapa de bits del tamaño de la vista (AV2-T1).
  assert.doesNotMatch(fondo, /resizeMode|repeat/);
  // El grano suma una pasada y el fondo liso debajo del degradé se va: las pasadas quedan como en la muestra.
  assert.match(fondo, /fondo: \{ position: 'absolute', top: 0, left: 0 \},/);
});

// ─── TEST-AV2-027 · la cabecera responde al desplazamiento (AV2-T26) ────────────────────────────

test('TEST-AV2-027 · arriba de todo, transparente; con contenido detrás, un fondo tenue con su línea y el desvanecido', () => {
  assert.deepEqual([0, receta.UMBRAL_DE_LA_CABECERA, receta.UMBRAL_DE_LA_CABECERA + 1].map(receta.cabeceraCubierta), [false, false, true]);
  for (const paleta of [AZUL, CLARO]) {
    assert.deepEqual(receta.capaDeLaCabecera(paleta, false), { backgroundColor: paleta.cabeceraFondo, borderBottomColor: paleta.borde, borderBottomWidth: 1 });
    assert.equal(receta.capaDeLaCabecera(paleta, true).backgroundColor, paleta.fondo, 'con alto contraste, el fondo liso');
    assert.equal(receta.desvanecidoDeLaCabecera(paleta, false), `linear-gradient(to bottom, ${paleta.cabeceraFondo}, ${paleta.cabeceraFondo.slice(0, 7)}00)`);
    assert.equal(receta.desvanecidoDeLaCabecera(paleta, true), null, 'con alto contraste, sin desvanecido');
  }
  const cabecera = sinComentarios(leer('cabecera.tsx'));
  assert.match(cabecera, /<Animated\.View pointerEvents="none" accessible=\{false\} importantForAccessibility="no-hide-descendants" style=\{\[estilos\.capa, capaDeLaCabecera\(PALETAS\[tema\], altoContraste\), \{ opacity: cubierta \}\]\} \/>/);
  assert.match(cabecera, /desvanecido: \{ position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_DEL_DESVANECIDO \}/);
  const app = sinComentarios(readFileSync(join(RAIZ, 'apps/mobile/App.tsx'), 'utf8'));
  assert.match(app, /onScroll=\{\(e\) => alDesplazar\(e\.nativeEvent\.contentOffset\.y\)\}/);
  // Se anima al cruzar el umbral, con el controlador nativo; con movimiento reducido, sin fundido.
  assert.match(app, /if \(ahora === cubiertaAhora\.current\) return;/, 'no en cada evento');
  assert.match(app, /Animated\.timing\(cubierta, \{ toValue: ahora \? 1 : 0, duration: movimientoReducido \? 0 : FUNDIDO_DE_LA_CABECERA, useNativeDriver: true \}\)/);
  assert.match(app, /<\/ScrollView>\s*(\{\}\s*)?<DesvanecidoDeLaCabecera cubierta=\{cubierta\} altoContraste=\{altoContraste\} \/>/, 'el desvanecido, encima del borde de arriba del desplazamiento');
  assert.match(app, /cubierta=\{cubierta\}\s*altoContraste=\{altoContraste\}\s*\/>\s*<View style=\{\[estilos\.desplazable, \{ marginBottom: lugar\.margenAbajo \}\]\}>/);
});

// ─── TEST-AV2-022 · ninguna tarjeta escribe la superficie a mano (AV2-24) ───────────────────────

/**
 * Lo que sigue opaco por decisión: los diálogos y la hoja (nada se ve a través de ellos), la fila fija de la sesión
 * (PV-11), la lámina de la toma y sus tarjetas (Indicadores y Progreso, con su sombra), los controles (los campos, las
 * fichas de las comidas y los Segmentos, que la receta cubre dentro de una tarjeta), el aviso informativo (la receta lo
 * cubre con el vidrio prendido) y el círculo de la nube de la recuperación, que no es una tarjeta.
 */
const OPACO_POR_DECISION = [
  'campos-de-formulario.tsx · chip',
  'campos-de-formulario.tsx · renglon',
  'cuenta.tsx · dialogo',
  'dialogo.tsx · dialogo',
  'dialogo.tsx · opcionElegida',
  'evidencia-visual.tsx · dialogo',
  'fila-fija.tsx · fila',
  'indicadores.tsx · tarjeta',
  'nutricion-hoy.tsx · ficha',
  'progreso.tsx · tarjeta',
  'recuperacion.tsx · circuloDeLaNube',
  'sesion-enfocada.tsx · dialogo',
  'sesion-enfocada.tsx · hoja',
  'ui.tsx · aviso_info',
  'ui.tsx · entrada',
  'ui.tsx · segmentos',
];

/** Cada estilo que escribe `backgroundColor: COLOR.superficie`, como «archivo · estilo». */
function superficiesEscritasAMano() {
  const usos = [];
  for (const archivo of archivosDeLaApk()) {
    const lineas = sinComentarios(readFileSync(archivo, 'utf8')).split('\n');
    lineas.forEach((linea, i) => {
      if (!/backgroundColor: COLOR\.superficie\b(?!Elevada)/.test(linea)) return;
      let k = i;
      while (k >= 0 && !/^\s{2}(\w+): \{/.test(lineas[k])) k--;
      usos.push(`${archivo.replace(/\\/g, '/').split('/').pop()} · ${k >= 0 ? lineas[k].match(/^\s{2}(\w+):/)[1] : '?'}`);
    });
  }
  return usos.sort();
}

test('TEST-AV2-022 · ningún estilo de tarjeta escribe «COLOR.superficie» a mano, salvo lo opaco por decisión', () => {
  assert.deepEqual(superficiesEscritasAMano(), OPACO_POR_DECISION);
  // Las piezas que la pantalla arma a mano usan la receta: `Superficie`, `SuperficieTocable` o `useSuperficie`.
  const ui = sinComentarios(leer('ui.tsx'));
  assert.match(ui, /export function Superficie\(\{ style, encima, children, \.\.\.resto \}[^)]*\) \{\s*const \{ estilo, nivel \} = useSuperficie\(\);\s*return \(\s*<View \{\.\.\.resto\} style=\{\[style, estilo, encima, filoDelEstado\(StyleSheet\.flatten\(encima\)\)\]\}>\s*<DentroDelNivel nivel=\{nivel\}>/);
  assert.match(ui, /return \[style, estilo, estado, filoDelEstado\(StyleSheet\.flatten\(estado\)\)\];\s*\}\}\s*>\s*<DentroDelNivel nivel=\{nivel\}>/);
  const usan = archivosDeLaApk()
    .filter((a) => /<Superficie(Tocable)?\b/.test(readFileSync(a, 'utf8')))
    .map((a) => a.replace(/\\/g, '/').split('/').pop())
    .sort();
  for (const archivo of ['comida-diferente.tsx', 'correccion-de-entrenamiento.tsx', 'mis-habitos.tsx', 'notas-de-coordinacion.tsx', 'novedades.tsx', 'nutricion-hoy.tsx', 'perfil.tsx', 'piezas-de-nutricion.tsx', 'progreso-de-una-medida.tsx', 'quien-ve-que.tsx', 'revisiones.tsx', 'sesion-enfocada.tsx', 'texto-versionado.tsx', 'ui.tsx']) {
    assert.ok(usan.includes(archivo), `${archivo} usa la receta`);
  }
});

// ─── TEST-AV2-021 · la sesión enfocada, con vidrio, y lo opaco, opaco (AV2-23) ──────────────────

test('TEST-AV2-021 · las tarjetas de la sesión son de vidrio; la fila fija, la hoja y el diálogo siguen opacos', () => {
  const sesion = sinComentarios(leer('pantallas/sesion-enfocada.tsx'));
  assert.equal((sesion.match(/<Superficie style=\{\[estilos\.tarjeta,/g) ?? []).length, 4, 'las cuatro tarjetas de la sesión');
  assert.equal((sesion.match(/<Superficie style=\{estilos\.tarjetaDeSerie\} encima=/g) ?? []).length, 2, 'las tarjetas de cada serie, con su estado encima');
  // Las celdas son pozos dentro de la tarjeta: `fondo`, que se lee como un hueco.
  assert.match(sesion, /celdaQuieta: \{ borderColor: COLOR\.borde, backgroundColor: COLOR\.fondo \}/);
  assert.match(sesion, /filaActiva: \{ borderRadius: 12, borderWidth: 2, borderColor: COLOR\.acento, padding: 4, marginVertical: 2 \}/, 'sin un parche opaco dentro del vidrio');
  // PV-11: nada se ve a través de la fila fija ni de la barra fija.
  assert.match(sinComentarios(leer('fila-fija.tsx')), /fila: \{[^}]*backgroundColor: COLOR\.superficie/);
  assert.ok(OPACO_POR_DECISION.includes('sesion-enfocada.tsx · hoja') && OPACO_POR_DECISION.includes('sesion-enfocada.tsx · dialogo'));
});

test('TEST-AV2-037 · el borde de estado cierra también arriba: el filo de luz del nivel 1 no le gana', () => {
  assert.deepEqual(receta.filoDelEstado({ borderWidth: 2, borderColor: '#125EE0' }), { borderTopColor: '#125EE0' });
  assert.equal(receta.filoDelEstado({ borderTopColor: '#000000', borderColor: '#125EE0' }), null, 'si el estado ya dice el de arriba, manda el suyo');
  assert.equal(receta.filoDelEstado({ opacity: 0.8 }), null);
  assert.equal(receta.filoDelEstado(null), null);
  assert.equal(receta.filoDelEstado(undefined), null);
  // `Superficie` y `SuperficieTocable` lo suman a todo `encima`: la serie activa y la registrada, las novedades sin leer
  // o importantes, la casilla con error y el recuadro punteado de la comida diferente.
  const ui = sinComentarios(leer('ui.tsx'));
  assert.match(ui, /style=\{\[style, estilo, encima, filoDelEstado\(StyleSheet\.flatten\(encima\)\)\]\}/);
  assert.match(ui, /const estado = encima\?\.\(pressed\);\s*return \[style, estilo, estado, filoDelEstado\(StyleSheet\.flatten\(estado\)\)\];/);
  // Cada `encima=` con un borde de color pasa por esas dos piezas: no hay otra forma de poner un estado sobre el vidrio.
  const usos = [];
  for (const archivo of archivosDeLaApk()) {
    const texto = sinComentarios(readFileSync(archivo, 'utf8'));
    for (const m of texto.matchAll(/\bencima=/g)) usos.push([...texto.slice(0, m.index).matchAll(/<([A-Z]\w*)\b/g)].pop()?.[1]);
  }
  assert.ok(usos.length >= 7, 'los usos de hoy');
  assert.deepEqual([...new Set(usos)].sort(), ['Superficie', 'SuperficieTocable']);
});

// ─── TEST-AV2-012 · «Cómo se lee», alineado (AV2-11) ────────────────────────────────────────────

test('TEST-AV2-012 · el título de la ayuda no lleva «flex»: el ancho lo toma la columna, y el (?) queda centrado', () => {
  const ui = sinComentarios(leer('ui.tsx'));
  const titulo = /\n  tituloDeAyuda: \{([^}]*)\}/.exec(ui);
  assert.ok(titulo, 'el estilo existe');
  assert.doesNotMatch(titulo[1], /\bflex(Grow|Shrink|Basis)?\s*:/, 'tituloDeAyuda no se estira');
  // Los títulos del desplegable tampoco: la columna que los contiene es la que lleva el ancho.
  assert.doesNotMatch(/\n  tituloDeDesplegable: \{([^}]*)\}/.exec(ui)[1], /\bflex(Grow)?\s*:/);
  assert.match(ui, /\n  textoDeDesplegable: \{ flex: 1 \},/);
  assert.match(ui, /\n  cabezaDeAyuda: \{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 \},/, 'la fila centra el título y el (?)');
});

// ─── TEST-AV2-013 · la actividad, contada de una sola manera y sin ceros (AV2-12) ───────────────

test('TEST-AV2-013 · Inicio y «Tu historial» con los ejemplos del paquete; sin ninguna, sin ceros', () => {
  const dos = { realizadas: 1, conDesvio: 1, noRealizadas: 1 };
  assert.equal(inicio.actividadDeInicio(dos).texto, '2 realizadas · 1 no realizada · 30 días');
  assert.equal(inicio.actividadDeInicio(dos).realizadas, 2);
  assert.equal(inicio.actividadDeInicio(dos).detalle, '1 no realizada · 30 días');
  assert.equal(inicio.actividadDeInicio(dos).paraLeer, 'Actividad de los últimos 30 días: 2 realizadas y 1 no realizada');
  assert.equal(inicio.desgloseDeActividad(dos).texto, 'Últimos 30 días: 2 realizadas (1 con desvío) y 1 no realizada.');
  assert.equal(inicio.desgloseDeActividad({ realizadas: 2, conDesvio: 0, noRealizadas: 1 }).texto, 'Últimos 30 días: 2 realizadas y 1 no realizada.');
  assert.equal(inicio.desgloseDeActividad({ realizadas: 2, conDesvio: 0, noRealizadas: 0 }).texto, 'Últimos 30 días: 2 realizadas.');
  // Solo lo no hecho: neutro, sin cifra grande y sin «0 realizadas».
  const soloNo = inicio.actividadDeInicio({ realizadas: 0, conDesvio: 0, noRealizadas: 1 });
  assert.deepEqual([soloNo.realizadas, soloNo.texto, soloNo.detalle], [null, '1 no realizada · 30 días', '1 no realizada · 30 días']);
  assert.equal(inicio.desgloseDeActividad({ realizadas: 0, conDesvio: 0, noRealizadas: 1 }).texto, 'Últimos 30 días: 1 no realizada.');
  // Nada: una línea, sin ceros.
  assert.equal(inicio.actividadDeInicio({ realizadas: 0, conDesvio: 0, noRealizadas: 0 }).vacia, true);
  assert.equal(inicio.desgloseDeActividad({ realizadas: 0, conDesvio: 0, noRealizadas: 0 }).texto, 'Últimos 30 días: sin sesiones registradas.');
});

test('TEST-AV2-013 · ninguna frase muestra un cero ni suma lo hecho con lo no hecho', () => {
  for (let r = 0; r <= 3; r++) {
    for (let d = 0; d <= 2; d++) {
      for (let n = 0; n <= 2; n++) {
        const a = { realizadas: r, conDesvio: d, noRealizadas: n };
        const i = inicio.actividadDeInicio(a);
        const h = inicio.desgloseDeActividad(a);
        for (const texto of [i.texto, i.detalle, i.paraLeer, h.texto]) {
          assert.doesNotMatch(texto, /(^|\D)0(\D|$)/, `${JSON.stringify(a)}: «${texto}» muestra un cero`);
          // Un total de «registradas» sumaba lo hecho con lo no hecho (el error 6 de la crítica).
          assert.doesNotMatch(texto, /\d+ (sesi(ón|ones) )?registradas?/, `${JSON.stringify(a)}: «${texto}» suma lo hecho con lo no hecho`);
        }
        if (r + d > 0 && n > 0) assert.match(i.texto, new RegExp(`^${r + d} realizadas? · ${n} no realizadas? · 30 días$`));
      }
    }
  }
});

test('TEST-AV2-013 · Inicio y «Tu historial» salen de la misma lectura y la misma clave', () => {
  const clave = /useLecturaRecordada\(token, `inicio-actividad:\$\{periodo\.periodStart\}:\$\{periodo\.periodEnd\}`/;
  const historial = leer('pantallas/historial.tsx');
  assert.match(historial, clave);
  assert.match(historial, /leerActividadDeEntrenamiento\(api, token, periodo\)/);
  const deInicio = ['inicio.tsx', 'inicio-entrenamiento.tsx'].map((a) => leer(`pantallas/${a}`)).join('\n');
  assert.match(deInicio, clave);
  assert.match(deInicio, /leerActividadDeEntrenamiento\(api, token, periodo\)/);
});

// ─── TEST-AV2-008 · Inicio según la maqueta (AV2-07) ────────────────────────────────────────────

const formatoDeInicio = await import('../apps/mobile/src/formato.ts');
const lecturasDeInicio = await import('../apps/mobile/src/lecturas-de-inicio.ts');
const ARCHIVOS_DE_INICIO = ['inicio.tsx', 'inicio-entrenamiento.tsx', 'inicio-nutricion.tsx', 'inicio-mediciones.tsx', 'inicio-informacion.tsx', 'inicio-acceso.tsx', 'tarjeta-de-inicio.tsx', 'tira-de-la-semana.tsx'];

test('TEST-AV2-008 · el título es la fecha y, de arriba abajo: el paso que falta, la tira, Entrenamiento, Comidas, «Para responder», la medida y la actividad', () => {
  const pantalla = sinComentarios(leer('pantallas/inicio.tsx'));
  assert.match(pantalla, /<Titulo>\{fechaLarga\(hoy\)\}<\/Titulo>/);
  const orden = ['<Titulo>', '<AccesoIncompleto', '<TiraDeLaSemana', '<EntrenamientoDeHoy', '<NutricionDeHoy', '<Pendientes', '<Mediciones', '<ActividadDeEntrenamiento'].map((t) => pantalla.indexOf(t));
  assert.ok(orden.every((p, i) => p > 0 && (i === 0 || p > orden[i - 1])), `el orden en inicio.tsx: ${orden.join(', ')}`);
  assert.deepEqual([...inicio.ORDEN_DE_INICIO], ['paso-que-falta', 'semana', 'sesion', 'comidas', 'para-responder', 'medida', 'actividad']);
  assert.doesNotMatch(pantalla, /Rotulo|paraMirar|Hola/, 'sin «Para mirar» ni «Hola»');
  assert.match(pantalla, /<View style=\{estilos\.parDeTarjetas\}>\s*<Mediciones [^>]*ancho=\{chicas\.ancho\}[^>]*\/>\s*<ActividadDeEntrenamiento [^>]*ancho=\{chicas\.ancho\}/, 'la medida y la actividad, lado a lado');
  // Las tarjetas usan las piezas base: el ícono de 20 dp en `azul`, en su caja con el tinte (AV2-T25), y la receta de vidrio.
  const tarjeta = sinComentarios(leer('pantallas/tarjeta-de-inicio.tsx'));
  assert.match(tarjeta, /<CajaDelIcono>\{icono \? <Icono nombre=\{icono\} tamano=\{20\} tono="azul" \/> : <IconoDeZona zona=\{zona\} color=\{COLOR\.azul\} tamano=\{20\} \/>\}<\/CajaDelIcono>/);
  assert.match(tarjeta, /const \{ estilo, nivel \} = useSuperficie\(\);/);
  assert.doesNotMatch(tarjeta, /borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor/, 'sin el círculo del ícono');
});

// La escala de letra como la manda Android: `Configuration.fontScale` es un `float`, y React Native 0.86 lo pasa a JS con
// `fontScale.toDouble()` (DeviceInfoModule.kt). «×1,3» llega como 1,2999999523…, menor que 1,3, y «×1,15» como
// 1,1499999761…. Las pruebas usan esos valores, no los literales.
const escalaDeLetra = await import('../apps/mobile/src/escala-de-letra.ts');
const comidasDeHoy = await import('../apps/mobile/src/comidas-de-hoy.ts');
const { TEXTOS_DE_LA_VUELTA: T_DE_INICIO } = await import('../apps/mobile/src/textos-de-la-vuelta.ts');
const ANDROID_13 = Math.fround(1.3);
const ANDROID_115 = Math.fround(1.15);
const CUATRO_COMIDAS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
const TITULOS_CHICOS = [T_DE_INICIO.mediciones, T_DE_INICIO.actividad];

test('TEST-AV2-008 · dos columnas con letra ×1 y una con ×1,3, también con la escala como la manda Android', () => {
  assert.ok(ANDROID_13 < 1.3, 'Android manda «×1,3» como 1,2999999523…, menor que 1,3');
  assert.equal(inicio.columnasDeInicio(360, 1), 2);
  assert.equal(inicio.columnasDeInicio(412, 1.15), 2);
  assert.equal(inicio.columnasDeInicio(412, ANDROID_115), 2);
  assert.equal(inicio.columnasDeInicio(360, 1.3), 1);
  assert.equal(inicio.columnasDeInicio(360, ANDROID_13), 1, '«×1,3» de Android: una columna');
  assert.equal(inicio.columnasDeInicio(360, 1.29), 2, 'por debajo de ×1,3, dos');
  assert.equal(inicio.columnasDeInicio(320, 1), 1, 'en un teléfono angosto, también una');
  assert.equal(escalaDeLetra.esLetraGrande(ANDROID_13), true);
  assert.equal(escalaDeLetra.esLetraGrande(ANDROID_115), false);
  assert.equal(escalaDeLetra.alcanzaLaEscala(Math.fround(1.5), 1.5), true);
  assert.equal(escalaDeLetra.alcanzaLaEscala(Number.NaN, 1.3), false, 'sin escala, la letra de siempre');
  // Las fichas dentro de la tarjeta: dos entran justas, con el relleno y el borde de la tarjeta descontados.
  const lugar = 360 - 2 * inicio.RELLENO_DE_LA_PANTALLA - 2 * (receta.RELLENO_DE_LA_TARJETA + 1);
  assert.equal(inicio.anchoUtilDeInicio(360, true), lugar);
  assert.ok(2 * inicio.anchoDeCadaColumna(360, 2, true) + inicio.SEPARACION_EN_INICIO <= lugar, 'dos fichas por fila sin pasarse');
  assert.equal(inicio.anchoDeCadaColumna(360, 1, true), lugar, 'en una columna, a todo el ancho');
  assert.equal(2 * inicio.anchoDeCadaColumna(360, 2, false) + inicio.SEPARACION_EN_INICIO, 360 - 2 * inicio.RELLENO_DE_LA_PANTALLA, 'las dos tarjetas chicas llenan la fila');
  // Nadie compara la escala con un literal: el umbral vive en escala-de-letra.ts, con la tolerancia del float.
  for (const archivo of ['inicio-de-hoy.ts', 'pantallas/inicio.tsx', 'pantallas/inicio-nutricion.tsx', 'pantallas/tarjeta-de-inicio.tsx', 'pantallas/tira-de-la-semana.tsx']) {
    assert.doesNotMatch(sinComentarios(leer(archivo)), /\b(fontScale|escalaDeLetra|escala)\s*>=?\s*[\d.]+/, `${archivo} compara la escala con un literal`);
  }
  assert.match(sinComentarios(leer('inicio-de-hoy.ts')), /esLetraGrande\(escalaDeLetra\) \|\| ancho < 340 \? 1 : 2/);
});

test('TEST-AV2-008 · las fichas pasan a una columna si un nombre no entra en media tarjeta; con dos, ninguna palabra se parte', () => {
  assert.equal(inicio.columnasDeLasFichas(360, 1, CUATRO_COMIDAS), 2);
  assert.equal(inicio.columnasDeLasFichas(360, ANDROID_115, CUATRO_COMIDAS), 2, '«Desayuno» con ×1,15 todavía entra');
  assert.equal(inicio.columnasDeLasFichas(360, ANDROID_13, CUATRO_COMIDAS), 1);
  assert.equal(inicio.columnasDeLasFichas(360, 1, ['Desayuno', 'Almuerzo', 'Merienda', 'Preentrenamiento']), 1, 'una palabra larga del profesional: una columna');
  assert.equal(inicio.columnasDeLasFichas(360, 1, ['Desayuno', 'Postentreno']), 1, 'en 360 dp no entra');
  assert.equal(inicio.columnasDeLasFichas(412, 1, ['Desayuno', 'Postentreno']), 2, 'en 412 dp, sí');
  assert.equal(inicio.columnasDeLasFichas(360, 1, ['Media mañana', 'Merienda']), 2, 'dos palabras cortas se parten por el espacio');
  // La cuenta es la de Nutrición (`fichasPorFila`), con las medidas de la ficha de Inicio.
  assert.match(sinComentarios(leer('inicio-de-hoy.ts')), /fichasPorFila\(anchoUtilDeInicio\(ancho, true\), nombres, escalaDeLetra, FICHA_DE_INICIO\) >= 2 \? 2 : 1/);
  assert.deepEqual(inicio.FICHA_DE_INICIO, { letra: 16, alrededor: 2 * 12 + 2 * 2 + 20 + 8, separacion: inicio.SEPARACION_EN_INICIO });
  const nutricion = sinComentarios(leer('pantallas/inicio-nutricion.tsx'));
  assert.match(nutricion, /nombre: \{ fontSize: 16, fontWeight: '800'/, 'el nombre en 16 sp, como la cuenta');
  assert.match(nutricion, /ficha: \{ minHeight: 64, padding: 12,/, 'el relleno de 12 de la cuenta');
  assert.match(nutricion, /laQueSigue: \{ borderWidth: 2,/, 'el borde más grueso de la cuenta');
  assert.match(nutricion, /<Icono nombre=\{ICONO_DE_LA_FICHA\[f\.estado\]\} tamano=\{20\}/);
  assert.match(nutricion, /cabezaDeFicha: \{ flexDirection: 'row', alignItems: 'center', gap: 8 \}/);
  // La propiedad: con dos columnas, la palabra más larga entra en la ficha, del ancho que sea y con la letra que sea.
  for (let ancho = 340; ancho <= 480; ancho += 4) {
    for (const escala of [0.85, 1, ANDROID_115, 1.2, ANDROID_13]) {
      for (const nombres of [CUATRO_COMIDAS, ['Colación', 'Postentreno'], ['Preentrenamiento', 'Cena'], ['Media mañana', 'Merienda']]) {
        if (inicio.columnasDeLasFichas(ancho, escala, nombres) !== 2) continue;
        const pide = comidasDeHoy.anchoDeLaPalabraMasLarga(nombres, inicio.FICHA_DE_INICIO.letra, escala) + inicio.FICHA_DE_INICIO.alrededor;
        assert.ok(pide <= inicio.anchoDeCadaColumna(ancho, 2, true), `${ancho} dp ×${escala}: ${nombres.join(', ')} pide ${pide.toFixed(1)} dp`);
      }
    }
  }
  assert.match(nutricion, /const columnas = columnasDeLasFichas\(width, fontScale, comidas \? comidas\.fichas\.map\(\(f\) => f\.nombre\) : \[\]\);/);
  assert.match(nutricion, /const anchoDeFicha = anchoDeCadaColumna\(width, columnas, true\);/);
  // La red: si una palabra igual no entrara, se parte por sílabas y con guion, no en cualquier letra.
  assert.match(nutricion, /<Text style=\{estilosDeFichas\.nombre\} android_hyphenationFrequency="normal">/);
});

test('TEST-AV2-008 · las tarjetas chicas: el ícono arriba si el título no entra al lado, y una columna si tampoco entra arriba', () => {
  // 360 dp con letra ×1: «Mediciones», el título mientras carga, no entra al lado del ícono; arriba, sí.
  assert.deepEqual(inicio.disposicionDeLasTarjetasChicas(360, 1, TITULOS_CHICOS), { columnas: 2, ancho: 156, iconoArriba: true });
  // 412 dp: con la caja del ícono (AV2-T25), arriba, como en la referencia de Dirección; con ×1,15, también.
  assert.deepEqual(inicio.disposicionDeLasTarjetasChicas(412, 1, TITULOS_CHICOS), { columnas: 2, ancho: 182, iconoArriba: true });
  assert.deepEqual(inicio.disposicionDeLasTarjetasChicas(412, ANDROID_115, TITULOS_CHICOS), { columnas: 2, ancho: 182, iconoArriba: true });
  // 360 dp con ×1,15: tampoco entra arriba, y van en una columna, con el ícono al lado.
  assert.deepEqual(inicio.disposicionDeLasTarjetasChicas(360, ANDROID_115, TITULOS_CHICOS), { columnas: 1, ancho: 320, iconoArriba: false });
  assert.equal(inicio.disposicionDeLasTarjetasChicas(360, ANDROID_13, TITULOS_CHICOS).columnas, 1);
  // La propiedad: el título nunca se parte.
  for (let ancho = 340; ancho <= 480; ancho += 4) {
    for (const escala of [1, ANDROID_115, 1.2, ANDROID_13, 1.5, 2]) {
      const d = inicio.disposicionDeLasTarjetasChicas(ancho, escala, TITULOS_CHICOS);
      const interior = d.ancho - 2 * (receta.RELLENO_DE_LA_TARJETA + 1);
      const palabra = comidasDeHoy.anchoDeLaPalabraMasLarga(TITULOS_CHICOS, inicio.LETRA_DEL_TITULO, Math.min(escala, inicio.TOPE_DEL_TITULO));
      assert.ok(palabra <= interior - (d.iconoArriba ? 0 : inicio.ICONO_DEL_TITULO), `${ancho} dp ×${escala}: ${palabra.toFixed(1)} dp en ${interior} dp`);
      assert.equal(d.ancho, inicio.anchoDeCadaColumna(ancho, d.columnas, false));
    }
  }
  // Una medida de nombre largo que no entra al lado lleva su ícono arriba, aunque el par no lo pida.
  assert.equal(inicio.lugarDelIcono(['Peso'], 156, 1), 'al-lado');
  assert.equal(inicio.lugarDelIcono(['Envergadura'], 182, 1.2), 'arriba');
  assert.equal(inicio.lugarDelIcono(['Preentrenamiento'], 156, 1.2), 'no-entra');
  const pantalla = sinComentarios(leer('pantallas/inicio.tsx'));
  assert.match(pantalla, /const chicas = disposicionDeLasTarjetasChicas\(width, fontScale, \[T\.mediciones, T\.actividad\]\);/);
  assert.match(pantalla, /<Mediciones [^>]*ancho=\{chicas\.ancho\} iconoArriba=\{chicas\.iconoArriba\}/);
  assert.match(pantalla, /<ActividadDeEntrenamiento [^>]*ancho=\{chicas\.ancho\} iconoArriba=\{chicas\.iconoArriba\}/);
  for (const archivo of ['pantallas/inicio-mediciones.tsx', 'pantallas/inicio-entrenamiento.tsx']) {
    const codigo = sinComentarios(leer(archivo));
    const chicas = codigo.match(/<TarjetaDeInicio [^>]*ancho=\{ancho\}[^>]*>/g) ?? [];
    assert.ok(chicas.length > 0 && chicas.every((t) => t.includes('iconoArriba={iconoArriba}')), `${archivo}: cada tarjeta chica lleva el ícono donde lo decide el par`);
  }
  // La tarjeta: el título de 19 sp, que crece hasta ×1,5, y la caja del ícono de 32 dp con su separación de 10, como la
  // cuenta (AV2-T25).
  assert.equal(inicio.ICONO_DEL_TITULO, 32 + 10);
  assert.match(leer('icono.tsx'), /export const CAJA_DEL_ICONO = 32;\s*export const SEPARACION_DE_LA_CAJA = 10;/);
  const tarjeta = sinComentarios(leer('pantallas/tarjeta-de-inicio.tsx'));
  assert.equal(inicio.LETRA_DEL_TITULO, 19);
  assert.equal(inicio.TOPE_DEL_TITULO, 1.5);
  assert.match(tarjeta, /titulo: \{ fontSize: 19, fontWeight: '800'/);
  assert.match(tarjeta, /accessibilityRole="header" maxFontSizeMultiplier=\{1\.5\}/);
  assert.match(tarjeta, /cabeza: \{ flexDirection: 'row', alignItems: 'center', gap: SEPARACION_DE_LA_CAJA,/);
  assert.match(tarjeta, /const apilar = iconoArriba \|\| \(ancho !== undefined && lugarDelIcono\(\[titulo\], ancho, fontScale\) !== 'al-lado'\) \|\| alcanzaLaEscala\(fontScale, ESCALA_PARA_APILAR\);/);
  assert.match(tarjeta, /<View style=\{\[estilos\.cabeza, apilar && estilos\.cabezaApilada\]\}>/);
  // La red: si igual no entrara, se parte por sílabas y con guion.
  assert.match(tarjeta, /maxFontSizeMultiplier=\{1\.5\} android_hyphenationFrequency="normal">/);
});

test('TEST-AV2-008 · la tira ocupa la tarjeta entera: el círculo del día y su aro entran en su séptimo, no en el de media tarjeta', () => {
  // El aro de hoy va por fuera del círculo: 2 dp de separación y 2 de aro, de cada lado (TEST-AV2-009).
  assert.deepEqual(inicio.ARO_DE_HOY, { grosor: 2, separacion: 2 });
  const conAro = (lado) => lado + 2 * (inicio.ARO_DE_HOY.grosor + inicio.ARO_DE_HOY.separacion);
  assert.equal(inicio.ladoDelDiaDeLaTira(360, 1), 32, 'a 360 dp, 32 dp y el aro (con media tarjeta eran 17)');
  assert.equal(inicio.ladoDelDiaDeLaTira(412, 1), 34);
  assert.equal(inicio.ladoDelDiaDeLaTira(320, 1), 27, 'en un teléfono angosto, lo que entra en su séptimo');
  assert.equal(inicio.ladoDelDiaDeLaTira(412, ANDROID_13), 40, 'crece con la letra hasta lo que entra');
  for (let ancho = 300; ancho <= 480; ancho += 4) {
    for (const escala of [1, ANDROID_115, ANDROID_13, 2]) {
      assert.ok(conAro(inicio.ladoDelDiaDeLaTira(ancho, escala)) <= Math.floor(inicio.anchoUtilDeInicio(ancho, true) / 7), `${ancho} dp ×${escala}: el círculo y su aro no pasan su columna`);
    }
  }
  assert.match(sinComentarios(leer('pantallas/tira-de-la-semana.tsx')), /const lado = ladoDelDiaDeLaTira\(width, fontScale\);/);
});

test('TEST-AV2-008 · el nombre del día del plan bajo «Comidas», solo con más de un tipo de día', () => {
  const uno = [{ dayTypeId: 'h', label: 'Día habitual' }];
  const dos = [...uno, { dayTypeId: 'e', label: 'Día de entrenamiento' }];
  assert.equal(inicio.nombreDelDiaEnInicio(uno, 'h'), undefined, 'con un solo tipo, no dice «Día habitual»');
  assert.equal(inicio.nombreDelDiaEnInicio(dos, 'e'), 'Día de entrenamiento');
  assert.equal(inicio.nombreDelDiaEnInicio(dos, null), undefined);
  assert.match(leer('pantallas/inicio-nutricion.tsx'), /nombreDelDiaEnInicio\(r\.datos\.data\.dayTypes, r\.datos\.data\.selectedDayTypeId\)/);
});

test('TEST-AV2-008 · la medida de la última toma: el cambio como un dato, sin color ni flecha, y la tarjeta abre su evolución', () => {
  formatoDeInicio.fijarDiaDeReferencia('2026-11-11');
  const medida = (delta, extra = {}) => ({
    nombre: 'Peso',
    actual: { punto: { value: 80.9, unit: 'kg' } },
    anterior: { fecha: '2026-09-02' },
    diferencia: delta === null ? null : { delta, unidad: 'kg', dias: 68 },
    motivoSinAnterior: null,
    ...extra,
  });
  const sinCambio = inicio.medidaDeInicio(medida(0));
  assert.deepEqual([sinCambio.titulo, sinCambio.valor, sinCambio.unidad, sinCambio.cambio], ['Peso', '80,9', 'kg', 'Sin cambio desde el 2 sept']);
  assert.equal(sinCambio.paraLeer, 'Peso, 80,9 kilos, sin cambio desde el 2 de septiembre. Ver la evolución');
  assert.equal(inicio.medidaDeInicio(medida(0.4)).cambio, '+0,4 kg desde el 2 sept');
  assert.equal(inicio.medidaDeInicio(medida(-0.4)).cambio, '−0,4 kg desde el 2 sept');
  assert.equal(inicio.medidaDeInicio(medida(null, { anterior: null, motivoSinAnterior: 'SIN_PREVIA' })).cambio, 'Sin una toma anterior comparable en el período');
  assert.equal(inicio.medidaDeInicio({ ...medida(0), nombre: 'Cintura', actual: { punto: { value: 82, unit: 'cm' } } }).titulo, 'Cintura', 'sin peso, el título es la medida que trae');
  const tarjeta = sinComentarios(leer('pantallas/inicio-mediciones.tsx'));
  assert.doesNotMatch(tarjeta, /16 medidas|resultados? de fórmulas|Ver su evolución|Ver la toma|nombre="(sube|baja)"|tono="(exito|error)"/);
  assert.match(tarjeta, /alTocar=\{\(\) => ir\(\{ nombre: 'mi-evolucion', vista: 'evolucion', metrica: destacada\.metrica \}\)\}/);
});

test('TEST-AV2-008 · Inicio no escribe nada y no tiene porcentajes', () => {
  const todo = ARCHIVOS_DE_INICIO.map((a) => sinComentarios(leer(`pantallas/${a}`))).join('\n');
  assert.doesNotMatch(todo, /api\.(abrir|guardar|registrar|confirmar|corregir|otorgar|revocar|responder|saltear|anular|deshacer)/);
  assert.doesNotMatch(todo, /%/);
});

// ─── TEST-AV2-009 · la tira de la semana (AV2-08) ───────────────────────────────────────────────

/** La lectura de 30 días hasta `hasta`, con lo registrado por día. */
const actividadHasta = (hasta, porDia) => ({ periodo: { desde: '2026-10-13', hasta }, porDia });
const tildes = (t) => t.dias.map((d) => (d.realizada ? '✓' : d.numero)).join(' ');

test('TEST-AV2-009 · de lunes a domingo: la tilde solo con una realizada; una «No realizada», un día sin sesión y uno por venir, neutros', () => {
  // Miércoles 11: el lunes, una realizada; el martes, solo una «No realizada»; hoy, una con desvío (cuenta como realizada).
  const t = inicio.tiraDeLaSemana('2026-11-11', actividadHasta('2026-11-11', { '2026-11-08': { realizadas: 2, noRealizadas: 0 }, '2026-11-09': { realizadas: 1, noRealizadas: 0 }, '2026-11-10': { realizadas: 0, noRealizadas: 1 }, '2026-11-11': { realizadas: 1, noRealizadas: 0 } }), null);
  assert.deepEqual(t.dias.map((d) => d.letra), ['L', 'M', 'M', 'J', 'V', 'S', 'D']);
  assert.deepEqual(t.dias.map((d) => d.fecha), ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
  assert.equal(tildes(t), '✓ 10 ✓ 12 13 14 15', 'el domingo anterior no pasa a esta semana');
  assert.deepEqual(t.dias.map((d) => d.hoy), [false, false, true, false, false, false, false], 'hoy, con el aro');
  assert.equal(t.realizadas, 2);
  assert.equal(t.linea, '2 sesiones realizadas esta semana');
  assert.equal(t.paraLeer, 'Esta semana: lunes y miércoles con sesión realizada. Hoy, miércoles 11');
  assert.deepEqual(Object.keys(t).sort(), ['dias', 'linea', 'paraLeer', 'realizadas'], 'ninguna cuenta de días seguidos');
});

test('TEST-AV2-009 · mientras carga, sin tildes ni ceros; sin ninguna, sin línea; el lunes arranca vacía', () => {
  const cargando = inicio.tiraDeLaSemana('2026-11-11', null, null);
  assert.equal(tildes(cargando), '9 10 11 12 13 14 15');
  assert.deepEqual([cargando.realizadas, cargando.linea], [null, null]);
  assert.equal(cargando.paraLeer, 'Esta semana, de lunes a domingo. Hoy, miércoles 11');
  const nada = inicio.tiraDeLaSemana('2026-11-11', actividadHasta('2026-11-11', { '2026-11-10': { realizadas: 0, noRealizadas: 2 } }), null);
  assert.deepEqual([nada.realizadas, nada.linea], [0, null]);
  assert.doesNotMatch(`${nada.paraLeer} ${nada.linea ?? ''}`, /\b0\b/);
  // El lunes siguiente: lo de la semana pasada no pasa.
  const lunes = inicio.tiraDeLaSemana('2026-11-16', actividadHasta('2026-11-16', { '2026-11-09': { realizadas: 1, noRealizadas: 0 }, '2026-11-15': { realizadas: 1, noRealizadas: 0 } }), null);
  assert.equal(tildes(lunes), '16 17 18 19 20 21 22');
  assert.equal(lunes.linea, null);
  assert.equal(inicio.lunesDeLaSemana('2026-11-15'), '2026-11-09', 'el domingo es de la semana que empezó el lunes');
  assert.equal(inicio.tiraDeLaSemana('2026-11-09', null, null).linea, null);
  assert.equal(inicio.tiraDeLaSemana('2026-11-11', actividadHasta('2026-11-11', { '2026-11-09': { realizadas: 1, noRealizadas: 0 } }), null).linea, '1 sesión realizada esta semana');
});

test('TEST-AV2-009 · hoy se toma de API-TRN-14 solo si la lectura de 30 días quedó un día atrás, sin contarlo dos veces', () => {
  const hoyEnElPlan = inicio.registradasHoySegunElPlan('2026-11-11', [
    { date: '2026-11-11', execution: { state: 'REGISTERED', sessionCondition: 'COMPLETED' } },
    { date: '2026-11-11', execution: { state: 'REGISTERED', sessionCondition: 'NOT_COMPLETED' } },
    { date: '2026-11-11', execution: { state: 'DRAFT_IN_PROGRESS', sessionCondition: null } },
    { date: '2026-11-10', execution: { state: 'REGISTERED', sessionCondition: 'COMPLETED' } },
  ]);
  assert.deepEqual(hoyEnElPlan, { realizadas: 1, noRealizadas: 1 });
  // La lectura terminó ayer: hoy sale de API-TRN-14.
  assert.equal(tildes(inicio.tiraDeLaSemana('2026-11-11', actividadHasta('2026-11-10', {}), hoyEnElPlan)), '9 10 ✓ 12 13 14 15');
  // La lectura ya incluye hoy: manda ella, y no se suma lo de API-TRN-14.
  const incluida = inicio.tiraDeLaSemana('2026-11-11', actividadHasta('2026-11-11', { '2026-11-11': { realizadas: 1, noRealizadas: 0 } }), hoyEnElPlan);
  assert.equal(incluida.realizadas, 1);
});

test('TEST-AV2-009 · la condición que rige después de las correcciones, desde la misma lectura de 30 días', async () => {
  const ejecucion = (id, date, condicion, correcciones = []) => ({
    executionId: id,
    date,
    original: { sessionCondition: condicion },
    corrections: correcciones.map((c, i) => ({ correctionId: `${id}-c${i}`, correction: { sessionCondition: c } })),
    effectiveView: correcciones.length ? { kind: 'CORRECTED', correctionId: `${id}-c${correcciones.length - 1}` } : { kind: 'ORIGINAL' },
  });
  const api = {
    misEjecucionesDeEntrenamiento: async () => ({
      ok: true,
      datos: { data: { period: { start: '2026-10-13', end: '2026-11-11' }, executions: [ejecucion('a', '2026-11-10', 'NOT_COMPLETED', ['COMPLETED']), ejecucion('b', '2026-11-09', 'COMPLETED', ['NOT_COMPLETED'])] } },
    }),
  };
  const r = await lecturasDeInicio.leerActividadDeEntrenamiento(api, 't', { periodStart: '2026-10-13', periodEnd: '2026-11-11' });
  assert.deepEqual(r.datos.porDia, { '2026-11-10': { realizadas: 1, noRealizadas: 0 }, '2026-11-09': { realizadas: 0, noRealizadas: 1 } });
  assert.equal(tildes(inicio.tiraDeLaSemana('2026-11-11', r.datos, null)), '9 ✓ 11 12 13 14 15', 'corregida a realizada, con tilde; corregida a no realizada, neutra');
});

test('TEST-AV2-009 · hoy, también con una sesión realizada: el día lleva la tilde y el aro', () => {
  const t = inicio.tiraDeLaSemana('2026-11-11', actividadHasta('2026-11-11', { '2026-11-11': { realizadas: 1, noRealizadas: 0 } }), null);
  const hoy = t.dias.find((d) => d.hoy);
  assert.deepEqual([hoy.fecha, hoy.realizada, hoy.hoy], ['2026-11-11', true, true]);
  assert.equal(t.paraLeer, 'Esta semana: miércoles con sesión realizada. Hoy, miércoles 11');
});

test('TEST-AV2-009 · el dibujo: una sola etiqueta para el lector, la tilde en «botonTexto» sobre «exito», hoy con un aro neutro por fuera del círculo, nunca rojo', () => {
  const tira = sinComentarios(leer('pantallas/tira-de-la-semana.tsx'));
  assert.match(tira, /<View style=\{\[estilos\.tarjeta, estilo\]\} accessible accessibilityLabel=\{tira\.paraLeer\}>/);
  assert.match(tira, /importantForAccessibility="no-hide-descendants" accessibilityElementsHidden/);
  assert.match(tira, /<Icono nombre="tilde" tamano=\{18\} tono="botonTexto" \/>/);
  assert.match(tira, /realizado: \{ backgroundColor: COLOR\.exito \}/);
  // El aro de hoy envuelve al círculo: su propia vista, con 2 dp de aro y 2 dp de separación del color de la tarjeta, así
  // que se ve también sobre un día con la tilde. No es el borde del círculo, que sobre el verde no se distinguía.
  assert.match(tira, /const forma = formaDelDiaDeLaTira\(lado\);/);
  assert.match(tira, /<View collapsable=\{false\} style=\{\[estilos\.aro, forma\.aro, d\.hoy && estilos\.aroDeHoy\]\}>\s*<View collapsable=\{false\} style=\{\[estilos\.circulo, forma\.circulo, d\.realizada && estilos\.realizado\]\}>/);
  assert.match(tira, /aro: \{ alignItems: 'center', justifyContent: 'center', borderWidth: ARO_DE_HOY\.grosor, padding: ARO_DE_HOY\.separacion, borderColor: 'transparent' \}/);
  assert.match(tira, /circulo: \{ alignItems: 'center', justifyContent: 'center' \}/, 'el círculo no tiene borde');
  // Neutro: la tira no se toca, y en la APK el cian es solo para lo que se toca (GUIA I.6).
  assert.match(tira, /aroDeHoy: \{ borderColor: COLOR\.texto \}/);
  assert.doesNotMatch(tira, /COLOR\.acento/, 'nada en la tira va en el acento');
  assert.doesNotMatch(tira, /COLOR\.(error|peligro)|nombre="(cerrar|aviso|salteada)"/, 'lo no hecho, neutro');
});

test('Hallazgo 11 de la 0.26 · el día de hoy con una sesión es un círculo dentro del aro, no un cuadrado verde que lo pasa', () => {
  // Los estilos que se aplican, en cada ancho y letra: el círculo es redondo entero y entra justo en el aro.
  for (const ancho of [320, 360, 412]) {
    for (const escala of [1, ANDROID_13, 2]) {
      const lado = inicio.ladoDelDiaDeLaTira(ancho, escala);
      const { aro, circulo } = inicio.formaDelDiaDeLaTira(lado);
      assert.deepEqual(circulo, { width: lado, height: lado, borderRadius: lado / 2 }, `${ancho} dp ×${escala}: el círculo`);
      assert.equal(aro.width, aro.height);
      assert.equal(aro.borderRadius, aro.width / 2, `${ancho} dp ×${escala}: el aro`);
      // Adentro del aro van su grosor y la separación de cada lado; lo que queda es exactamente el círculo.
      assert.equal(aro.width - 2 * (inicio.ARO_DE_HOY.grosor + inicio.ARO_DE_HOY.separacion), circulo.width);
      // Un cuadrado del mismo lado pasa el aro por las esquinas: la mitad de su diagonal supera el radio del aro.
      assert.ok((circulo.width * Math.SQRT2) / 2 > aro.width / 2, `${ancho} dp ×${escala}: sin el radio, las esquinas pasan el aro`);
    }
  }
  // La causa: un círculo sin fondo ni borde, solo con tamaño y radio, React Native (Fabric) lo aplana y no crea su vista.
  // Cuando llega la sesión de hoy, Android la crea con lo que cambió (el fondo) y sin el radio. Las dos vistas existen
  // siempre, y lo que se suma al estar hecho es solo el color: nada después del radio lo pisa.
  const tira = sinComentarios(leer('pantallas/tira-de-la-semana.tsx'));
  assert.equal((tira.match(/<View collapsable=\{false\} style=\{\[estilos\.(aro|circulo), forma\.(aro|circulo)/g) ?? []).length, 2);
  assert.match(tira, /\n  realizado: \{ backgroundColor: COLOR\.exito \},/, 'hecho: solo el color');
  assert.match(tira, /\n  aroDeHoy: \{ borderColor: COLOR\.texto \},/, 'hoy: solo el color del aro');
  assert.doesNotMatch(tira, /borderRadius: 0|overflow: 'hidden'/);
});

// ─── TEST-AV2-010 · con una sesión en curso, ninguna otra ofrece empezar (AV2-09) ───────────────

const enCursoMod = await import('../apps/mobile/src/sesion-en-curso.ts');
const { TEXTOS_DE_LA_VUELTA: T_VUELTA } = await import('../apps/mobile/src/textos-de-la-vuelta.ts');
const PIERNAS = { draftId: 'd-piernas', occurrenceId: 'o-piernas', fecha: '2026-11-09', etiqueta: 'Piernas A' };

test('TEST-AV2-010 · con «Piernas A» en curso, «Torso B» no se puede iniciar; sin ninguna, las dos; la misma se retoma', () => {
  assert.equal(enCursoMod.sePuedeIniciar('o-torso', null), true);
  assert.equal(enCursoMod.sePuedeIniciar('o-piernas', null), true);
  assert.equal(enCursoMod.sePuedeIniciar('o-torso', PIERNAS), false);
  assert.equal(enCursoMod.sePuedeIniciar('o-piernas', PIERNAS), true);
});

test('TEST-AV2-010 · «En curso» sale de la corrida abierta: un borrador a medias, sin corrida, no está en curso', () => {
  const borrador = { state: 'DRAFT_IN_PROGRESS', sessionCondition: null };
  assert.deepEqual(enCursoMod.vistaDeLaSesion({ texto: 'En curso' }, borrador, null), { texto: 'Sin registrar', hecha: false, icono: 'sin-registro' });
  assert.deepEqual(enCursoMod.vistaDeLaSesion({ texto: 'En curso' }, borrador, 'en-curso'), { texto: 'En curso', hecha: false, icono: 'reloj' });
  assert.equal(enCursoMod.vistaDeLaSesion({ texto: 'En curso' }, borrador, 'en-pausa').texto, 'En pausa');
  // Lo registrado, como lo dice el dominio; la tilde solo con lo hecho.
  assert.deepEqual(enCursoMod.vistaDeLaSesion({ texto: 'Registrada · Realizada' }, { state: 'REGISTERED', sessionCondition: 'COMPLETED' }, null), { texto: 'Registrada · Realizada', hecha: true, icono: 'guardar' });
  assert.equal(enCursoMod.vistaDeLaSesion({ texto: 'Registrada · No realizada' }, { state: 'REGISTERED', sessionCondition: 'NOT_COMPLETED' }, null).hecha, false);
  // La marcha: la de la API (API-TIE-04); sin ella, la de la corrida del teléfono.
  assert.equal(enCursoMod.marchaDeLaSesionEnCurso({ state: 'PAUSED' }, null), 'en-pausa');
  assert.equal(enCursoMod.marchaDeLaSesionEnCurso({ state: 'IN_PROGRESS' }, null), 'en-curso');
  assert.equal(enCursoMod.marchaDeLaSesionEnCurso(null, { corrida: corrida.CORRIDA_VACIA }), 'en-curso');
});

test('TEST-AV2-010 · el ejercicio y la serie, solo si la corrida es de este teléfono', () => {
  const sesion = { prescriptions: [{ prescriptionId: 'p1', exerciseName: 'Sentadilla goblet' }, { prescriptionId: 'p2', exerciseName: 'Remo' }] };
  assert.equal(enCursoMod.lineaDeLaSerie({ foco: { prescriptionId: 'p1', setIndex: 3 }, sesion }), 'Sentadilla goblet · serie 3');
  assert.equal(enCursoMod.lineaDeLaSerie(null), null, 'de otro teléfono, la línea no va');
  assert.equal(enCursoMod.lineaDeLaSerie({ foco: null, sesion }), null);
});

test('TEST-AV2-010 · Inicio muestra solo la sesión en curso; Entrenamiento no ofrece empezar otra y dice por qué', () => {
  const inicioE = sinComentarios(leer('pantallas/inicio-entrenamiento.tsx'));
  const desde = inicioE.indexOf('else if (ahora) {');
  const rama = inicioE.slice(desde, inicioE.indexOf('} else {', desde));
  assert.ok(desde > 0);
  assert.match(rama, /<SesionEnCursoDeInicio/);
  assert.doesNotMatch(rama, /<SesionDeHoy|yaLaHice|aRegistroRapido/, 'con una en curso, solo esa: ni las otras ni «Ya la hice» (AV2-D4)');
  const tarjeta = inicioE.slice(inicioE.indexOf('function SesionEnCursoDeInicio('), inicioE.indexOf('function SesionDeHoy('));
  assert.match(tarjeta, /<Insignia texto=\{marcha === 'en-pausa' \? T\.enPausa : COPY_ENTRENAMIENTO\.enCurso\} icono="reloj" etiqueta="Estado" \/>/);
  assert.match(tarjeta, /texto=\{T\.continuar\}/);
  assert.match(tarjeta, /\{sesiones > 1 \? <Boton texto=\{T\.verLasSesiones\(sesiones\)\} tipo="enlace" icono="derecha" iconoAlFinal/);
  assert.doesNotMatch(tarjeta, /empezar|iniciarEntrenamiento|hacerlaHoy/i);
  const entrenamiento = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  assert.match(entrenamiento, /bloqueadaPor=\{sePuedeIniciar\(o\.occurrenceId, ahora\) \? null : ahora\}/);
  assert.match(entrenamiento, /bloqueadaPor=\{sePuedeIniciar\(p\.ocurrenciaDeHoy\.occurrenceId, enCurso\) \? null : enCurso\}/);
  assert.match(entrenamiento, /\{sinEmpezar \? null : <Boton texto=\{accion\}/, 'ni «Iniciar entrenamiento»');
  assert.match(entrenamiento, /\{bloqueadaPor \? null : <Boton texto=\{AG\.hacerlaHoy\}/, 'ni «Hacerla hoy»');
  assert.match(entrenamiento, /\{yaLaHice \? <Boton texto=\{TEXTOS_DEL_REGISTRO_RAPIDO\.yaLaHice\}/, '«Ya la hice» sigue en Entrenamiento (AV2-D4)');
  assert.match(entrenamiento, /const otra = otraSesionEnCurso\(o\.occurrenceId/, 'el freno de useAbrirOcurrencia queda como red de seguridad');
  assert.equal(T_VUELTA.hayUnEntrenamientoEnCurso('Piernas A'), 'Hay un entrenamiento en curso: Piernas A. Para iniciar otra, primero continualo o dejalo incompleto.');
});

// ─── TEST-AV2-011 · «la que sigue», anclada en la última registrada hoy (AV2-10) ────────────────

const comidasDeNutricion = await import('../apps/mobile/src/comidas-de-hoy.ts');
const estados = (c) => c.fichas.map((f) => [f.nombre, f.estado, f.texto]);

test('TEST-AV2-011 · con el almuerzo registrado a las 13:10, sigue la merienda; el desayuno queda «Sin registrar» y la cena dice sus opciones', () => {
  const almuerzo = [registroDeHoy('almuerzo', '2026-11-09T13:10:00Z')];
  const c = inicio.comidasDeHoy(diaCon(almuerzo), almuerzo, horaDePrueba);
  assert.deepEqual(estados(c), [
    ['Desayuno', 'sin-registrar', 'Sin registrar'],
    ['Almuerzo', 'registrada', '13:10'],
    ['Merienda', 'la-que-sigue', 'Registrar'],
    ['Cena', 'por-venir', '3 opciones'],
  ]);
  assert.deepEqual(c.fichas.map((f) => f.paraLeer), ['Desayuno, sin registrar', 'Almuerzo, registrado a las 13:10', 'Merienda, registrar', 'Cena, 3 opciones']);
  assert.deepEqual(c.fichas.map((f) => inicio.ICONO_DE_LA_FICHA[f.estado]), ['sin-registro', 'tilde', 'mas', 'opciones'], 'el ícono dice el estado, no la comida');
  // Nutrición abre en la misma: «la que sigue» es una sola función.
  assert.equal(comidasDeNutricion.comidaQueSeMuestra(diaCon(almuerzo).meals, almuerzo, null), 'merienda');
  assert.equal(comidasDeNutricion.laQueSigueEnElPlan(diaCon(almuerzo).meals, almuerzo), 'merienda');
});

test('TEST-AV2-011 · manda el orden del plan, no la hora; con la última del plan registrada, ninguna destacada; sin nada, la primera', () => {
  // La merienda registrada a las 10 y el desayuno a las 15: la que va más adelante en el plan es la merienda.
  const fueraDeOrden = [registroDeHoy('merienda', '2026-11-09T10:00:00Z'), registroDeHoy('desayuno', '2026-11-09T15:00:00Z')];
  assert.equal(inicio.laQueSigue(inicio.comidasDeHoy(diaCon(fueraDeOrden), fueraDeOrden, horaDePrueba)).nombre, 'Cena');
  const cena = [registroDeHoy('cena', '2026-11-09T21:00:00Z')];
  const conCena = inicio.comidasDeHoy(diaCon(cena), cena, horaDePrueba);
  assert.equal(inicio.laQueSigue(conCena), null);
  assert.deepEqual(conCena.fichas.map((f) => f.estado), ['sin-registrar', 'sin-registrar', 'sin-registrar', 'registrada']);
  const nada = inicio.comidasDeHoy(diaCon([]), [], horaDePrueba);
  assert.deepEqual(nada.fichas.map((f) => f.estado), ['la-que-sigue', 'por-venir', 'por-venir', 'por-venir']);
  // Ningún texto juzga lo que falta.
  for (const caso of [fueraDeOrden, cena, []]) {
    for (const f of inicio.comidasDeHoy(diaCon(caso), caso, horaDePrueba).fichas) assert.doesNotMatch(`${f.texto} ${f.paraLeer}`, /salteaste|pendiente|te falt|atrasad/i);
  }
});

// ─── TEST-AV2-014 · la comida diferente cuenta en Inicio, como en Nutrición (AV2-13) ────────────

test('TEST-AV2-014 · una comida diferente ocupa su comida y no es «fuera del plan»; lo anulado no cuenta', () => {
  const registros = [
    registroDeHoy('almuerzo', '2026-11-09T13:10:00Z', 'DIFFERENT'),
    registroDeHoy(null, '2026-11-09T17:00:00Z', 'DIFFERENT'),
    registroDeHoy('merienda', '2026-11-09T18:00:00Z', 'PLAN_OPTION', { anulado: true }),
  ];
  const c = inicio.comidasDeHoy(diaCon(registros), registros, horaDePrueba);
  assert.deepEqual(estados(c)[1], ['Almuerzo', 'registrada', '13:10'], 'la comida diferente, registrada con su hora');
  assert.equal(c.fichas[1].recordId, 'r-almuerzo');
  assert.equal(c.fueraDelPlan, 1, 'fuera del plan, solo lo que no ocupa ninguna comida');
  assert.equal(c.fichas[2].estado, 'la-que-sigue', 'la merienda anulada queda libre');
});

test('TEST-AV2-014 · Inicio lee API-ING-01 con la misma lectura y la misma clave que Nutrición, y ya no API-NUT-14', () => {
  const tarjeta = sinComentarios(leer('pantallas/inicio-nutricion.tsx'));
  assert.match(tarjeta, /useLecturaDeHoyConOpciones\(token, sesionPerdida\)/);
  assert.doesNotMatch(tarjeta, /hoyNutricional|registeredIntake|HoyResponse\b/, 'sin API-NUT-14');
  assert.match(tarjeta, /comidasDeHoy\(\{ meals: hoy\.meals \}, hoy\.records, hora\)/);
  const nutricion = leer('pantallas/nutricion-hoy.tsx');
  assert.match(nutricion, /export function useHoyConOpciones\(token: string, salir: \(m: Salida\) => void\) \{\s*const sesionPerdida = useSesionPerdida\(salir\);\s*return \{ \.\.\.useLecturaDeHoyConOpciones\(token, sesionPerdida\), sesionPerdida \};/);
  assert.match(nutricion, /useLecturaRecordada\(token, `hoy-con-opciones:\$\{hoyDeLaApi\}:\$\{diaTipo \?\? ''\}`, pedir, sesionPerdida\)/);
});

// ─── TEST-AV2-015 · tocar una ficha abre esa comida (AV2-14) ────────────────────────────────────

test('TEST-AV2-015 · la ruta de una ficha lleva su comida; una registrada abre su registro', () => {
  for (const estado of ['la-que-sigue', 'sin-registrar', 'por-venir']) {
    assert.deepEqual(inicio.rutaDeLaFicha({ mealId: 'merienda', estado, recordId: null }), { nombre: 'hoy', accion: 'registrar', comida: 'merienda' }, estado);
  }
  assert.deepEqual(inicio.rutaDeLaFicha({ mealId: 'almuerzo', estado: 'registrada', recordId: 'r-almuerzo' }), { nombre: 'registro-nutricional', id: 'r-almuerzo' });
  // Navegar desde Inicio conserva la comida; volver desde un detalle de Nutrición no repite el pedido.
  const ruta = inicio.rutaDeLaFicha({ mealId: 'merienda', estado: 'la-que-sigue', recordId: null });
  const enHoy = nav.navegar({ nombre: 'inicio' }, ruta);
  assert.deepEqual(enHoy, ruta);
  assert.deepEqual(nav.anterior(nav.navegar(enHoy, { nombre: 'plan-actual' })), { nombre: 'hoy' });
});

test('TEST-AV2-015 · Nutrición toma la comida pedida como la elegida, si está en el plan', () => {
  const meals = diaCon([]).meals;
  assert.equal(comidasDeNutricion.comidaPedidaOElegida('merienda', 'desayuno', meals), 'merienda', 'la pedida gana a la recordada');
  assert.equal(comidasDeNutricion.comidaPedidaOElegida('de-otro-plan', 'desayuno', meals), 'desayuno');
  assert.equal(comidasDeNutricion.comidaPedidaOElegida(null, 'desayuno', meals), 'desayuno');
  assert.match(sinComentarios(readFileSync(join(RAIZ, 'apps/mobile/App.tsx'), 'utf8')), /accion=\{ruta\.accion\} comida=\{ruta\.comida\}/);
  assert.match(leer('pantallas/nutricion.tsx'), /accion=\{pedido\.current\} comida=\{comidaPedida\.current\}/);
  const nutricion = leer('pantallas/nutricion-hoy.tsx');
  assert.match(nutricion, /const elegidaAhora = comidaPedidaOElegida\(pedida\.current, elegida, hoy\.meals\);/);
  assert.match(nutricion, /comidaQueSeMuestra\(hoy\.meals, registros, elegidaAhora\)/);
  assert.match(leer('pantallas/inicio-nutricion.tsx'), /abrir=\{\(\) => ir\(rutaDeLaFicha\(f\)\)\}/);
});

// ─── TEST-AV2-016 · las fechas en tres formas y la hora en 24 h (AV2-15) ────────────────────────

const formato = await import('../apps/mobile/src/formato.ts');
const ZONA = 'America/Argentina/Buenos_Aires';

test('TEST-AV2-016 · el título del día, sin coma; la fecha en un texto, con el año solo si es otro', () => {
  assert.equal(formato.fechaLarga('2026-11-09'), 'Lunes 9 de noviembre');
  assert.equal(formato.fechaLarga('2026-10-04'), 'Domingo 4 de octubre');
  assert.equal(formato.fechaLarga('2026-11-11'), 'Miércoles 11 de noviembre');
  assert.equal(formato.fechaCivil('2026-11-09', '2026-11-11'), '9 nov');
  assert.equal(formato.fechaCivil('2025-09-02', '2026-11-11'), '2 sept 2025');
  assert.equal(formato.fechaCivil('2027-01-01', '2026-12-31'), '1 ene 2027');
  assert.equal(formato.fechaCorta('2025-09-02'), '2 sept', 'la corta, siempre sin año');
  // Sin referencia explícita, el año del día de la API que fijó `useDiaDeLaApi`.
  formato.fijarDiaDeReferencia('2026-11-11');
  assert.equal(formato.fechaCivil('2026-09-02'), '2 sept');
  assert.equal(formato.fechaCivil('2025-09-02'), '2 sept 2025');
  assert.deepEqual(['2026-09-02', '2025-09-02'].map(formato.fechaCivil), ['2 sept', '2 sept 2025'], 'usada en un map, el índice no es la referencia');
});

test('TEST-AV2-016 · la hora de 24 h y el instante «9 nov · 13:10», con la zona fija; nunca «p. m.»', () => {
  formato.fijarDiaDeReferencia('2026-11-11');
  assert.equal(formato.hora('2026-11-09T16:10:00.000Z', ZONA), '13:10');
  assert.equal(formato.hora('2026-11-10T03:05:00.000Z', ZONA), '00:05', 'la medianoche');
  assert.equal(formato.hora('2026-11-09T11:40:00.000Z', ZONA), '08:40');
  assert.equal(formato.fecha('2026-11-09T16:10:00.000Z', ZONA), '9 nov · 13:10');
  assert.equal(formato.dia('2026-11-09T16:10:00.000Z', ZONA), '9 nov');
  assert.equal(formato.dia('2025-09-02T16:10:00.000Z', ZONA), '2 sept 2025');
  // A las 22:30 de Buenos Aires ya es el día siguiente en UTC: el día es el de la persona.
  assert.equal(formato.fecha('2026-11-10T01:30:00.000Z', ZONA), '9 nov · 22:30');
  for (let h = 0; h < 24; h++) {
    const iso = `2026-11-09T${String(h).padStart(2, '0')}:15:00.000Z`;
    assert.match(formato.hora(iso, ZONA), /^([01]\d|2[0-3]):15$/, iso);
    assert.doesNotMatch(formato.fecha(iso, ZONA), /m\.|AM|PM/i, iso);
  }
});

// ─── TEST-AV2-023 · las medidas medidas, con un decimal y sin redondear (AV2-25) ────────────────

test('TEST-AV2-023 · «39» se lee «39,0 cm», y «58,8» y «58,75» quedan igual: completa con cero y nunca redondea', () => {
  assert.equal(formato.valorConUnDecimal(39), '39,0');
  assert.equal(formato.valorConUnDecimal(58.8), '58,8');
  assert.equal(formato.valorConUnDecimal(58.75), '58,75', 'nunca redondea a un decimal');
  assert.equal(formato.valorConUnDecimal(1203), '1.203,0');
  assert.equal(formato.valorConUnDecimal(Number.NaN), '—');
  assert.deepEqual([formato.medidaConUnDecimal(39, 'cm'), formato.medidaConUnDecimal(58.8, 'cm'), formato.medidaConUnDecimal(12, 'mm')], ['39,0 cm', '58,8 cm', '12,0 mm']);
  assert.equal(formato.medidaConUnDecimal(0.85, 'adimensional'), '0,85', 'sin dimensión, el número como viene');
  // Inicio: la medida medida, con un decimal; un resultado de fórmula, con su precisión.
  const cintura = { nombre: 'Cintura', actual: { punto: { value: 82, unit: 'cm' } }, anterior: null, diferencia: null, motivoSinAnterior: 'SIN_PREVIA' };
  assert.equal(inicio.medidaDeInicio(cintura).valor, '82,0');
  assert.equal(inicio.medidaDeInicio(cintura, false).valor, '82');
  assert.match(sinComentarios(leer('pantallas/inicio-mediciones.tsx')), /medidaDeInicio\(destacada, toma!\.medidas\.includes\(destacada\)\)/);
  // La figura, la lista de la toma y el detalle del sitio escriben la medida con el mismo formateador.
  assert.match(sinComentarios(leer('composicion-de-la-figura.ts')), /valor: medidaConUnDecimal\(medida\.actual\.punto\.value, medida\.actual\.punto\.unit\)/);
  assert.match(sinComentarios(leer('pantallas/antropometria.tsx')), /const valor = medidaConUnDecimal\(medida\.actual\.punto\.value, medida\.actual\.punto\.unit\);/);
  assert.match(sinComentarios(leer('pantallas/figura-de-la-toma.tsx')), /\$\{rotulo\}: \$\{medidaConUnDecimal\(medida\.actual\.punto\.value, medida\.actual\.punto\.unit\)\}/);
});

// ─── TEST-AV2-020 · Tu historial: el período a la vista y una acción por fila (AV2-22) ──────────

const historialEnFilas = await import('../apps/mobile/src/historial-en-filas.ts');

test('TEST-AV2-020 · Tu historial dice su período, y cada sesión es una fila que se toca entera, con la tilde solo en lo hecho', () => {
  formato.fijarDiaDeReferencia('2026-11-11');
  const sesion = (sessionCondition, extra = {}) => ({
    executionId: 'e1',
    date: '2026-11-09',
    plannedSession: { label: 'Piernas A' },
    effectiveView: { kind: 'ORIGINAL' },
    corrections: [],
    original: { sessionCondition, granularity: 'EXERCISE_OR_SESSION', exercises: [] },
    ...extra,
  });
  const realizada = historialEnFilas.filaDeSesion(sesion('COMPLETED'));
  assert.deepEqual([realizada.titulo, realizada.fecha, realizada.estado, realizada.hecha], ['Piernas A', '9 nov', 'Realizada', true]);
  assert.match(realizada.paraLeer, /^Piernas A, 9 de noviembre, realizada\. .*Ver la sesión$/);
  // Con desvío también es lo hecho, y se dice en palabras; una no realizada queda neutra, sin tilde ni detalle.
  const conDesvio = historialEnFilas.filaDeSesion(sesion('COMPLETED_WITH_DEVIATION'));
  assert.deepEqual([conDesvio.estado, conDesvio.hecha], ['Realizada con desvío', true]);
  const noRealizada = historialEnFilas.filaDeSesion(sesion('NOT_COMPLETED'));
  assert.deepEqual([noRealizada.estado, noRealizada.hecha, noRealizada.detalle], ['No realizada', false, null]);
  assert.equal(noRealizada.paraLeer, 'Piernas A, 9 de noviembre, no realizada. Ver la sesión');
  // Rige la corrección vigente, y «Corregida» va en el detalle, en una línea.
  const corregida = historialEnFilas.filaDeSesion(
    sesion('NOT_COMPLETED', { effectiveView: { kind: 'CORRECTED', correctionId: 'c1' }, corrections: [{ correctionId: 'c1', correction: { sessionCondition: 'COMPLETED', granularity: 'EXERCISE_OR_SESSION', exercises: [] } }] }),
  );
  assert.equal(corregida.hecha, true);
  assert.match(corregida.detalle, / · Corregida$/);
  const plan = historialEnFilas.filaDePlan({ professional: { displayName: 'Lucía Pérez' }, activatedAt: null, isEffective: true });
  assert.deepEqual([plan.estado, plan.hecha, plan.paraLeer], ['Vigente', false, 'Lucía Pérez, vigente. Ver el plan']);
  // La pantalla: el período a la vista, ningún botón por fila y la ventana de la lista con la misma constante.
  assert.equal(historialEnFilas.TEXTOS_DEL_HISTORIAL.periodo, 'Últimos 90 días');
  const pantalla = sinComentarios(leer('pantallas/historial.tsx'));
  assert.match(pantalla, /<Text style=\{estilos\.periodo\}>\{TEXTOS_DEL_HISTORIAL\.periodo\}<\/Text>/);
  assert.match(pantalla, /ultimosDiasEnZona\(DIAS_DEL_HISTORIAL, ZONA_DEL_HISTORIAL\)/);
  const contenido = pantalla.slice(pantalla.indexOf('export function ContenidoDelHistorial'), pantalla.indexOf('function FilaQueAbreElHistorial'));
  assert.doesNotMatch(contenido, /verLaSesion|verElPlan|<Tarjeta/, 'una sola acción por fila: la fila entera');
  assert.equal((contenido.match(/<FilaQueAbreElHistorial /g) ?? []).length, 2, 'las sesiones y los planes, con el mismo trato');
});

// ─── TEST-AV2-018 · Evolución: «Figura» a la vista y las tomas por su fecha (AV2-20) ────────────

const nombresDeLasTomas = await import('../apps/mobile/src/nombres-de-las-tomas.ts');

test('TEST-AV2-018 · las tomas se nombran por su fecha, nunca «T1»; dos del mismo día, por su orden', () => {
  const tomas = [
    { evaluacionId: 'a', etiqueta: 'T1', fecha: '2026-09-02' },
    { evaluacionId: 'b', etiqueta: 'T2', fecha: '2026-11-09' },
    { evaluacionId: 'c', etiqueta: 'T3', fecha: '2026-11-09' },
  ];
  assert.deepEqual(
    nombresDeLasTomas.conNombresPorFecha(tomas).map((t) => [t.evaluacionId, t.etiqueta]),
    [
      ['a', '2 sept'],
      ['b', '9 nov (1)'],
      ['c', '9 nov (2)'],
    ],
  );
  assert.deepEqual(nombresDeLasTomas.conNombresPorFecha(tomas.slice(0, 2)).map((t) => t.etiqueta), ['2 sept', '9 nov']);
  // Ninguna pantalla de Evolución muestra «T1»: las tomas salen de `conNombresPorFecha`, en la pantalla y en la serie.
  const antropometria = sinComentarios(leer('pantallas/antropometria.tsx'));
  assert.match(antropometria, /useMemo\(\(\) => conNombresPorFecha\(tomasDelPeriodo\(datos\)\), \[datos\]\)/);
  assert.match(sinComentarios(leer('serie-de-la-medida.ts')), /conNombresPorFecha\(tomasDelPeriodo\(datos\)\)/);
  assert.doesNotMatch(antropometria, /\bT\d\b|`Toma \$\{/);
  assert.doesNotMatch(antropometria, /\$\{numero\(enLaFigura\.length\)\} medidas/, 'sin «16 medidas» en «La figura, en lista»');
});

test('TEST-AV2-018 · «Figura: Hombre | Mujer» arriba, en la fila de controles, con el rótulo a la vista, en el mapa y en Progreso', () => {
  const figura = sinComentarios(leer('pantallas/figura-de-la-toma.tsx'));
  const controles = figura.indexOf('<ControlesDeLaFigura>');
  const lamina = figura.indexOf('backgroundColor: lamina.fondo');
  assert.ok(controles > 0 && controles < lamina, 'los controles van arriba de la lámina');
  assert.ok(figura.indexOf('<ElegirLaFigura sexo={sexo} alElegir={setSexo} />') > controles && figura.indexOf('<ElegirLaFigura sexo={sexo} alElegir={setSexo} />') < lamina, 'la figura, en la fila');
  assert.equal((figura.match(/<ElegirLaFigura /g) ?? []).length, 1, 'y no al pie');
  assert.match(figura, /\{`\$\{COPY_ANTROPOMETRIA\.figura\}:`\}/, 'el rótulo «Figura:» a la vista');
  const progreso = sinComentarios(leer('pantallas/progreso.tsx'));
  const fila = progreso.slice(progreso.indexOf('<ControlesDeLaFigura>'), progreso.indexOf('</ControlesDeLaFigura>'));
  assert.match(fila, /<ElegirLaFigura sexo=\{sexo\} alElegir=\{setSexo\} \/>/);
  assert.equal((progreso.match(/<ElegirLaFigura /g) ?? []).length, 1);
});

// ═══ WP-APP-VUELTA-2, etapa B: la sesión de entrenamiento, con lo que encontró Dirección en la 0.25 (AV2-30 a AV2-38) ═══

const seriesDeLaSesion = await import('../apps/mobile/src/series-de-la-sesion.ts');
/** Sentadilla con el plan entero: 8 repeticiones con 60 kg. */
const CON_CARGA = { repetitions: { value: 8 }, suggestedLoad: { value: 60, unit: 'kg' }, rir: 2, restSeconds: 90 };
/** Un rango sin carga sugerida: tildar sin escribir no elige un número (el caso de la revisión de la etapa B). */
const RANGO_SIN_CARGA = { repetitions: { min: 10, max: 12 }, suggestedLoad: null, rir: null, restSeconds: 90 };

/**
 * La sesión de Piernas A con la fila fija, como la usó Dirección en la 0.25: cuatro series de Sentadilla, las dos
 * primeras registradas. `tocarElMedio` hace lo que hace la pantalla con el toque (`queHaceElMedio` y `tildar`), con el
 * `serieAlTildar` real, los estados reales de la fila (`EstadoDeFila`) y lo escrito: con la serie cronometrándose,
 * primero decide `alTerminarLaSerie` (antes de cerrar nada); si falta un dato, para solo el reloj y la fila pasa a
 * «Registrar serie N»; si se puede, cierra el reloj, empieza el descanso y la registra.
 */
function sesionConLaFila(registradas = [1, 2], objetivo = CON_CARGA) {
  const s = sesionDePrueba();
  const estados = new Map([1, 2, 3, 4].map((i) => [i, registradas.includes(i) ? 'pendiente-de-enviar' : 'sin-registrar']));
  const escritas = new Map();
  let porRegistrar = null;
  const filas = () => [1, 2, 3, 4].map((setIndex) => ({ setIndex, estado: estados.get(setIndex) }));
  const fila = () =>
    descanso.filaDeAcciones({
      pausada: false,
      abierta: s.estado().medicionAbierta,
      prescriptionId: 'pA',
      siguienteSinRegistrar: filas().find((f) => f.estado === 'sin-registrar')?.setIndex ?? null,
      haySiguienteEjercicio: true,
      porRegistrar: porRegistrar && estados.get(porRegistrar.setIndex) === 'sin-registrar' ? porRegistrar : null,
    });
  const tildar = (i) => {
    const abierta = s.estado().medicionAbierta;
    const auto = descanso.accionAlTildar(s.estado(), AUTO, { prescriptionId: 'pA', setIndex: i, ultimaDelEjercicio: i === 4 });
    let escrita = escritas.get(i) ?? seriesDeLaSesion.FILA_VACIA;
    let r = null;
    if (abierta?.kind === 'SET' && abierta.setIndex === i) {
      const plan = seriesDeLaSesion.alTerminarLaSerie(escrita, objetivo, i, 'kg', s.vivo().medicionAbierta?.ms ?? null);
      if (plan.tipo === 'medicion-larga') return { plan, r: null };
      if (plan.tipo === 'falta-un-dato') {
        r = s.hacer({ tipo: 'finalizar-serie' });
        porRegistrar = { setIndex: i, nota: plan.anuncio };
        return { plan, r };
      }
      r = auto ? s.hacer(auto) : s.hacer({ tipo: 'finalizar-serie' });
      const medida = calcularTiempos(s.eventos(), () => 90).timedSets.filter((x) => x.setIndex === i && x.finishedAt !== null).pop();
      escrita = { ...escrita, tiempo: seriesDeLaSesion.textoDeTiempo(Math.round(medida.duration.ms / 1000)) };
    }
    const lectura = seriesDeLaSesion.serieAlTildar(escrita, objetivo, i, 'kg');
    if (!lectura.ok) return { plan: { tipo: 'falta-un-dato', errores: lectura.errores }, r };
    estados.set(i, 'pendiente-de-enviar');
    porRegistrar = null;
    if (r === null && auto) r = s.hacer(auto);
    return { plan: { tipo: 'registrar' }, r, serie: lectura.serie };
  };
  const tocarElMedio = () => {
    const toque = descanso.queHaceElMedio(fila().medio, filas());
    if (toque.tipo === 'cronometrar') return { plan: null, r: s.hacer(descanso.accionDeEmpezarSerie('pA', toque.setIndex)) };
    if (toque.tipo === 'parar-el-reloj') return { plan: null, r: s.hacer({ tipo: 'finalizar-serie' }) };
    return tildar(toque.setIndex);
  };
  const escribir = (i, campo, texto) => escritas.set(i, { ...(escritas.get(i) ?? seriesDeLaSesion.FILA_VACIA), [campo]: texto });
  return { ...s, fila, filas, tocarElMedio, escribir };
}
const registradasDe = (s) => s.filas().filter((f) => f.estado !== 'sin-registrar').map((f) => f.setIndex);

test('TEST-AV2-028 · «Terminar serie 3» tilda la serie 3, empieza su descanso y la fila pasa a «Empezar serie 4» (el hallazgo de la 0.25)', () => {
  const s = sesionConLaFila();
  assert.equal(s.fila().medio.texto, 'Empezar serie 3');
  s.tocarElMedio();
  assert.equal(s.fila().medio.texto, 'Terminar serie 3');
  s.avanzar(40);
  const { r, serie } = s.tocarElMedio();
  assert.deepEqual(registradasDe(s), [1, 2, 3], 'la serie 3 quedó registrada');
  assert.deepEqual(serie, { setIndex: 3, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 2, perceivedExertion: null, recordedAs: 'AS_PLANNED', durationSeconds: 40 }, 'con lo planificado y el tiempo medido');
  assert.deepEqual(r.eventos.map((e) => [e.type, e.setIndex ?? null]), [['SET_TIMING_FINISHED', null], ['REST_STARTED', 3]], 'una sola acción: cierra el reloj y empieza el descanso');
  assert.equal(s.fila().medio.texto, 'Empezar serie 4', 'pasa a la siguiente, no vuelve a «Empezar serie 3»');
  // La última del ejercicio: se tilda, no arranca descanso (AVD-3) y no queda nada que empezar.
  s.avanzar(90);
  s.tocarElMedio();
  s.avanzar(35);
  const ultima = s.tocarElMedio();
  assert.deepEqual(ultima.r.eventos.map((e) => e.type), ['SET_TIMING_FINISHED']);
  assert.deepEqual(registradasDe(s), [1, 2, 3, 4]);
  assert.equal(s.fila().medio, null, 'todas registradas');
  const tiempos = calcularTiempos(s.eventos(), () => 90);
  assert.deepEqual(tiempos.timedSets.map((x) => [x.setIndex, x.duration.ms]), [[3, 40_000], [4, 35_000]], 'cada serie con su tiempo medido, sin volver a cero');
});

test('TEST-AV2-028 · un rango sin carga y sin nada escrito: «Terminar» para solo el reloj, sin descanso, y la fila dice «Registrar serie 3» con lo que falta', () => {
  const s = sesionConLaFila([1, 2], RANGO_SIN_CARGA);
  s.tocarElMedio();
  s.avanzar(40);
  const { plan, r } = s.tocarElMedio();
  assert.equal(plan.tipo, 'falta-un-dato');
  assert.deepEqual(r.eventos.map((e) => e.type), ['SET_TIMING_FINISHED'], 'solo el reloj: ningún descanso corre con la serie sin registrar');
  assert.equal(s.estado().medicionAbierta, null);
  assert.deepEqual(registradasDe(s), [1, 2], 'la serie 3 sigue sin registrar');
  const f = s.fila();
  assert.deepEqual(f.medio, { tipo: 'registrar-serie', setIndex: 3, texto: 'Registrar serie 3' }, 'no vuelve a «Empezar serie 3»');
  assert.equal(f.nota, 'Para registrar la serie 3, escribí cuántas repeticiones hiciste (10–12) o la carga.', 'el motivo, junto al botón');
  assert.equal(plan.anuncio, f.nota, 'lo mismo que se anuncia');
  // Sin escribir, «Registrar serie 3» sigue sin poder: no cambia nada.
  assert.equal(s.tocarElMedio().plan.tipo, 'falta-un-dato');
  assert.deepEqual(registradasDe(s), [1, 2]);
  // Con las repeticiones escritas, se registra con el tiempo medido y empieza el descanso de la serie 3.
  s.escribir(3, 'repeticiones', '11');
  s.escribir(3, 'tiempo', '00:40');
  const listo = s.tocarElMedio();
  assert.equal(listo.serie.completedRepetitions, 11);
  assert.equal(listo.serie.durationSeconds, 40);
  assert.deepEqual(listo.r.eventos.map((e) => [e.type, e.setIndex ?? null]), [['REST_STARTED', 3]]);
  assert.equal(s.fila().medio.texto, 'Empezar serie 4');
  assert.equal(s.fila().nota, null);
});

test('TEST-AV2-028 · una medición de más de diez horas (la sesión del 8 nov): no se escribe en la fila; se resuelve con su diálogo', () => {
  const s = sesionConLaFila();
  s.tocarElMedio();
  s.avanzar(87 * 3600);
  const { plan, r } = s.tocarElMedio();
  assert.deepEqual(plan, { tipo: 'medicion-larga', anuncio: 'La serie 3 se está midiendo desde hace más de 10 horas: decidí si terminó ahora o si queda incompleta.' });
  assert.equal(r, null, 'no se cerró nada ni empezó un descanso');
  assert.equal(s.estado().medicionAbierta.kind, 'SET');
  assert.deepEqual(registradasDe(s), [1, 2]);
  // Justo en el máximo, todavía es una serie medida.
  assert.equal(seriesDeLaSesion.alTerminarLaSerie(seriesDeLaSesion.FILA_VACIA, CON_CARGA, 3, 'kg', seriesDeLaSesion.MAXIMO_DE_SEGUNDOS * 1000).tipo, 'registrar');
  // En la pantalla: se valida antes de cerrar; la larga se pregunta con el diálogo de la medición.
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  const tildar = PANTALLA.slice(PANTALLA.indexOf('function tildar('), PANTALLA.indexOf('function pasarA('));
  assert.ok(tildar.indexOf('alTerminarLaSerie(') < tildar.indexOf('pararElReloj(abierta, descansoAuto'), 'se valida antes de cerrar el reloj y empezar el descanso');
  assert.match(tildar, /plan\.tipo === 'medicion-larga'[\s\S]{0,400}preguntarPorLaMedicionLarga\(/);
  assert.match(tildar, /plan\.tipo === 'falta-un-dato'[\s\S]{0,300}pararElReloj\(abierta\);[\s\S]{0,400}announceForAccessibility\(plan\.anuncio\)/);
});

test('TEST-AV2-028 · con la serie ya registrada, «Terminar serie N» solo para el reloj: no la destilda', () => {
  assert.deepEqual(descanso.queHaceElMedio({ tipo: 'terminar-serie', setIndex: 2, texto: '' }, [{ setIndex: 2, estado: 'guardada' }]), { tipo: 'parar-el-reloj', setIndex: 2 });
  assert.deepEqual(descanso.queHaceElMedio({ tipo: 'empezar-serie', setIndex: 3, texto: '' }, []), { tipo: 'cronometrar', setIndex: 3 });
  assert.deepEqual(descanso.queHaceElMedio({ tipo: 'registrar-serie', setIndex: 3, texto: '' }, [{ setIndex: 3, estado: 'sin-registrar' }]), { tipo: 'tildar', setIndex: 3 });
  // La pantalla manda «tildar» a la casilla de la fila, la misma que se toca a mano.
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  assert.match(PANTALLA, /queHaceElMedio\(/);
  assert.match(PANTALLA, /toque\.tipo === 'tildar'[\s\S]{0,200}tildar\(/);
  // La nota va junto al botón, en la fila fija, y el lector de pantalla la lee con el botón.
  const FILA = sinComentarios(leer('fila-fija.tsx'));
  assert.match(FILA, /\{datos\.nota \? \(\s*<Text style=\{estilos\.nota\} accessibilityLiveRegion="polite">/);
  assert.match(FILA, /accessibilityLabel=\{\[datos\.medio\.texto, datos\.motivo \?\? datos\.nota\]/);
});

const cierre = await import('../apps/mobile/src/cierre-de-la-sesion.ts');
const franja = await import('../apps/mobile/src/franja-de-la-sesion.ts');
const explicacionDeLosTiempos = await import('../apps/mobile/src/explicacion-de-los-tiempos.ts');
const ejercicioDelResumen = (planificadas, sinRegistrar = [], extra = {}) => ({ prescriptionId: 'pA', nombre: 'Sentadilla', ejecutado: null, registradas: planificadas - sinRegistrar.length, planificadas, sinRegistrar, escritas: [], ...extra });
const ZONA_DE_PRUEBA = 'America/Argentina/Buenos_Aires';

test('TEST-AV2-029 · el motivo para no finalizar se dice junto al botón, en el orden en que se resuelve; sin motivo, se puede', () => {
  const base = { condicion: 'COMPLETED', medicionAbierta: false, escritasSinRegistrar: false, faltaLaHora: false };
  assert.equal(cierre.motivoParaNoFinalizar(base), null);
  assert.equal(cierre.motivoParaNoFinalizar({ ...base, condicion: null }), 'Para finalizar, elegí cómo resultó la sesión.');
  assert.equal(cierre.motivoParaNoFinalizar({ ...base, condicion: null, escritasSinRegistrar: true }), 'Para finalizar, registrá o descartá lo escrito sin registrar.');
  assert.equal(cierre.motivoParaNoFinalizar({ ...base, condicion: null, escritasSinRegistrar: true, medicionAbierta: true }), 'Para finalizar, resolvé la medición abierta.');
  assert.equal(cierre.motivoParaNoFinalizar({ ...base, faltaLaHora: true }), 'Para finalizar, indicá a qué hora la hiciste.');
  // En la pantalla: el aviso va después del estado del envío y antes del botón, y el botón se deshabilita con el motivo.
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  const hoja = PANTALLA.slice(PANTALLA.indexOf('if (finalizando) {'), PANTALLA.indexOf('const bases = basesDeLaPrescripcion(p);'));
  assert.ok(hoja.indexOf('{aviso ?') > hoja.indexOf('{estadoDelEnvio}') && hoja.indexOf('{aviso ?') < hoja.indexOf('texto={e.finalizarEntrenamiento}'), 'el aviso, junto al botón');
  assert.match(hoja, /texto=\{e\.finalizarEntrenamiento\}.*deshabilitado=\{motivoParaNo !== null\}/);
  assert.equal((hoja.match(/\{aviso \?/g) ?? []).length, 1, 'un solo lugar para el aviso en el cierre');
});

test('TEST-AV2-029 · «Realizada» viene elegida solo cuando los datos lo dicen: todo el plan registrado, nada escrito ni sustituido', () => {
  assert.equal(cierre.condicionQueCorresponde([ejercicioDelResumen(4), { ...ejercicioDelResumen(3), prescriptionId: 'pB' }]), 'COMPLETED');
  assert.equal(cierre.condicionQueCorresponde([ejercicioDelResumen(4, [4])]), null, 'quedó una serie sin registrar');
  assert.equal(cierre.condicionQueCorresponde([ejercicioDelResumen(4, [], { escritas: [5] })]), null, 'algo escrito sin registrar');
  assert.equal(cierre.condicionQueCorresponde([ejercicioDelResumen(4, [], { ejecutado: 'Prensa' })]), null, 'un ejercicio sustituido: lo decide la persona');
  assert.equal(cierre.condicionQueCorresponde([]), null);
  assert.equal(cierre.lineaDelResultado([ejercicioDelResumen(4), ejercicioDelResumen(4, [3, 4])]), '6 de 8 series del plan registradas');
});

test('TEST-AV2-030 · la hora de la sesión se toma sola al empezar, si cae en el día de la sesión; si no, se pide', () => {
  const inicio = '2026-11-08T13:15:00.000Z';
  assert.equal(cierre.horaTomadaAlEmpezar({ fechaDeLaSesion: '2026-11-08', zona: ZONA_DE_PRUEBA, inicio }), inicio);
  assert.equal(cierre.horaTomadaAlEmpezar({ fechaDeLaSesion: '2026-11-07', zona: ZONA_DE_PRUEBA, inicio }), null, 'empezada otro día');
  assert.equal(cierre.horaTomadaAlEmpezar({ fechaDeLaSesion: '2026-11-08', zona: ZONA_DE_PRUEBA, inicio: '2026-11-09T01:30:00.000Z' }), '2026-11-09T01:30:00.000Z', 'las 22:30 del 8 en Buenos Aires son del 8');
  assert.equal(cierre.horaTomadaAlEmpezar({ fechaDeLaSesion: '2026-11-08', zona: ZONA_DE_PRUEBA, inicio: null }), null, 'sin corrida (otro día, cargada después)');
  const s = sesionDePrueba();
  assert.equal(cierre.inicioDeLaCorrida(s.eventos()), new Date(Date.UTC(2026, 10, 7, 14, 0, 0)).toISOString());
  assert.equal(cierre.inicioDeLaCorrida([]), null);
  // En la pantalla: la hora tomada va antes que la escrita, y el campo se pide solo sin ella.
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  assert.match(PANTALLA, /if \(tomada\) \{\s*if \(!\(await guardarEnElBorrador\(\{ occurredAt: tomada \}\)\)\) return;\s*\} else if/);
  assert.match(PANTALLA, /const pideLaHora = [^;]*horaTomada === null;/);
});

test('TEST-AV2-031 · una sesión abierta hace seis horas o más dice desde cuándo, con su fecha; antes, el conteo', () => {
  const inicio = '2026-11-08T13:15:00.000Z';
  assert.deepEqual(cierre.tiempoDeLaSesionAbierta(89 * 3600_000, inicio, ZONA_DE_PRUEBA), { tipo: 'desde', texto: 'Sesión abierta desde el 8 nov · 10:15' });
  assert.deepEqual(cierre.tiempoDeLaSesionAbierta(cierre.CONTEO_HASTA_MS - 1, inicio, ZONA_DE_PRUEBA), { tipo: 'conteo' });
  assert.equal(cierre.tiempoDeLaSesionAbierta(cierre.CONTEO_HASTA_MS, inicio, ZONA_DE_PRUEBA).tipo, 'desde');
  assert.deepEqual(cierre.tiempoDeLaSesionAbierta(null, inicio, ZONA_DE_PRUEBA), { tipo: 'conteo' });
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  assert.match(PANTALLA, /abiertaDesde\.tipo === 'desde'/);
  assert.match(PANTALLA, /enElEjercicio\.ms !== null && abiertaDesde\.tipo === 'conteo'/, 'el tiempo del ejercicio no cuenta días');
});

test('TEST-AV2-032 · los tiempos de la sesión, resumidos: un renglón por ejercicio y el recomendado una vez, sin «sin recomendado»', () => {
  const d = (prescriptionId, setIndex, ms, recommendedSeconds, quality = 'MEASURED') => ({ restId: `${prescriptionId}${setIndex}`, prescriptionId, setIndex, duration: { ms, quality }, recommendedSeconds });
  const x = (prescriptionId, setIndex, ms) => ({ timingId: `t${prescriptionId}${setIndex}`, prescriptionId, setIndex, duration: { ms, quality: 'MEASURED' } });
  const orden = [
    { prescriptionId: 'pA', nombre: 'Sentadilla' },
    { prescriptionId: 'pB', nombre: 'Prensa' },
    { prescriptionId: 'pC', nombre: 'Estocadas' },
  ];
  const renglones = cierre.tiemposResumidos({ rests: [d('pA', 1, 92_000, 90), d('pA', 2, 105_000, 90, 'ESTIMATED'), d('pB', 1, 60_000, null), d('pB', 2, null, null, 'INCOMPLETE')], timedSets: [x('pA', 3, 40_000)] }, orden);
  assert.deepEqual(renglones, [
    { prescriptionId: 'pA', nombre: 'Sentadilla', descansos: 'Descansos: 01:32 · 01:45 estimado (recomendado: 01:30)', series: 'Series medidas: 00:40' },
    { prescriptionId: 'pB', nombre: 'Prensa', descansos: 'Descansos: 01:00 · incompleto', series: null },
  ]);
  assert.doesNotMatch(JSON.stringify(renglones), /sin recomendado/);
  // Recomendados distintos en un mismo ejercicio: no se elige uno.
  assert.equal(cierre.tiemposResumidos({ rests: [d('pC', 1, 90_000, 120), d('pC', 2, 95_000, 90)], timedSets: [] }, orden)[0].descansos, 'Descansos: 01:30 · 01:35');
  assert.deepEqual(cierre.tiemposResumidos(null, orden), []);
});

// ─── La revisión de la etapa B: el cierre y el motivo ──────────────────────────────────────────────

test('TEST-AV2-031 · en el cierre, una sesión abierta otro día no cuenta «Sin pausas: 89:08:26»: dice desde cuándo está abierta', () => {
  const resumen = [ejercicioDelResumen(4), { ...ejercicioDelResumen(4), prescriptionId: 'pB' }];
  const desde = cierre.tiempoDeLaSesionAbierta(89 * 3600_000, '2026-11-08T13:15:00.000Z', ZONA_DE_PRUEBA);
  assert.deepEqual(cierre.renglonesDelResultado(resumen, desde), { resultado: '8 de 8 series del plan registradas', abierta: 'Sesión abierta desde el 8 nov · 10:15' });
  assert.deepEqual(cierre.renglonesDelResultado(resumen, { tipo: 'conteo', sinPausasMs: 52 * 60_000 + 8_000 }), { resultado: '8 de 8 series del plan registradas · Sin pausas: 52:08', abierta: null });
  assert.deepEqual(cierre.renglonesDelResultado(resumen, { tipo: 'conteo', sinPausasMs: null }), { resultado: '8 de 8 series del plan registradas', abierta: null });
  // En la pantalla: el cierre usa el mismo `abiertaDesde` que la franja, no el conteo en vivo.
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  const hoja = PANTALLA.slice(PANTALLA.indexOf('if (finalizando) {'), PANTALLA.indexOf('const bases = basesDeLaPrescripcion(p);'));
  assert.match(hoja, /renglonesDelResultado\(resumen, abiertaDesde\.tipo === 'desde' \? abiertaDesde :/);
  assert.doesNotMatch(hoja, /C\.sinPausas\(/, 'el «Sin pausas» lo arma solo la función');
});

test('TEST-AV2-036 · el motivo: opcional con la no realizada (REG-06-131) y con el desvío; con «Realizada» no viaja', () => {
  assert.equal(cierre.motivoQueViaja('COMPLETED', 'me dolía la rodilla'), null, 'lo escrito en el desvío no viaja escondido');
  assert.equal(cierre.motivoQueViaja('COMPLETED_WITH_DEVIATION', '  me dolía la rodilla '), 'me dolía la rodilla');
  assert.equal(cierre.motivoQueViaja('NOT_COMPLETED', 'viaje'), 'viaje');
  assert.equal(cierre.motivoQueViaja('NOT_COMPLETED', '   '), null);
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  const hoja = PANTALLA.slice(PANTALLA.indexOf('if (finalizando) {'), PANTALLA.indexOf('const bases = basesDeLaPrescripcion(p);'));
  const noPudiste = hoja.slice(hoja.indexOf('titulo="¿No pudiste entrenar?"'));
  // Con la no realizada (o antes de elegirla), el campo está en su sección, antes del botón.
  assert.match(noPudiste, /\{condicion !== 'COMPLETED_WITH_DEVIATION' \? campoDelMotivo : null\}\s*<Boton texto=\{COPY_ENTRENAMIENTO\.noPudeRealizarla\}/);
  assert.match(hoja, /\{condicion === 'COMPLETED_WITH_DEVIATION' \? campoDelMotivo : null\}/);
  assert.match(hoja, /const campoDelMotivo = <Campo etiqueta=\{COPY_ENTRENAMIENTO\.motivoOpcional\}/);
  // Lo que viaja: siempre por `motivoQueViaja`, en el segmento, en «No pude» y al finalizar.
  assert.match(hoja, /sessionCondition: c, reason: motivoQueViaja\(c, motivo\)/);
  assert.match(PANTALLA, /sessionCondition: 'NOT_COMPLETED'[^\n]*reason: motivoQueViaja\('NOT_COMPLETED', motivo\)/);
  assert.match(PANTALLA, /const elMotivo = motivoQueViaja\(condicion, motivo\);/);
  assert.doesNotMatch(PANTALLA, /reason: motivo\.trim\(\)/);
});

test('TEST-AV2-036 · mientras se guarda, los segmentos de la condición no se tocan; y el cierre no arrastra el aviso de la sesión', () => {
  const ui = sinComentarios(leer('ui.tsx'));
  const segmentos = ui.slice(ui.indexOf('export function Segmentos'), ui.indexOf('export function Pestanas'));
  assert.match(segmentos, /accessibilityState=\{\{ checked: elegida, disabled: deshabilitado \}\}/);
  assert.match(segmentos, /disabled=\{deshabilitado\}/);
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  const hoja = PANTALLA.slice(PANTALLA.indexOf('if (finalizando) {'), PANTALLA.indexOf('const bases = basesDeLaPrescripcion(p);'));
  assert.match(hoja, /alElegir=\{elegir\}\s*deshabilitado=\{ocupado\}/);
  assert.match(PANTALLA, /setAviso\(null\);\s*setFinalizando\(true\);/, 'al abrir el cierre');
  assert.match(PANTALLA, /setAviso\(null\);\s*setFinalizando\(false\);/, 'al volver a la sesión');
});

test('TEST-AV2-036 · los textos del cierre: un solo verbo, la etiqueta del legajo y el recomendado aparte', () => {
  assert.equal(cierre.TEXTOS_DEL_CIERRE.titulo, 'Finalizar el entrenamiento');
  assert.equal(cierre.TEXTOS_DEL_CIERRE.conDesvio, 'Realizada con desvío', 'B10 §33');
  assert.equal(cierre.TEXTOS_DEL_CIERRE.recomendado('01:30'), '(recomendado: 01:30)');
});

test('TEST-AV2-033 · la explicación de los tiempos, una sola vez por cuenta: la marca vive aparte y se pone al mostrarla', async () => {
  const guardado = new Map();
  const almacen = { getItem: async (k) => guardado.get(k) ?? null, setItem: async (k, v) => void guardado.set(k, v) };
  const marca = explicacionDeLosTiempos.crearMarcaDeLaExplicacion(almacen);
  assert.equal(marca.vista('diego'), null, 'sin leer todavía');
  assert.equal(await marca.leer('diego'), false);
  const decide = (vistaEnLasSesiones, vistaEnElTelefono) => explicacionDeLosTiempos.seMuestraLaExplicacion({ enVivo: true, vistaEnLasSesiones, vistaEnElTelefono });
  assert.equal(decide(false, false), true, 'la primera vez');
  await marca.marcar('diego');
  // Un proceso nuevo: la app se volvió a abrir y las sesiones guardadas no se pudieron leer (vuelven del servicio).
  const otraVez = explicacionDeLosTiempos.crearMarcaDeLaExplicacion(almacen);
  assert.equal(await otraVez.leer('diego'), true);
  assert.equal(decide(false, otraVez.vista('diego')), false, 'no vuelve aunque lo de las sesiones se haya perdido');
  assert.equal(decide(true, false), false, 'alcanza con una de las dos marcas');
  assert.equal(decide(false, null), null, 'no se decide sin leer');
  assert.equal(await otraVez.leer('elian'), false, 'otra cuenta, otra marca');
  const falla = async () => {
    throw new Error('sin almacenamiento');
  };
  const rota = explicacionDeLosTiempos.crearMarcaDeLaExplicacion({ getItem: falla, setItem: falla });
  assert.equal(await rota.leer('diego'), false);
  assert.equal(await rota.marcar('diego'), false);
  assert.equal(rota.vista('diego'), true, 'vale mientras la app siga abierta');
  // En la pantalla: se marca al decidir mostrarla, y «Entendido» solo la cierra.
  const PANTALLA = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  assert.match(PANTALLA, /if \(decision\) \{\s*void marcaDeLaExplicacion\.marcar\(cuentaAbierta\);\s*entrenamientoLocal\.marcarExplicacionVista\(\);/);
  assert.match(PANTALLA, /<ExplicacionDeLosTiempos onEntendido=\{\(\) => setExplicacion\('no'\)\} \/>/);
});

test('TEST-AV2-034 · los ajustes del descanso: las dos casillas con su texto a la vista', () => {
  const SESION = sinComentarios(leer('pantallas/sesion-enfocada.tsx'));
  const hoja = SESION.slice(SESION.indexOf('export function HojaDelDescanso'), SESION.indexOf('export function ExplicacionDeLosTiempos'));
  assert.match(hoja, /<CasillaSimple marcada=\{ajustes\.vibrar\}.*texto=\{T\.vibrarAlLlegar\}/);
  assert.match(hoja, /<CasillaSimple marcada=\{ajustes\.tambienBloqueado\}.*texto=\{T\.tambienBloqueado\}/);
  assert.doesNotMatch(hoja, /CasillaSola/, 'la casilla sola no tiene texto: es la de cada serie');
});

test('TEST-AV2-035 · cada tramo de la franja se llena con las series registradas de su ejercicio; lo que falta queda neutro', () => {
  const resumen = [ejercicioDelResumen(4), { ...ejercicioDelResumen(4, [3, 4]), prescriptionId: 'pB' }, { ...ejercicioDelResumen(3, [1, 2, 3]), prescriptionId: 'pC' }];
  assert.deepEqual(
    franja.tramosDelRecorrido(resumen, 'pB').map((t) => [t.prescriptionId, t.fraccion, t.actual]),
    [
      ['pA', 1, false],
      ['pB', 0.5, true],
      ['pC', 0, false],
    ],
    'Sentadilla 4 de 4, llena',
  );
  // Una serie de más no pasa del tramo lleno.
  assert.equal(franja.tramosDelRecorrido([{ ...ejercicioDelResumen(4), registradas: 5 }], null)[0].fraccion, 1);
  assert.deepEqual(franja.cuentaDelRecorrido(resumen), { registradas: 6, planificadas: 11 });
});

// ─── Las pantallas vacías (vuelta 2): qué va a aparecer ahí y cuál es el siguiente paso ──────────────────────────────

test('las pantallas vacías principales dicen qué va a aparecer ahí y cuál es el siguiente paso, con su acción', () => {
  const VACIOS = {
    entrenamientoSinPlan: ['pantallas/entrenamiento.tsx', 'entrenamiento', "ir({ nombre: 'vinculos' })"],
    nutricionSinPlan: ['pantallas/nutricion-hoy.tsx', 'nutricion', "ir({ nombre: 'vinculos' })"],
    sinVinculos: ['pantallas/vinculos.tsx', 'persona', "ir({ nombre: 'perfil' })"],
    sinComidasRegistradas: ['pantallas/nutricion.tsx', 'comida', "volverAHoy('nutricion', dondeSeVe)"],
    sinSesionesEnElPeriodo: ['pantallas/historial.tsx', 'calendario', "volverAHoy('entrenamiento', hoy)"],
  };
  assert.deepEqual(Object.keys(T_VUELTA.vacios).sort(), Object.keys(VACIOS).sort());
  for (const [clave, [archivo, icono, destino]] of Object.entries(VACIOS)) {
    const v = T_VUELTA.vacios[clave];
    for (const parte of ['titulo', 'queAparece', 'siguientePaso', 'accion']) assert.ok(v[parte]?.trim(), `${clave}: falta ${parte}`);
    assert.match(v.queAparece, /^(Acá|Cuando)/, `${clave}: dice qué va a aparecer`);
    assert.doesNotMatch(v.titulo, /\.$/, `${clave}: el título, sin punto`);
    const codigo = sinComentarios(leer(archivo));
    const uso = `<EstadoVacio icono="${icono}" {...TEXTOS_DE_LA_VUELTA.vacios.${clave}} accion={{ texto: TEXTOS_DE_LA_VUELTA.vacios.${clave}.accion, onPress: () => ${destino} }} />`;
    assert.ok(codigo.includes(uso), `${archivo}: el estado vacío de ${clave}`);
  }
  // Lo que reemplazan: el párrafo o el aviso que solo decía que no había nada.
  assert.doesNotMatch(sinComentarios(leer('pantallas/vinculos.tsx')), /<Parrafo>\{COPY_VINCULO\.sinVinculos\}<\/Parrafo>/);
  assert.doesNotMatch(sinComentarios(leer('pantallas/entrenamiento.tsx')), /titulo=\{COPY_ENTRENAMIENTO\.sinPlanAsesorado\}/);
  assert.doesNotMatch(sinComentarios(leer('pantallas/nutricion-hoy.tsx')), /titulo=\{COPY_NUTRICION\.sinPlanAsesorado\}/);
  // La pieza: el ícono en su caja con tinte, el título como encabezado, los dos párrafos y la acción secundaria.
  const ui = sinComentarios(leer('ui.tsx'));
  assert.match(ui, /export function EstadoVacio\([\s\S]*?<Superficie style=\{estilos\.vacio\}>[\s\S]*?<CajaDelIcono>\s*<Icono nombre=\{icono\} tamano=\{20\} tono="azul" \/>\s*<\/CajaDelIcono>[\s\S]*?accessibilityRole="header"[\s\S]*?\{queAparece\}[\s\S]*?\{siguientePaso\}[\s\S]*?tipo="secundario"/);
});

// ─── «Ir a Entrenamiento» e «Ir a Hoy» de las pantallas vacías: la acción la resuelve el contenedor ──────────────────

const volver = await import('../apps/mobile/src/volver-a-hoy.ts');

test('en la pestaña, «Ir a Hoy» elige Hoy sin navegar; en la pantalla propia, deja Hoy recordado y después va', () => {
  for (const zona of ['entrenamiento', 'nutricion']) {
    // En la pestaña: `ir` a la misma zona no cambiaría nada, porque la pestaña elegida se recuerda.
    const elegidas = [];
    volver.volverAHoy(zona, { en: 'pestana', elegir: (v) => elegidas.push(v) });
    assert.deepEqual(elegidas, ['HOY'], `${zona}: en la pestaña elige Hoy`);
    // En la pantalla propia: primero se recuerda Hoy con la misma clave que lee la zona, después se va.
    const pasos = [];
    volver.volverAHoy(zona, { en: 'pantalla', recordar: (clave, v) => pasos.push(['recordar', clave, v]), ir: (ruta) => pasos.push(['ir', ruta]) });
    assert.deepEqual(pasos, [
      ['recordar', `${zona}:vista`, 'HOY'],
      ['ir', { nombre: zona === 'nutricion' ? 'hoy' : 'entrenamiento' }],
    ]);
  }
  // Las zonas leen su pestaña con esa misma clave, y cada contenedor pasa su forma.
  const ent = sinComentarios(leer('pantallas/entrenamiento.tsx'));
  assert.match(ent, /useSeleccionRecordada<VistaDeEntrenamiento>\(token, VISTA_RECORDADA\.entrenamiento, 'HOY'\)/);
  assert.match(ent, /<ContenidoDelHistorial [^>]*hoy=\{\{ en: 'pestana', elegir: setVista \}\} \/>/);
  const nut = sinComentarios(leer('pantallas/nutricion.tsx'));
  assert.match(nut, /useSeleccionRecordada<VistaDeNutricion>\(token, VISTA_RECORDADA\.nutricion, 'HOY'\)/);
  assert.match(nut, /visible === 'REGISTROS' \? <ListaDeRegistros [^>]*hoy=\{\{ en: 'pestana', elegir: setVista \}\} \/>/);
  assert.match(nut, /export function PantallaDeRegistros[\s\S]*?<ListaDeRegistros [^>]*hoy=\{\{ en: 'pantalla', recordar: \(clave, vista\) => memoria\.recordarSeleccion\(token, clave, vista\), ir \}\} \/>/);
  const his = sinComentarios(leer('pantallas/historial.tsx'));
  assert.match(his, /export function PantallaDeHistorial[\s\S]*?<ContenidoDelHistorial [^>]*hoy=\{\{ en: 'pantalla', recordar: \(clave, vista\) => memoria\.recordarSeleccion\(token, clave, vista\), ir \}\} \/>/);
  for (const [archivo, zona] of [['pantallas/historial.tsx', 'entrenamiento'], ['pantallas/nutricion.tsx', 'hoy']]) assert.doesNotMatch(sinComentarios(leer(archivo)), new RegExp(`onPress: \(\) => ir\(\{ nombre: '${zona}' \}\)`), `${archivo}: sin el ir a la misma zona`);
});

test('sin vínculos: con el identificador BE, lo que llega es la solicitud del profesional, en «Solicitudes recibidas» de esa pantalla', () => {
  const { siguientePaso } = T_VUELTA.vacios.sinVinculos;
  assert.match(siguientePaso, /su solicitud te llega acá, en «Solicitudes recibidas»/);
  assert.doesNotMatch(siguientePaso, /para que te la mande/, 'con el identificador no llega una invitación (DL-035)');
  assert.match(sinComentarios(leer('pantallas/vinculos.tsx')), /<Seccion titulo="Solicitudes recibidas">/, 'la sección que nombra existe en esa pantalla');
});
