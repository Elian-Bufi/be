/**
 * Congela lo que lee una APK publicada (DL-152): por cada operación de la API que la APK llama, el esquema con el que
 * valida la respuesta, tal como estaba en el commit de esa APK. Lo usan la prueba del dominio
 * `packages/domain/src/lecturas-de-la-apk.test.ts` y la de integración `test/integration/lecturas-de-las-apk.int-spec.ts`,
 * que valida las respuestas reales de la API de hoy contra él.
 *
 * Uso, desde la raíz y con las dependencias instaladas (no hace falta construir nada):
 *   node scripts/congelar-lo-que-lee-la-apk.mjs be-apk-0.13.2
 *   node scripts/congelar-lo-que-lee-la-apk.mjs be-apk-0.17.0-candidata.3
 * Escribe `packages/domain/fixtures/lecturas-de-la-apk/<versión>.json`. No editar ese archivo a mano.
 *
 * Cómo lo sabe sin mirar el código de hoy:
 * 1. Lee del tag, con git, las fuentes del dominio (`packages/domain/src`) y de la APK (`apps/mobile`).
 * 2. Transpila el dominio de ese commit (TypeScript sin chequeo de tipos) y lo carga con el zod del repo. Si la APK usaba
 *    otra versión de zod, el script se niega: el esquema congelado tiene que ser el que corre en el teléfono.
 * 3. Del cliente compartido de ese commit (`cliente-http.ts`, `crearClienteBe`) saca, por método, el verbo, la ruta y el
 *    esquema con el que valida la respuesta (`llamar(…, { esquema })`; la subida de bytes, aparte).
 * 4. De la APK saca qué métodos del cliente usa (`api.x`, `conSenal.x` y los que nombra en `Pick<ClienteBe, …>`).
 * 5. Con el contrato de ese commit (`OPERACIONES`) le pone a cada ruta su operación (API-XXX-NN).
 * 6. Convierte cada esquema a JSON Schema (draft 2020-12, del lado de la entrada: lo que `safeParse` acepta). Lo que JSON
 *    Schema no representa (un `refine`, una transformación) queda anotado en `noRepresentado`.
 * También congela cómo pide (sesión, Idempotency-Key, cabeceras, versiones de los textos), el esquema del pedido de cada
 * operación, el sobre de error (`ErrorEnvelopeSchema`: con otra forma, la APK dice «respuesta no reconocida» en lugar del
 * rechazo) y los detalles de los rechazos que la APK lee con su propio esquema.
 *
 * Al publicar una APK nueva (estable o candidata): taggearla `be-apk-<versión>`, correr este script con ese tag, sumar la
 * versión a `VIGENTES` en la prueba del dominio y correr la de integración. Al dejar de haber teléfonos con una versión, se
 * borra su archivo. Ver DL-152 en `docs/DEUDA_LEGAJO.md`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requerir = createRequire(import.meta.url);
const ts = requerir('typescript');
const DOMINIO = join(RAIZ, 'packages', 'domain');
const RUTA_DE_ZOD = requerir.resolve('zod', { paths: [DOMINIO] });
const z = requerir(RUTA_DE_ZOD);
const VERSION_DE_ZOD = JSON.parse(readFileSync(requerir.resolve('zod/package.json', { paths: [DOMINIO] }), 'utf8')).version;

const etiqueta = process.argv[2];
if (!etiqueta || !etiqueta.startsWith('be-apk-')) {
  console.error('Uso: node scripts/congelar-lo-que-lee-la-apk.mjs <tag de la APK, por ejemplo be-apk-0.13.2>');
  process.exit(2);
}

const git = (...args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const commit = git('rev-parse', '--verify', `${etiqueta}^{commit}`).trim();
const leer = (ruta) => git('show', `${commit}:${ruta}`);
const archivos = git('ls-tree', '-r', '--name-only', commit, '--', 'packages/domain/src', 'apps/mobile/src', 'apps/mobile/App.tsx').split('\n').filter(Boolean);

// ─── La versión de la APK y la de zod ────────────────────────────────────────────────────────────

const configuracion = leer('apps/mobile/app.config.ts');
const version = /const VERSION = '([^']+)'/.exec(configuracion)?.[1];
const versionCode = Number(/versionCode: (\d+)/.exec(configuracion)?.[1]);
if (!version || !Number.isInteger(versionCode)) throw new Error(`No encuentro la versión ni el versionCode en apps/mobile/app.config.ts de ${etiqueta}`);
if (`be-apk-${version}` !== etiqueta) throw new Error(`El tag ${etiqueta} apunta a la versión ${version}`);
const zodDeLaApk = JSON.parse(leer('packages/domain/package.json')).dependencies.zod;
if (zodDeLaApk !== VERSION_DE_ZOD) {
  throw new Error(`La APK ${version} usa zod ${zodDeLaApk} y el repo tiene ${VERSION_DE_ZOD}: el esquema congelado sería otro. Congelalo con zod ${zodDeLaApk}.`);
}

// ─── El dominio de ese commit, transpilado y cargado ─────────────────────────────────────────────

const temporal = mkdtempSync(join(tmpdir(), 'be-lecturas-de-la-apk-'));
try {
  const PREFIJO = 'packages/domain/src/';
  for (const ruta of archivos.filter((r) => r.startsWith(PREFIJO) && r.endsWith('.ts') && !r.endsWith('.test.ts'))) {
    const js = ts.transpileModule(leer(ruta), {
      fileName: ruta,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const ajenos = [...js.matchAll(/require\("([^"]+)"\)/g)].map((m) => m[1]).filter((m) => !m.startsWith('.') && m !== 'zod');
    if (ajenos.length > 0) throw new Error(`${ruta} importa ${ajenos.join(', ')}: el script solo sabe resolver zod`);
    const destino = join(temporal, ruta.slice(PREFIJO.length).replace(/\.ts$/, '.js'));
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, js.replace(/require\("zod"\)/g, `require(${JSON.stringify(RUTA_DE_ZOD)})`));
  }
  // El contrato (`OPERACIONES`) no se exporta del índice: vive en openapi.ts.
  const dominio = { ...requerir(join(temporal, 'index.js')), OPERACIONES: requerir(join(temporal, 'openapi.js')).OPERACIONES };
  const congelado = congelar(dominio);
  const salida = join(DOMINIO, 'fixtures', 'lecturas-de-la-apk', `${version}.json`);
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(salida, JSON.stringify(congelado, null, 1) + '\n');
  resumir(congelado, salida);
} finally {
  rmSync(temporal, { recursive: true, force: true });
}

// ─── El cliente de ese commit: método → verbo, ruta y esquema ────────────────────────────────────

function congelar(dominio) {
  const metodos = metodosDelCliente(dominio);
  const usados = usadosPorLaApk(new Set(metodos.keys()));
  const normalizar = (ruta) => ruta.replace(/\{[^}]*\}/g, '{}');
  const lecturas = {};
  const sinOperacion = [];
  for (const nombre of [...usados].sort()) {
    for (const llamada of metodos.get(nombre)) {
      const esquema = llamada.esquema === null ? null : esquemaDe(llamada.esquema, dominio, nombre);
      let candidatas = dominio.OPERACIONES.filter((o) => o.metodo === llamada.metodo && (llamada.ruta === null || normalizar(o.ruta) === llamada.ruta));
      if (candidatas.length > 1 && esquema) candidatas = candidatas.filter((o) => o.exitos.some((e) => e.schema === esquema));
      if (candidatas.length !== 1) {
        sinOperacion.push(`${nombre}: ${llamada.metodo.toUpperCase()} ${llamada.ruta ?? '(ruta dinámica)'} → ${candidatas.map((o) => o.id).join(', ') || 'ninguna'}`);
        continue;
      }
      const op = candidatas[0];
      const previa = lecturas[op.id];
      if (previa) {
        if (previa.esquema !== llamada.esquema) throw new Error(`${op.id} se lee con dos esquemas: ${previa.esquema} y ${llamada.esquema}`);
        if (previa.conSesion !== llamada.conSesion || previa.conClave !== llamada.conClave) throw new Error(`${op.id} se pide de dos maneras (${previa.llamadas[0]} y ${nombre})`);
        if (!previa.llamadas.includes(nombre)) previa.llamadas.push(nombre);
        continue;
      }
      lecturas[op.id] = {
        metodo: op.metodo,
        ruta: op.ruta,
        llamadas: [nombre],
        // Cómo pide la APK: con el Bearer de la sesión y con Idempotency-Key, o sin ellos.
        conSesion: llamada.conSesion,
        conClave: llamada.conClave,
        esquema: llamada.esquema,
        comoElContrato: esquema === null ? op.exitos.every((e) => !e.schema) : op.exitos.some((e) => e.schema === esquema),
        respuesta: esquema === null ? null : aJsonSchema(esquema),
        noRepresentado: esquema === null ? [] : noRepresentado(esquema),
        pedido: op.request ? aJsonSchema(op.request) : null,
      };
    }
  }
  if (sinOperacion.length > 0) throw new Error(`Llamadas de la APK sin una operación única en OPERACIONES de ${etiqueta}:\n  ${sinOperacion.join('\n  ')}`);

  const errores = {
    esquema: 'ErrorEnvelopeSchema',
    respuesta: aJsonSchema(dominio.ErrorEnvelopeSchema),
    noRepresentado: noRepresentado(dominio.ErrorEnvelopeSchema),
    // Los `details` que la APK lee con su propio esquema, según el código del rechazo (la evidencia visual, la cuenta de
    // Google). Si no pasan, la APK trata el rechazo como cualquier otro: pierde lo que tenía para mostrar.
    detalles: detallesDeLosRechazos(dominio),
  };
  const ordenadas = Object.fromEntries(Object.entries(lecturas).sort(([a], [b]) => a.localeCompare(b, 'en')));
  return {
    apk: { version, versionCode, tag: etiqueta, commit },
    origen: `Generado con «node scripts/congelar-lo-que-lee-la-apk.mjs ${etiqueta}» desde las fuentes del commit ${commit.slice(0, 7)} (dominio, cliente y APK), con zod ${VERSION_DE_ZOD}. No editar a mano.`,
    cabeceras: cabecerasDeLaApk(dominio),
    // Las versiones de los textos que la APK manda como aceptadas (el alta, el cierre): las de su commit, no las de hoy.
    textos: Object.fromEntries(Object.entries(dominio.VERSION_VIGENTE).map(([tipo, texto]) => [tipo, texto.id])),
    errores,
    lecturas: ordenadas,
  };
}

/**
 * El esquema de zod de un pedido: un nombre que exporta el dominio de ese commit o una expresión escrita en el cliente
 * (`z.strictObject({ data: … })`), que se evalúa con zod y con lo que exporta ese dominio.
 */
