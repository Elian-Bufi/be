/**
 * T13 de WP-04, extendido en WP-05 (REG-06-125; TEST-PRJ-009): cero puntaje también en el copy de las pantallas.
 * La prueba de @be/domain recorre los schemas, el OpenAPI y los diccionarios de copy. Esta recorre el texto escrito
 * directo en las pantallas del website y del APK: literales de cadena, plantillas y texto JSX, extraídos con el
 * compilador de TypeScript (los comentarios no cuentan: no se muestran).
 *
 * Cada dominio trae su propia lista: nutrición prohíbe puntajes, porcentajes y juicios; antropometría suma los
 * términos que insinúan que un hueco es un valor o que un derivado es un diagnóstico (INV-06-176/177; RF-048).
 *
 * Uso: node --test scripts/copy-pantallas.test.cjs (después de construir @be/domain).
 */
const assert = require('node:assert/strict');
const { readdirSync, readFileSync } = require('node:fs');
const { basename, join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { terminosProhibidosEn, terminosProhibidosDeAntropometriaEn, terminosProhibidosDeCarteraEn, terminosProhibidosDeEntrenamientoEn, terminosProhibidosDeFormulariosEn } = require('../packages/domain/dist/index.js');

const RAIZ = join(__dirname, '..');
/** Los textos también viven en módulos sin JSX (`.ts`): se leen como TypeScript, no como TSX. */
const tipoDeArchivo = (archivo) => (archivo.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
/** Las frases de Inicio y de los gráficos chicos que se arman fuera de las pantallas, en módulos puros. */
const movil = (archivo) => join(RAIZ, 'apps/mobile/src', archivo);
const tsx = (dir) => readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => join(dir, f));

/**
 * Inicio (DL-117): cada tarjeta vive en el archivo de su módulo y se revisa con la lista de su dominio. Las piezas comunes
 * y la tarjeta de Información, que muestran texto de cualquier módulo, se revisan con las tres.
 */
const inicio = (archivo) => join(RAIZ, 'apps/mobile/src/pantallas', archivo);
const INICIO_COMUN = ['inicio.tsx', 'tarjeta-de-inicio.tsx', 'inicio-informacion.tsx'].map(inicio);

/** Las pantallas de cada dominio, con la lista de términos que le corresponde. */
const DOMINIOS = [
  {
    nombre: 'nutrición',
    // WP-NUTRICION-RECETAS: «Mis recetas» del website y las pantallas nuevas de la APK (carrusel, detalle, comida diferente).
    archivos: [
      ...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/nutrition')),
      ...tsx(join(RAIZ, 'apps/web/src/app/pro/recipes')),
      ...['nutricion.tsx', 'nutricion-hoy.tsx', 'opcion-de-comida.tsx', 'comida-diferente.tsx'].map(inicio),
      ...['piezas-de-nutricion.tsx', 'imagen-de-medio.tsx', 'registro-de-comidas.tsx', 'franja-de-macros.ts', 'consumo-de-la-opcion.ts', 'borrador-de-comida-diferente.ts'].map(movil),
      inicio('inicio-nutricion.tsx'),
      movil('lecturas-de-inicio.ts'),
      ...INICIO_COMUN,
    ],
    prohibidos: terminosProhibidosEn,
    minimo: 8,
  },
  {
    nombre: 'antropometría',
    archivos: [
      ...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/anthropometry')),
      ...['antropometria.tsx', 'figura-de-la-toma.tsx', 'indicadores.tsx', 'progreso.tsx', 'progreso-de-una-medida.tsx'].map((archivo) => join(RAIZ, 'apps/mobile/src/pantallas', archivo)),
      movil('textos-por-toma.ts'),
      inicio('inicio-mediciones.tsx'),
      ...INICIO_COMUN,
    ],
    prohibidos: terminosProhibidosDeAntropometriaEn,
    minimo: 5,
  },
  {
    nombre: 'entrenamiento',
    archivos: [...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/training')), join(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'), inicio('inicio-entrenamiento.tsx'), movil('lecturas-de-inicio.ts'), ...INICIO_COMUN],
    prohibidos: terminosProhibidosDeEntrenamientoEn,
    minimo: 7,
  },
  {
    // WP-ESCRITORIO-AMABLE, parte 5: el Espacio profesional (los pendientes de la cartera y el directorio). Una lista de
    // personas no califica a nadie: ni «inactivo», ni «riesgo», ni un porcentaje (TEST-PRJ-009; DL-107).
    nombre: 'el espacio profesional',
    archivos: [...tsx(join(RAIZ, 'apps/web/src/app/pro')), ...['directorio.ts', 'pendiente-en-una-fila.ts'].map((archivo) => join(RAIZ, 'apps/web/src/app/pro', archivo))],
    prohibidos: terminosProhibidosDeCarteraEn,
    minimo: 8,
  },
  {
    // WP-ESCRITORIO-AREAS, parte 4: Información del profesional (las solicitudes y el pedido). Pedir no es obligar, no
    // responder no se mide, y lo declarado no es una medición ni un diagnóstico (09 §22.7): negarlo sí se puede decir.
    // Hasta acá estas pantallas no las miraba ninguna prueba; el texto del dominio sí (`contratos-wp07.test.ts`).
    nombre: 'información',
    archivos: tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/forms')),
    prohibidos: terminosProhibidosDeFormulariosEn,
    minimo: 4,
  },
  {
    // WP-ESCRITORIO-AREAS, parte 10: las piezas de una revisión que comparten Nutrición y Entrenamiento (la evidencia por
    // día, la revisión en preparación, el período y su ayuda). Muestran texto de las dos áreas: pasan por las dos listas.
    // Hasta acá la evidencia no la miraba ninguna prueba de palabras.
    nombre: 'la revisión de Nutrición y de Entrenamiento',
    archivos: ['evidencia-de-revision.tsx', 'revision-en-preparacion.tsx', 'ayuda-de-revisiones.tsx', 'evidencia.ts', 'periodo-de-la-revision.ts'].map((archivo) => join(RAIZ, 'apps/web/src/app/pro/advisees', archivo)),
    prohibidos: (texto) => [...new Set([...terminosProhibidosEn(texto), ...terminosProhibidosDeEntrenamientoEn(texto)])],
    minimo: 5,
  },
];

