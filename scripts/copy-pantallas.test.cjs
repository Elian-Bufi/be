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
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { basename, join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const {
  terminosProhibidosEn,
  terminosProhibidosDeAdministracionEn,
  terminosProhibidosDeAntropometriaEn,
  terminosProhibidosDeCarteraEn,
  terminosProhibidosDeEntrenamientoEn,
  terminosProhibidosDeFormulariosEn,
  CODIGO_INTERNO,
} = require('../packages/domain/dist/index.js');

const RAIZ = join(__dirname, '..');
/** Los textos también viven en módulos sin JSX (`.ts`): se leen como TypeScript, no como TSX. */
const tipoDeArchivo = (archivo) => (archivo.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
/** Las frases de Inicio y de los gráficos chicos que se arman fuera de las pantallas, en módulos puros. */
const movil = (archivo) => join(RAIZ, 'apps/mobile/src', archivo);
const tsx = (dir) => readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => join(dir, f));
/** La corrección de una sesión registrada en la APK (PA-04): su pantalla y su lógica. */
const CORRECCION_EN_LA_APK = [join(RAIZ, 'apps/mobile/src/pantallas/correccion-de-entrenamiento.tsx'), movil('correccion-de-la-sesion.ts')];

/**
 * Inicio (DL-117): cada tarjeta vive en el archivo de su módulo y se revisa con la lista de su dominio. Las piezas comunes
 * y la tarjeta de Información, que muestran texto de cualquier módulo, se revisan con las tres.
 */
const inicio = (archivo) => join(RAIZ, 'apps/mobile/src/pantallas', archivo);
const INICIO_COMUN = ['inicio.tsx', 'tarjeta-de-inicio.tsx', 'inicio-informacion.tsx'].map(inicio);
/**
 * WP-NOVEDADES-Y-AVISOS (DL-133): el centro de novedades muestra texto de cualquier módulo, como Inicio. Sus pantallas y
 * sus textos se revisan con todas las listas: una novedad dice qué pasó, nunca un puntaje ni un juicio.
 */
const NOVEDADES = [
  inicio('novedades.tsx'),
  inicio('cuenta-avisos-y-nombre.tsx'),
  // REV-A (DL-134): las revisiones propias, con todas las listas: el resultado se dice sin juicios ni puntajes.
  inicio('revisiones.tsx'),
  join(RAIZ, 'apps/web/src/components/centro-de-novedades.tsx'),
  join(RAIZ, 'apps/web/src/components/campana-de-novedades.tsx'),
  join(RAIZ, 'packages/domain/src/copy-novedades.ts'),
];
const INICIO_Y_NOVEDADES = [...INICIO_COMUN, ...NOVEDADES];
/** WP-APP-VUELTA-DE-ROSCA (DL-166): los textos nuevos y las piezas que los muestran. */
const VUELTA_DE_ROSCA = [
  ...['textos-de-la-vuelta.ts', 'desplegable.ts', 'perfil.ts', 'quien-ve-que.ts', 'inicio-de-hoy.ts'].map(movil),
  ...['perfil.tsx', 'quien-ve-que.tsx', 'cuenta.tsx'].map(inicio),
];
const SESION_DE_LA_VUELTA = ['textos-del-descanso.ts', 'descanso-automatico.ts', 'fila-fija.tsx'].map(movil);

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
      ...INICIO_Y_NOVEDADES,
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
      ...INICIO_Y_NOVEDADES,
    ],
    prohibidos: terminosProhibidosDeAntropometriaEn,
    minimo: 5,
  },
  {
    nombre: 'entrenamiento',
    archivos: [
      ...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/training')),
      join(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'),
      // PA-04: la corrección dejó entrenamiento.tsx y vive en su pantalla y su módulo; siguen bajo la misma guardia.
      ...CORRECCION_EN_LA_APK,
      inicio('inicio-entrenamiento.tsx'),
      movil('lecturas-de-inicio.ts'),
      // PA-03: el registro rápido («Ya la hice»), su pantalla y sus textos.
      inicio('registro-rapido.tsx'),
      movil('registro-rapido.ts'),
      // WP-APP-VUELTA-DE-ROSCA (DL-166): la sesión con el descanso automático y el desglose de «Tu historial».
      ...SESION_DE_LA_VUELTA,
      ...INICIO_Y_NOVEDADES,
    ],
    prohibidos: terminosProhibidosDeEntrenamientoEn,
    minimo: 7,
  },
  {
    // WP-ESCRITORIO-AMABLE, parte 5: el Espacio profesional (los pendientes de la cartera y el directorio). Una lista de
    // personas no califica a nadie: ni «inactivo», ni «riesgo», ni un porcentaje (TEST-PRJ-009; DL-107).
    nombre: 'el espacio profesional',
    archivos: [...tsx(join(RAIZ, 'apps/web/src/app/pro')), ...['directorio.ts', 'pendiente-en-una-fila.ts', 'mesa.ts', 'cajon.ts', 'lugar-del-espacio.ts'].map((archivo) => join(RAIZ, 'apps/web/src/app/pro', archivo))],
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
    // WP-FORMULARIOS-RONDA-2, FR-10 (DL-165 D-9): los hábitos de la persona, en la APK («Mis hábitos», compartirlos, la
    // pregunta por un profesional nuevo y «¿Sigue igual?») y en el website («Sus hábitos»), con su copy. Hablan de las dos
    // áreas: pasan por la lista de los formularios, la de nutrición y la de entrenamiento.
    nombre: 'los hábitos de la persona',
    archivos: [
      inicio('mis-habitos.tsx'),
      movil('habitos-en-el-telefono.ts'),
      movil('pregunta-v2.tsx'),
      join(RAIZ, 'apps/web/src/app/pro/advisees/forms/sus-habitos.ts'),
      join(RAIZ, 'apps/web/src/app/pro/advisees/forms/tarjeta-de-sus-habitos.tsx'),
      // Ronda 2.1 (DL-165 D-22): «Sumar «Tus hábitos»» en el cajón de «Pedir información».
      join(RAIZ, 'apps/web/src/app/pro/advisees/forms/sumar-habitos.ts'),
      join(RAIZ, 'packages/domain/src/copy-habitos-de-la-persona.ts'),
    ],
    prohibidos: (texto) => [...new Set([...terminosProhibidosDeFormulariosEn(texto), ...terminosProhibidosEn(texto), ...terminosProhibidosDeEntrenamientoEn(texto)])],
    minimo: 6,
  },
  {
    // WP-APP-VUELTA-DE-ROSCA (DL-166): Perfil, «Quién ve qué», Inicio y la sesión con su descanso hablan de todas las áreas
    // y de los formularios: pasan por todas las listas. Ubican, nunca califican.
    nombre: 'la vuelta de rosca de la APK',
    archivos: VUELTA_DE_ROSCA,
    prohibidos: (texto) => [
      ...new Set([...terminosProhibidosDeFormulariosEn(texto), ...terminosProhibidosEn(texto), ...terminosProhibidosDeEntrenamientoEn(texto), ...terminosProhibidosDeAntropometriaEn(texto), ...terminosProhibidosDeCarteraEn(texto)]),
    ],
    minimo: 8,
  },
  {
    // WP-NOTAS-DE-COORDINACION (DL-140): el diálogo y el Resumen del website, la pantalla de la APK y su copy. Una nota habla
    // de cualquier área: pasa por la lista de nutrición y por la de la cartera, que ya reúne las de entrenamiento,
    // antropometría e información.
    nombre: 'las notas de coordinación',
    archivos: [
      join(RAIZ, 'apps/web/src/app/pro/advisees/nota-de-coordinacion.tsx'),
      join(RAIZ, 'apps/web/src/app/pro/advisees/seguimiento/notas-del-equipo.tsx'),
      inicio('notas-de-coordinacion.tsx'),
      join(RAIZ, 'packages/domain/src/copy-notas-de-coordinacion.ts'),
    ],
    prohibidos: (texto) => [...new Set([...terminosProhibidosEn(texto), ...terminosProhibidosDeCarteraEn(texto)])],
    minimo: 4,
  },
  {
    // WP-ESCRITORIO-AREAS, parte 10: las piezas de una revisión que comparten Nutrición y Entrenamiento (la evidencia por
    // día, la revisión en preparación, el período y su ayuda). Muestran texto de las dos áreas: pasan por las dos listas.
    // Hasta acá la evidencia no la miraba ninguna prueba de palabras.
    nombre: 'la revisión de Nutrición y de Entrenamiento',
    // WP-TABLERO-ALTA-GAMA TB-15: «¿Cuándo la revisás?» y aplicar una revisión, que comparten las dos áreas y el cajón.
    archivos: [
      ...['evidencia-de-revision.tsx', 'revision-en-preparacion.tsx', 'ayuda-de-revisiones.tsx', 'evidencia.ts', 'periodo-de-la-revision.ts', 'cuando-la-revisas.tsx', 'aplicar-la-revision.ts'].map((archivo) => join(RAIZ, 'apps/web/src/app/pro/advisees', archivo)),
      join(RAIZ, 'apps/web/src/lib/cuando-la-revisas.ts'),
    ],
    prohibidos: (texto) => [...new Set([...terminosProhibidosEn(texto), ...terminosProhibidosDeEntrenamientoEn(texto)])],
    minimo: 5,
  },
  {
    // WP-TABLERO-ALTA-GAMA TB-48: los topes de un plan, avisados antes de guardar, y duplicar, reordenar y quitar en los
    // editores de las dos áreas.
    nombre: 'los editores de los planes',
    archivos: [join(RAIZ, 'apps/web/src/app/pro/advisees/topes-del-plan.ts'), join(RAIZ, 'apps/web/src/app/pro/advisees/editar-la-estructura.ts'), join(RAIZ, 'apps/web/src/app/pro/advisees/revisar-el-plan.ts'), join(RAIZ, 'apps/web/src/app/pro/advisees/nutrition/recetas-para-elegir.ts'), join(RAIZ, 'apps/web/src/app/pro/exercises/zonas-propias.ts')],
    prohibidos: (texto) => [...new Set([...terminosProhibidosEn(texto), ...terminosProhibidosDeEntrenamientoEn(texto)])],
    minimo: 1,
  },
  {
    // DL-141 D-6 (encargo de Dirección del 2026-10-19, bloque 4): el origen de un ítem en la fila del buscador, en Nutrición
    // y en Entrenamiento. Su texto vive en el dominio y lo muestra un componente común: pasan por las dos listas.
    nombre: 'el origen en la fila del buscador',
    archivos: [join(RAIZ, 'apps/web/src/components/origen-en-el-catalogo.tsx'), join(RAIZ, 'packages/domain/src/copy-origen-en-el-catalogo.ts')],
    prohibidos: (texto) => [...new Set([...terminosProhibidosEn(texto), ...terminosProhibidosDeEntrenamientoEn(texto)])],
    minimo: 2,
  },
  {
    // WP-ADMINISTRACION (DL-155): la consola de Administración y su copy. B10-03 §20: se dice verificación, habilitación,
    // observación, suspensión y rehabilitación, por área; nunca «certificado por BE», «profesional aprobado» ni una
    // sanción, tampoco negados. Pasa además por la lista de nutrición y por la de la cartera: la consola no califica a nadie.
    nombre: 'la administración',
    archivos: [
      ...tsx(join(RAIZ, 'apps/web/src/app/admin')),
      ...tsx(join(RAIZ, 'apps/web/src/app/admin/professional')),
      ...tsx(join(RAIZ, 'apps/web/src/app/admin/security')),
      // RF-068 (DL-172): las incidencias en la consola y sus textos.
      ...tsx(join(RAIZ, 'apps/web/src/app/admin/incidents')),
      join(RAIZ, 'packages/domain/src/incidencias.ts'),
      join(RAIZ, 'packages/domain/src/copy-administracion.ts'),
    ],
    prohibidos: (texto) => [...new Set([...terminosProhibidosDeAdministracionEn(texto), ...terminosProhibidosEn(texto), ...terminosProhibidosDeCarteraEn(texto)])],
    minimo: 14,
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
 * prueba, y si alguno de esos lugares deja de existir, también (la lista no puede quedar con permisos de más). Desde
 * TB-51 hay un segundo porcentaje, también contado: el de cada parte de la barra de la composición (D-11, modificada).
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
  // TB-51 (DL-163 D-11, modificada por Dirección el 2026-11-07: «kilos con el % al lado»): el porcentaje de cada parte de
  // la barra de la última toma, junto a sus kilos. El 100 % es el peso de esa toma: dice de qué está hecho, no cuánto se
  // cumplió. Se escribe en un solo lugar, `porcentajeEnPalabras`.
  'composicion.ts · %',
];

test('T13 · el copy de la ficha del asesorado no tiene puntajes, juicios ni huecos completados; sus porcentajes son el cambio relativo y el de la composición (TB-51)', () => {
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
  const archivos = [...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/training')), join(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'), ...CORRECCION_EN_LA_APK];
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

/**
 * D-C2 (prueba breve del 2026-10-29): la lista de «Tu historial» mostraba la condición del registro original aunque la
 * sesión estuviera corregida. Lo que rige sale de `registroVigente` (REG-06-16): ninguna pantalla de la APK ni del
 * entrenamiento del website escribe la condición leyendo `.original` directo. El original se muestra solo donde se
 * rotula como tal («Registro original»), y ahí no pasa por esta función.
 */
const CONDICION_DEL_ORIGINAL = /etiquetaDeCondicionRegistrada\(\s*[\w.]*\.original\s*\)/;

test('D-C2 · ninguna pantalla muestra la condición del original como si fuera la que rige', () => {
  const archivos = [...tsx(join(RAIZ, 'apps/mobile/src/pantallas')), ...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/training'))];
  assert.ok(archivos.length >= 30, `se esperaban las pantallas de la APK y del entrenamiento del website, hay ${archivos.length}`);
  const hallazgos = archivos.filter((a) => CONDICION_DEL_ORIGINAL.test(readFileSync(a, 'utf8'))).map((a) => a.slice(RAIZ.length + 1));
  assert.deepEqual(hallazgos, []);
  // El historial de la APK, que es donde estaba el defecto, lee lo vigente.
  assert.match(readFileSync(join(RAIZ, 'apps/mobile/src/pantallas/historial.tsx'), 'utf8'), /etiquetaDeCondicionRegistrada\(registroVigente\(e\)\)/);
});

test('D-C2 · la guardia detecta la condición leída del original', () => {
  assert.match('<Insignia texto={etiquetaDeCondicionRegistrada(e.original)} />', CONDICION_DEL_ORIGINAL);
  assert.match('etiquetaDeCondicionRegistrada( x.ejecucion.original )', CONDICION_DEL_ORIGINAL);
  assert.doesNotMatch('etiquetaDeCondicionRegistrada(registroVigente(e))', CONDICION_DEL_ORIGINAL);
});

/**
 * PA-06 (2026-11-02): los íconos de la APK son los de la familia de BE (`apps/mobile/src/icono.tsx`), dibujados con
 * elementos y no con `SvgXml`, y ningún texto hace de ícono. La tilde, el aviso y las flechas escritos como letras se
 * leían en voz alta («marca de verificación»), no cambiaban con el tema como el resto, y la tilde suelta se leía como
 * «aprobado». La tilde de la familia va solo dentro de una casilla.
 */
const GLIFOS = /[✓✔⚠↑↓‹›]/;

test('PA-06 · la APK no escribe glifos como íconos ni dibuja íconos con SvgXml', () => {
  const archivos = [];
  const recorrer = (dir) => {
    for (const nombre of readdirSync(dir, { withFileTypes: true })) {
      const ruta = join(dir, nombre.name);
      if (nombre.isDirectory()) recorrer(ruta);
      else if (/\.tsx?$/.test(nombre.name)) archivos.push(ruta);
    }
  };
  recorrer(join(RAIZ, 'apps/mobile/src'));
  archivos.push(join(RAIZ, 'apps/mobile/App.tsx'));
  assert.ok(archivos.length >= 60, `se esperaban los archivos de la APK, hay ${archivos.length}`);
  const hallazgos = [];
  for (const a of archivos) {
    const contenido = readFileSync(a, 'utf8');
    for (const { texto, linea } of textosDe(a, contenido)) if (GLIFOS.test(texto)) hallazgos.push(`${a.slice(RAIZ.length + 1)}:${linea} escribe ${JSON.stringify(texto)}`);
    // Los comentarios no cuentan: el de icono.tsx explica por qué no se usa.
    const codigo = contenido.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    if (/\bSvgXml\b/.test(codigo)) hallazgos.push(`${a.slice(RAIZ.length + 1)} usa SvgXml`);
  }
  assert.deepEqual(hallazgos, []);
  assert.ok(GLIFOS.test('✓ Guardado') && GLIFOS.test('‹ Anterior') && !GLIFOS.test('Anterior'), 'la guardia reconoce los glifos');
});

/**
 * ED-05 (WP-EDITORES-PROFESIONAL; TEST-EDP-006): ningún texto del website profesional ni de los diccionarios de textos del
 * dominio dice un código interno del equipo (DL-…, TB-…, RF-…, UC-…, API-…, REG-…, INV-…, «ronda»). «Pedir información»
 * mostraba el propósito guardado de una plantilla, con «Sucede a la v2 (DL-165, ronda 2.1)» (la captura C13).
 *
 * Los nombres de las lecturas de «Otras áreas» son identificadores que usan sus pruebas, no texto a la vista: están
 * contados uno por uno, y si alguno deja de existir, la prueba también falla.
 */
const CODIGOS_QUE_NO_SE_MUESTRAN = ['otras-areas.ts · API-RES-04', 'otras-areas.ts · API-RES-06', 'otras-areas.ts · API-RES-07'];
const archivosDe = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const ruta = join(dir, f);
    return statSync(ruta).isDirectory() ? archivosDe(ruta) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [ruta] : [];
  });
const SIN_CODIGOS = [
  ...archivosDe(join(RAIZ, 'apps/web/src/app/pro')),
  ...readdirSync(join(RAIZ, 'packages/domain/src'))
    .filter((f) => /^copy.*\.ts$/.test(f) && !f.includes('.test.'))
    .map((f) => join(RAIZ, 'packages/domain/src', f)),
  join(RAIZ, 'packages/domain/src/descripciones-de-plantillas.ts'),
];

test('ED-05 · ningún texto del website profesional ni de los diccionarios del dominio dice un código interno', () => {
  assert.ok(SIN_CODIGOS.length >= 150, `se esperaban las pantallas de /pro y los diccionarios, hay ${SIN_CODIGOS.length}`);
  const permitidos = new Set();
  const hallazgos = SIN_CODIGOS.flatMap((a) =>
    textosDe(a)
      .filter(({ texto }) => CODIGO_INTERNO.test(texto))
      .flatMap(({ texto, linea }) => {
        const lugar = `${basename(a)} · ${texto}`;
        if (CODIGOS_QUE_NO_SE_MUESTRAN.includes(lugar)) {
          permitidos.add(lugar);
          return [];
        }
        return [`${a.slice(RAIZ.length + 1)}:${linea} ${JSON.stringify(texto)}`];
      }),
  );
  assert.deepEqual(hallazgos, []);
  assert.deepEqual([...permitidos].sort(), [...CODIGOS_QUE_NO_SE_MUESTRAN].sort(), 'cada identificador permitido sigue existiendo: si se fue, se saca de la lista');
});

test('ED-05 · la guardia de códigos encuentra «(DL-1)» en un texto y no en un comentario (prueba de la prueba)', () => {
  const textos = textosDe('prueba.tsx', ['// DL-1 en un comentario', 'export const P = () => <p>Sucede a la v1 (DL-1)</p>;'].join(String.fromCharCode(10)));
  assert.deepEqual(textos.filter(({ texto }) => CODIGO_INTERNO.test(texto)).map(({ texto }) => texto), ['Sucede a la v1 (DL-1)']);
});

/**
 * ED-06 (WP-EDITORES-PROFESIONAL; TEST-EDP-007; ED-D9, decidida): el website profesional dice «persona» (o el nombre, o
 * la referencia neutral) y nunca «asesorado»; el legajo no cambia. Se revisan las pantallas de /pro, los componentes y
 * las piezas del website, y los textos del dominio que muestran.
 *
 * No son texto a la vista las claves, las rutas, los `id` y los nombres de íconos («tus-asesorados», «ASESORADO»). Y
 * quedan, contados uno por uno, los que cambian en otro momento:
 * - los textos legales con versión, que cambian en su versión siguiente;
 * - lo que también devuelve la API (el mensaje del 409 de la app de la persona y la referencia neutral de quien no tiene
 *   nombre), que cambia en la ventana de la API (ED-08, etapa 2; R1).
 */
const ES_IDENTIFICADOR = /^[a-z0-9#./_-]+$|^[A-Z0-9_]+$/;
const ASESORADO_FUERA_DE_ESTA_ETAPA = [
  'textos.ts · 1. BE es una plataforma que ayuda a asesorados',
  'textos.ts · Esta información es sobre una sola categoría',
  'compatibilidad-de-clientes.ts · Este plan tiene objetivos distintos',
  'contratos-perfil-propio.ts · Asesorado ·',
];
const DEL_DOMINIO = (archivo) => join(RAIZ, 'packages/domain/src', archivo);
const CON_PERSONA = [
  ...archivosDe(join(RAIZ, 'apps/web/src/app/pro')),
  ...archivosDe(join(RAIZ, 'apps/web/src/components')),
  ...archivosDe(join(RAIZ, 'apps/web/src/lib')),
  ...readdirSync(join(RAIZ, 'packages/domain/src'))
    .filter((f) => /^copy.*\.ts$/.test(f) && !f.includes('.test.'))
    .map(DEL_DOMINIO),
  ...['versiones-de-plan.ts', 'lectura-del-plan-de-entrenamiento.ts', 'cartera.ts', 'compatibilidad-de-clientes.ts', 'exportacion-del-analisis.ts', 'contratos-perfil-propio.ts', 'textos.ts'].map(DEL_DOMINIO),
];

test('ED-06 · el website profesional dice «persona», nunca «asesorado» (salvo lo contado, que cambia en otro momento)', () => {
  assert.ok(CON_PERSONA.length >= 200, `se esperaban las pantallas, las piezas y los textos del dominio, hay ${CON_PERSONA.length}`);
  const contados = new Set();
  const hallazgos = CON_PERSONA.flatMap((a) =>
    textosDe(a)
      .filter(({ texto }) => /asesorad/i.test(texto) && !ES_IDENTIFICADOR.test(texto))
      .flatMap(({ texto, linea }) => {
        const contado = ASESORADO_FUERA_DE_ESTA_ETAPA.find((x) => x === `${basename(a)} · ${texto.slice(0, x.length - basename(a).length - 3)}`);
        if (contado) {
          contados.add(contado);
          return [];
        }
        return [`${a.slice(RAIZ.length + 1)}:${linea} ${JSON.stringify(texto.slice(0, 120))}`];
      }),
  );
  assert.deepEqual(hallazgos, []);
  assert.deepEqual([...contados].sort(), [...ASESORADO_FUERA_DE_ESTA_ETAPA].sort(), 'cada excepción sigue existiendo: si se fue, se saca de la lista');
});

test('ED-06 · la guardia encuentra «Tus asesorados» y deja pasar una clave (prueba de la prueba)', () => {
  const textos = textosDe('prueba.tsx', 'export const P = () => <section id="tus-asesorados"><h2>Tus asesorados</h2><Icono nombre="asesorados" /></section>;');
  assert.deepEqual(textos.filter(({ texto }) => /asesorad/i.test(texto) && !ES_IDENTIFICADOR.test(texto)).map(({ texto }) => texto), ['Tus asesorados']);
});

/**
 * DJ-6 (WP-EDITORES-PROFESIONAL; ED-15): la versión en preparación lleva número, el de las activadas más uno (hay una
 * sola por plan). Ningún texto del website profesional dice que no lo tiene: «Cómo se lee el Plan» lo decía en las dos
 * áreas, mientras «Antes de activar» nombraba «la versión 9» (revisión adversaria de la etapa 1).
 */
const SIN_NUMERO = /(en preparación|borrador)[^.]*no (tiene|lleva) número/i;

test('DJ-6 · ningún texto del website profesional dice que la versión en preparación no tiene número', () => {
  const hallazgos = CON_PERSONA.flatMap((a) =>
    textosDe(a)
      .filter(({ texto }) => SIN_NUMERO.test(texto))
      .map(({ texto, linea }) => `${a.slice(RAIZ.length + 1)}:${linea} ${JSON.stringify(texto.slice(0, 120))}`),
  );
  assert.deepEqual(hallazgos, []);
});

test('DJ-6 · la guardia encuentra la frase vieja en un texto y no en un comentario (prueba de la prueba)', () => {
  const textos = textosDe('prueba.tsx', '// Un borrador no lleva número.\nexport const P = () => <p>Es la 1. Una versión en preparación todavía no tiene número.</p>;');
  assert.deepEqual(textos.filter(({ texto }) => SIN_NUMERO.test(texto)).map(({ texto }) => texto), ['Es la 1. Una versión en preparación todavía no tiene número.']);
});