function esquemaDe(texto, dominio, metodo) {
  if (/^[A-Za-z_$][\w$]*$/.test(texto)) {
    if (!dominio[texto]) throw new Error(`${metodo}: el esquema ${texto} no se exporta del dominio de ${etiqueta}`);
    return dominio[texto];
  }
  const js = ts.transpileModule(`export default (${texto});`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const nombres = [...new Set([...texto.matchAll(/\b[A-Za-z_$][\w$]*\b/g)].map((m) => m[0]))].filter((n) => n in dominio && n !== 'z');
  const modulo = { exports: {} };
  new Function('module', 'exports', 'z', ...nombres, js)(modulo, modulo.exports, z, ...nombres.map((n) => dominio[n]));
  const esquema = modulo.exports.default;
  if (!esquema?._zod) throw new Error(`${metodo}: no pude evaluar el esquema ${texto}`);
  return esquema;
}

/** Las cabeceras fijas que manda la APK en cada pedido: la superficie y, desde DL-122, las capacidades que declara. */
function cabecerasDeLaApk(dominio) {
  const api = leer('apps/mobile/src/api.ts');
  const superficie = /superficie: '([A-Z]+)'/.exec(api)?.[1];
  if (superficie !== 'APK') throw new Error('apps/mobile/src/api.ts no declara la superficie APK');
  const capacidades = /capacidades: \[([^\]]*)\]/.exec(api)?.[1];
  const valores = capacidades ? capacidades.split(',').map((c) => c.trim()).filter(Boolean).map((c) => dominio[c]) : [];
  if (valores.some((v) => typeof v !== 'string')) throw new Error(`No pude leer las capacidades de la APK: ${capacidades}`);
  const cabeceras = { 'X-BE-Surface': superficie };
  if (valores.length > 0) cabeceras[dominio.HEADER_DE_CAPACIDADES ?? 'X-BE-Capabilities'] = dominio.valorDeCapacidades ? dominio.valorDeCapacidades(valores) : valores.join(', ');
  return cabeceras;
}