/** Estilos de React Native: valores como '100%' no son texto para la persona. */
function dentroDeEstilos(nodo) {
  for (let n = nodo.parent; n; n = n.parent) {
    if (ts.isCallExpression(n) && n.expression.getText() === 'StyleSheet.create') return true;
    if (ts.isJsxAttribute(n) && ['className', 'style', 'id', 'htmlFor', 'key', 'href', 'accessibilityRole', 'keyboardType'].includes(n.name.getText())) return true;
    if (ts.isImportDeclaration(n)) return true;
  }
  return false;
}

function textosDe(archivo, contenido = readFileSync(archivo, 'utf8')) {
  const fuente = ts.createSourceFile(archivo, contenido, ts.ScriptTarget.Latest, true, tipoDeArchivo(archivo));
  const textos = [];
  const visitar = (n) => {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isJsxText(n)) && !dentroDeEstilos(n)) {
      const t = n.text.trim();
      if (t) textos.push({ texto: t, linea: fuente.getLineAndCharacterOfPosition(n.getStart()).line + 1 });
    }
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  return textos;
}

for (const dominio of DOMINIOS) {
  test(`T13 · el copy de las pantallas de ${dominio.nombre} no tiene puntajes, juicios ni huecos completados`, () => {
    assert.ok(dominio.archivos.length >= dominio.minimo, `se esperaban las pantallas de ${dominio.nombre}, hay ${dominio.archivos.length}`);
    const porArchivo = dominio.archivos.map((a) => [a, textosDe(a)]);
    assert.ok(
      porArchivo.every(([, t]) => t.length > 0),
      'cada pantalla tiene copy extraído',
    );
    const hallazgos = porArchivo.flatMap(([a, textos]) =>
      textos.flatMap(({ texto, linea }) => dominio.prohibidos(texto).map((p) => `${a.slice(RAIZ.length + 1)}:${linea} «${p}» en ${JSON.stringify(texto)}`)),
    );
    assert.deepEqual(hallazgos, []);
  });
}

/**
 * La ficha del asesorado (WP-ESCRITORIO-AMABLE, E-05): el marco, el Resumen, la Línea de tiempo y Analizar muestran las
 * tres áreas, así que sus textos pasan por las tres listas a la vez.
 *
 * Un solo porcentaje es de la ficha, y está contado: el **cambio relativo** de Analizar, que compara un valor con otro
 * del mismo dato (la referencia que elige el profesional). No es un puntaje ni dice cuánto «se cumplió». Los lugares
 * donde se escribe están en `PORCENTAJES_DE_LA_FICHA`, uno por uno: un «%» en cualquier otro texto hace fallar la
 * prueba, y si alguno de esos lugares deja de existir, también (la lista no puede quedar con permisos de más).
 */