/** JSON Schema del lado de la entrada: lo que `safeParse` acepta (un objeto no estricto acepta claves de más). */
function aJsonSchema(esquema) {
  try {
    return z.toJSONSchema(esquema, { target: 'draft-2020-12', io: 'input' });
  } catch {
    return z.toJSONSchema(esquema, { target: 'draft-2020-12', io: 'input', unrepresentable: 'any' });
  }
}

/** Dónde el esquema hace algo que JSON Schema no dice: un `refine`/`superRefine`, una transformación, un `custom`. */
function noRepresentado(esquema) {
  const hallazgos = new Set();
  const vistos = new Set();
  const recorrer = (s, camino) => {
    if (!s || typeof s !== 'object' || !s._zod || vistos.has(s)) return;
    vistos.add(s);
    const def = s._zod.def;
    const aqui = camino || '(raíz)';
    for (const c of def.checks ?? []) if (c._zod?.def?.check === 'custom') hallazgos.add(`${aqui}: refine`);
    switch (def.type) {
      case 'object':
        for (const [clave, valor] of Object.entries(def.shape)) recorrer(valor, camino ? `${camino}.${clave}` : clave);
        if (def.catchall) recorrer(def.catchall, `${aqui}.*`);
        break;
      case 'array':
        recorrer(def.element, `${camino}[]`);
        break;
      case 'union':
        def.options.forEach((o) => recorrer(o, camino));
        break;
      case 'intersection':
        recorrer(def.left, camino);
        recorrer(def.right, camino);
        break;
      case 'record':
        recorrer(def.keyType, `${aqui}{clave}`);
        recorrer(def.valueType, `${aqui}{valor}`);
        break;
      case 'tuple':
        def.items.forEach((x, i) => recorrer(x, `${camino}[${i}]`));
        if (def.rest) recorrer(def.rest, `${camino}[…]`);
        break;
      case 'optional':
      case 'nullable':
      case 'default':
      case 'prefault':
      case 'readonly':
      case 'nonoptional':
      case 'catch':
        recorrer(def.innerType, camino);
        break;
      case 'lazy':
        recorrer(def.getter(), camino);
        break;
      case 'pipe':
        hallazgos.add(`${aqui}: transformación`);
        recorrer(def.in, camino);
        recorrer(def.out, camino);
        break;
      case 'transform':
      case 'custom':
        hallazgos.add(`${aqui}: ${def.type}`);
        break;
      default:
        break;
    }
  };
  recorrer(esquema, '');
  return [...hallazgos].sort();
}

/**
 * El cliente de ese commit, leído una sola vez: el archivo y la función `crearClienteBe`. Se guarda en la función misma
 * porque el programa principal corre arriba, antes de que una variable declarada acá exista.
 */
function elCliente() {
  if (elCliente.leido) return elCliente.leido;
  const fuente = ts.createSourceFile('cliente-http.ts', leer('packages/domain/src/cliente-http.ts'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  let crear;
  fuente.forEachChild((n) => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === 'crearClienteBe') crear = n;
  });
  if (!crear) throw new Error('No encuentro crearClienteBe en cliente-http.ts');
  elCliente.leido = { fuente, crear };
  return elCliente.leido;
}

/**
 * En `llamar`, un rechazo trae a veces un detalle que la APK valida con su esquema según el código:
 * `codigo === 'X' ? Esquema.safeParse(error.data.error.details) : null`, o `CONJUNTO.has(codigo) ? …`.
 */
function detallesDeLosRechazos(dominio) {
  const { fuente, crear } = elCliente();
  const llamar = crear.body.statements.find((s) => ts.isFunctionDeclaration(s) && s.name?.text === 'llamar');
  if (!llamar) throw new Error('No encuentro llamar en crearClienteBe');
  const conjuntos = new Map();
  fuente.forEachChild((n) => {
    if (!ts.isVariableStatement(n)) return;
    for (const d of n.declarationList.declarations) {
      const inicial = d.initializer;
      if (ts.isIdentifier(d.name) && inicial && ts.isNewExpression(inicial) && inicial.expression.getText() === 'Set' && inicial.arguments?.[0] && ts.isArrayLiteralExpression(inicial.arguments[0])) {
        conjuntos.set(d.name.text, inicial.arguments[0].elements.filter(ts.isStringLiteral).map((e) => e.text));
      }
    }
  });
  const detalles = {};
  const visitar = (n) => {
    const llamada = ts.isConditionalExpression(n) ? n.whenTrue : null;
    if (llamada && ts.isCallExpression(llamada) && ts.isPropertyAccessExpression(llamada.expression) && llamada.expression.name.text === 'safeParse' && llamada.arguments[0]?.getText() === 'error.data.error.details') {
      const esquema = llamada.expression.expression.getText();
      const c = n.condition;
      let codigos = null;
      if (ts.isBinaryExpression(c) && c.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken && ts.isStringLiteral(c.right)) codigos = [c.right.text];
      else if (ts.isCallExpression(c) && ts.isPropertyAccessExpression(c.expression) && c.expression.name.text === 'has' && ts.isIdentifier(c.expression.expression)) codigos = conjuntos.get(c.expression.expression.text) ?? null;
      if (!codigos) throw new Error(`No sé leer cuándo se valida el detalle con ${esquema}: ${c.getText()}`);
      for (const codigo of codigos) detalles[codigo] = { esquema, respuesta: aJsonSchema(esquemaDe(esquema, dominio, 'llamar')) };
    }
    ts.forEachChild(n, visitar);
  };
  visitar(llamar.body);
  return Object.fromEntries(Object.entries(detalles).sort(([a], [b]) => a.localeCompare(b, 'en')));
}