const SEGUIMIENTO = join(RAIZ, 'apps/web/src/app/pro/advisees/seguimiento');
const LA_FICHA = [
  ...readdirSync(SEGUIMIENTO).filter((f) => /\.tsx?$/.test(f)).map((f) => join(SEGUIMIENTO, f)),
  ...['workspace.tsx', 'periodo.tsx'].map((archivo) => join(RAIZ, 'apps/web/src/app/pro/advisees', archivo)),
];
const PORCENTAJES_DE_LA_FICHA = [
  // La lectura de un punto en «Cambio relativo»: «+3,2 % contra la referencia».
  'analizar.tsx · % contra la referencia',
  // La unidad del gráfico en «Cambio relativo», y las marcas de su eje.
  'lienzo.tsx · %',
  // El ancho del gráfico dentro de su caja: no es un texto para la persona.
  'lienzo.tsx · 100%',
];

test('T13 · el copy de la ficha del asesorado no tiene puntajes, juicios ni huecos completados; su único porcentaje es el cambio relativo', () => {
  assert.ok(LA_FICHA.length >= 20, `se esperaban las pantallas de la ficha, hay ${LA_FICHA.length}`);
  const prohibidos = (texto) => [...new Set([...terminosProhibidosEn(texto), ...terminosProhibidosDeAntropometriaEn(texto), ...terminosProhibidosDeEntrenamientoEn(texto)])];
  const porcentajes = new Set();
  const hallazgos = LA_FICHA.flatMap((a) =>
    textosDe(a).flatMap(({ texto, linea }) =>
      prohibidos(texto).flatMap((p) => {
        const lugar = `${basename(a)} · ${texto}`;
        if (p === '%' && PORCENTAJES_DE_LA_FICHA.includes(lugar)) {
          porcentajes.add(lugar);
          return [];
        }
        return [`${a.slice(RAIZ.length + 1)}:${linea} «${p}» en ${JSON.stringify(texto)}`];
      }),
    ),
  );
  assert.deepEqual(hallazgos, []);
  assert.deepEqual([...porcentajes].sort(), [...PORCENTAJES_DE_LA_FICHA].sort(), 'cada porcentaje permitido sigue existiendo: si se fue, se saca de la lista');
});

test('T13 · en la ficha, un porcentaje fuera del cambio relativo se detecta (prueba de la prueba)', () => {
  const prohibidos = (texto) => [...new Set([...terminosProhibidosEn(texto), ...terminosProhibidosDeAntropometriaEn(texto), ...terminosProhibidosDeEntrenamientoEn(texto)])];
  const contenido = 'export const X = () => <p>Registró el 82 % de las comidas</p>;';
  const [{ texto }] = textosDe('resumen.tsx', contenido);
  assert.deepEqual(prohibidos(texto), ['%']);
  assert.equal(PORCENTAJES_DE_LA_FICHA.includes(`resumen.tsx · ${texto}`), false);
  // Y una palabra que califica, en cualquier pantalla de la ficha.
  assert.ok(prohibidos('La adherencia de la semana').includes('adherencia'));
});

test('T13 · el extractor encuentra un término prohibido en el copy e ignora los estilos', () => {
  const contenido = "const s = StyleSheet.create({ w: { width: '100%' } }); export const X = () => <p className=\"a\">Adherencia del 82 %</p>;";
  const textos = textosDe('fixture.tsx', contenido).map((t) => t.texto);
  assert.deepEqual(textos, ['Adherencia del 82 %']);
  assert.deepEqual(terminosProhibidosEn(textos.join(' ')), ['adherencia', '%']);
});

test('T13 · en antropometría, un juicio afirmativo se detecta y su negación explícita no', () => {
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Este resultado es un diagnóstico'), ['diagnóstico']);
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Un resultado calculado no es un diagnóstico'), []);
});

/**
 * Guardia estructural (REG-06-16; 09v11:650-657). La API publica dos magnitudes: `magnitude`, el valor tal como se
 * tomó, y `effectiveMagnitude`, el que rige después de resolver la cadena de correcciones por relación. El titular
 * de la tarjeta tiene que mostrar el que rige: mostrar el original ahí lo dejaba contradiciendo al cálculo derivado
 * que ya usaba el corregido, con la insignia «Vigente» al lado. Que el campo exista en el contrato no alcanza; esta
 * prueba fija que la pantalla lo use, porque el error fue de lectura, no de contrato.
 *
 * DL-113: el titular dejó de ser un `<h4>` por tarjeta y pasó a ser la fila de la lista de mediciones
 * (`medicion__fila`). Cambió dónde se busca; lo que se exige es lo mismo.
 *
 * WP-ESCRITORIO-AREAS, parte 3: las pantallas ya no eligen el valor. La fila de «Tomas» lo recibe de
 * `medicionesPorFamilia` y el titular del panel, de `valorQueRige`, las dos del dominio, que leen `effectiveMagnitude`
 * y tienen su prueba (`tomas-de-antropometria.test.ts`: «la fila muestra el valor que rige»). Lo que se exige es lo
 * mismo, y se fija en tres lugares: que las dos pantallas usen esas funciones; que ninguna lea por su cuenta el valor
 * que se tomó (`magnitude.value`); y que las funciones lean el vigente. El original entra a la pantalla solo por la
 * historia de la medición, rotulado como tal. La unidad de origen sí se lee: una corrección la conserva.
 */