/**
 * Los métodos del objeto que devuelve `crearClienteBe`, con cada pedido que hacen: verbo, ruta normalizada (`{}` por cada
 * parámetro, sin la consulta) y el nombre del esquema de la respuesta (`null`: no la valida, como un 204).
 */
function metodosDelCliente(dominio) {
  const { crear } = elCliente();

  // Las funciones internas que piden con su propio fetch (la subida de bytes): verbo y esquema, y la ruta es su primer parámetro.
  const auxiliares = new Map();
  for (const s of crear.body.statements) {
    if (!ts.isFunctionDeclaration(s) || !s.name || s.name.text === 'llamar') continue;
    let metodo = null;
    const esquemas = new Set();
    const visitar = (n) => {
      if (ts.isPropertyAssignment(n) && n.name.getText() === 'method' && ts.isStringLiteral(n.initializer)) metodo = n.initializer.text.toLowerCase();
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'safeParse' && ts.isIdentifier(n.expression.expression)) {
        const nombre = n.expression.expression.text;
        if (nombre !== 'ErrorEnvelopeSchema') esquemas.add(nombre);
      }
      ts.forEachChild(n, visitar);
    };
    visitar(s.body);
    if (metodo && esquemas.size === 1) auxiliares.set(s.name.text, { metodo, esquema: [...esquemas][0] });
    else if (metodo) throw new Error(`${s.name.text} pide con su propio fetch y no sé con qué esquema valida`);
  }

  const retorno = crear.body.statements.find((s) => ts.isReturnStatement(s) && s.expression && ts.isObjectLiteralExpression(s.expression));
  if (!retorno) throw new Error('crearClienteBe no devuelve un objeto literal');
  const metodos = new Map();
  for (const p of retorno.expression.properties) {
    const nombre = p.name?.getText();
    // `subirMedio: subirBytes`: el método es la función interna, que recibe la ruta armada.
    if (nombre && ts.isPropertyAssignment(p) && ts.isIdentifier(p.initializer) && auxiliares.has(p.initializer.text)) {
      const auxiliar = auxiliares.get(p.initializer.text);
      // La subida va a la ruta firmada, sin sesión ni Idempotency-Key: la firma es la autorización (API-MED-02).
      metodos.set(nombre, [{ metodo: auxiliar.metodo, ruta: null, esquema: auxiliar.esquema, conSesion: false, conClave: false }]);
      continue;
    }
    const cuerpo = ts.isMethodDeclaration(p) ? p.body : ts.isPropertyAssignment(p) && (ts.isArrowFunction(p.initializer) || ts.isFunctionExpression(p.initializer)) ? p.initializer.body : null;
    if (!nombre || !cuerpo) throw new Error(`No sé leer la propiedad ${nombre ?? p.getText().slice(0, 40)} del cliente`);
    const llamadas = [];
    const visitar = (n) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
        const funcion = n.expression.text;
        if (funcion === 'llamar') {
          const [verbo, ruta, extra] = n.arguments;
          if (!ts.isStringLiteral(verbo) || !extra || !ts.isObjectLiteralExpression(extra)) throw new Error(`${nombre}: llamar(…) con una forma que no conozco`);
          const propiedad = extra.properties.find((x) => x.name?.getText() === 'esquema');
          if (!propiedad || !ts.isPropertyAssignment(propiedad)) throw new Error(`${nombre}: llamar(…) sin esquema`);
          const valor = propiedad.initializer;
          // Un nombre exportado por el dominio, null (no valida el cuerpo) o una expresión escrita ahí mismo.
          const esquema = valor.kind === ts.SyntaxKind.NullKeyword ? null : valor.getText().replace(/\s+/g, ' ');
          const lleva = (clave) => extra.properties.some((x) => x.name?.getText() === clave);
          llamadas.push({ metodo: verbo.text.toLowerCase(), ruta: rutaDe(ruta, dominio, nombre), esquema, conSesion: lleva('token'), conClave: lleva('claveDeIdempotencia') });
        } else if (auxiliares.has(funcion)) {
          const auxiliar = auxiliares.get(funcion);
          llamadas.push({ metodo: auxiliar.metodo, ruta: rutaDe(n.arguments[0], dominio, nombre), esquema: auxiliar.esquema, conSesion: false, conClave: false });
        }
      }
      ts.forEachChild(n, visitar);
    };
    visitar(cuerpo);
    metodos.set(nombre, llamadas);
  }
  return metodos;
}

/** La ruta de un pedido, con `{}` por cada parámetro y sin la consulta; `null` si llega armada (la ruta firmada de una subida). */
function rutaDe(nodo, dominio, metodo) {
  if (ts.isStringLiteral(nodo) || ts.isNoSubstitutionTemplateLiteral(nodo)) return nodo.text;
  if (ts.isTemplateExpression(nodo)) {
    let ruta = nodo.head.text;
    for (const tramo of nodo.templateSpans) {
      const e = tramo.expression;
      const esConsulta = ts.isCallExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'query';
      if (esConsulta && tramo.literal.text !== '') throw new Error(`${metodo}: hay ruta después de la consulta`);
      ruta += (esConsulta ? '' : '{}') + tramo.literal.text;
    }
    return ruta;
  }
  if (ts.isPropertyAccessExpression(nodo)) {
    const valor = nodo.getText().split('.').reduce((o, k) => (o == null ? o : o[k]), dominio);
    if (typeof valor !== 'string') throw new Error(`${metodo}: no pude resolver la ruta ${nodo.getText()} en el dominio`);
    return valor.replace(/\{[^}]*\}/g, '{}');
  }
  if (ts.isIdentifier(nodo)) return null;
  throw new Error(`${metodo}: no sé leer la ruta ${nodo.getText()}`);
}

// ─── La APK de ese commit: qué métodos del cliente usa ───────────────────────────────────────────

function usadosPorLaApk(nombres) {
  const fuentes = archivos.filter((r) => r.startsWith('apps/mobile/') && /\.(ts|tsx)$/.test(r) && !/\.test\.tsx?$/.test(r));
  const usados = new Set();
  const nombrados = new Set();
  for (const ruta of fuentes) {
    const texto = leer(ruta);
    for (const m of texto.matchAll(/\b(?:api|conSenal)\s*\.\s*([A-Za-z0-9_]+)/g)) if (nombres.has(m[1])) usados.add(m[1]);
    for (const m of texto.matchAll(/Pick<ClienteBe,([^>]+)>/g)) for (const n of m[1].matchAll(/'([A-Za-z0-9_]+)'/g)) if (nombres.has(n[1])) usados.add(n[1]);
    for (const m of texto.matchAll(/\b([A-Za-z0-9_]+)\b/g)) if (nombres.has(m[1])) nombrados.add(m[1]);
  }
  usados.delete('urlDe'); // arma una URL, no pide nada
  const dudosos = [...nombrados].filter((n) => !usados.has(n) && n !== 'urlDe');
  if (dudosos.length > 0) console.warn(`Aviso: la APK nombra estos métodos del cliente sin llamarlos por api.x (revisar a mano): ${dudosos.sort().join(', ')}`);
  return usados;
}

// ─── Resumen para quien lo corre ─────────────────────────────────────────────────────────────────

function resumir(congelado, salida) {
  const filas = Object.entries(congelado.lecturas).map(([id, l]) => `${id.padEnd(26)} ${l.metodo.toUpperCase().padEnd(6)} ${l.ruta.padEnd(62)} ${(l.esquema ?? '(sin cuerpo)').padEnd(52)} ${l.llamadas.join(', ')}${l.noRepresentado.length ? `  [no representado: ${l.noRepresentado.join('; ')}]` : ''}${l.comoElContrato ? '' : '  [distinto del contrato]'}`);
  console.log(`APK ${congelado.apk.version} (versionCode ${congelado.apk.versionCode}, ${congelado.apk.commit.slice(0, 7)}): ${filas.length} operaciones`);
  console.log(`Cabeceras: ${JSON.stringify(congelado.cabeceras)}`);
  console.log(filas.join('\n'));
  console.log(`Escrito: ${salida}`);
}