test('T13 · el titular de la medición muestra el valor vigente, no el original', () => {
  const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');
  const lista = leer('apps/web/src/app/pro/advisees/anthropometry/evaluaciones.tsx');
  const panel = leer('apps/web/src/app/pro/advisees/anthropometry/medicion.tsx');
  assert.match(lista, /medicionesPorFamilia\(/, 'la lista de mediciones sale de medicionesPorFamilia, del dominio');
  assert.match(panel, /const titular = valorQueRige\(medicion\)/, 'el titular del panel sale de valorQueRige, del dominio');
  assert.match(panel, /className="medicion-abierta__valor">\{titular \?\? C\.sinValorVigente\}/, 'el titular del panel muestra ese valor, o dice que no hay uno vigente');
  for (const [nombre, fuente] of [['evaluaciones.tsx', lista], ['medicion.tsx', panel]]) {
    assert.doesNotMatch(fuente, /magnitude\??\.value/, `${nombre} no lee un valor por su cuenta: ni el original ni el vigente`);
  }
  // Las dos funciones leen el valor que rige; el original solo aparece en la historia (`historiaDeLaMedicion`).
  const dominio = leer('packages/domain/src/tomas-de-antropometria.ts');
  const cuerpoDe = (nombre) => {
    const desde = dominio.indexOf(nombre);
    assert.ok(desde >= 0, `se esperaba ${nombre} en el dominio`);
    return dominio.slice(desde, dominio.indexOf('\n}\n', desde));
  };
  assert.match(dominio, /export const valorQueRige = \(m: Pick<Medicion, 'effectiveMagnitude'>\)/, 'valorQueRige solo puede leer effectiveMagnitude');
  const fila = cuerpoDe('export function medicionesPorFamilia');
  assert.match(fila, /const rige = m\.effectiveMagnitude;/, 'la fila toma el valor de effectiveMagnitude');
  assert.doesNotMatch(fila, /m\.magnitude\.value/, 'la fila no muestra el valor original');
});

/**
 * WP-06 §9.2 · la guardia estructural de entrenamiento. «No realizada» es copy legítimo cuando el asesorado lo
 * registró y prohibido cuando se deriva de la ausencia (B10-06:794-796): la misma cadena, las dos cosas. Una lista
 * negra no las distingue. Esta prueba fija, sobre el código de las pantallas, que:
 * - ninguna pantalla escribe «No realizada» por su cuenta: el texto vive solo en el dominio;
 * - el estado de una ocurrencia se muestra solo a través de `vistaDeOcurrencia`, que llega a la condición únicamente
 *   por una ejecución registrada;
 * - ninguna pantalla lee `execution.sessionCondition` directamente, que es la puerta para saltearse esa función.
 */
test('WP-06 §9.2 · ninguna pantalla de entrenamiento deriva «No realizada» de la ausencia de registro', () => {
  const archivos = [...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/training')), join(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx')];
  assert.ok(archivos.length >= 7, `se esperaban las pantallas de entrenamiento, hay ${archivos.length}`);
  const hallazgos = [];
  for (const a of archivos) {
    const contenido = readFileSync(a, 'utf8');
    for (const { texto, linea } of textosDe(a, contenido)) if (/no realizad/i.test(texto)) hallazgos.push(`${a.slice(RAIZ.length + 1)}:${linea} escribe ${JSON.stringify(texto)}`);
    if (/execution\.sessionCondition/.test(contenido)) hallazgos.push(`${a.slice(RAIZ.length + 1)} lee execution.sessionCondition sin pasar por vistaDeOcurrencia`);
  }
  assert.deepEqual(hallazgos, []);
  // La pantalla que lista ocurrencias usa la función: si alguien la saca, esta línea lo dice.
  assert.match(readFileSync(join(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'), 'utf8'), /vistaDeOcurrencia\(/);
});

test('WP-06 §9.2 · la guardia detecta una pantalla que escribe «No realizada» o lee la condición suelta', () => {
  const contenido = "export const X = ({ o }) => <p>{o.execution.sessionCondition ? 'Registrada' : 'No realizada'}</p>;";
  const textos = textosDe('fixture.tsx', contenido).map((t) => t.texto);
  assert.ok(textos.some((t) => /no realizad/i.test(t)));
  assert.match(contenido, /execution\.sessionCondition/);
});
