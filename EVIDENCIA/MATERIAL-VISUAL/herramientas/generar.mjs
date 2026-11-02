// Genera las fichas (RECETAS.md, ALIMENTOS.md, EJERCICIOS.md) y el inventario (inventario.json) del material visual desde
// fuentes que no se copian a mano: el manifiesto congelado de las recetas, la selección (seleccion.mjs), los prompts
// originales del paquete de Entrenamiento y las tres imágenes reales del repositorio (medidas leídas de sus bytes).
// Sin red, sin API y sin dependencias: solo Node 22. Uso, desde la raíz del repositorio:
//   node EVIDENCIA/MATERIAL-VISUAL/herramientas/generar.mjs
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archivoEsperado, leerManifiesto, medidasDeImagen, sinTildes } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs';
import { ALIMENTOS, ALIMENTOS_AFUERA, COMO_SE_MUESTRA, EJERCICIOS, ESTILO_DE_ALIMENTOS, ESTILO_DE_EJERCICIOS, ESTILO_DE_RECETAS, EXTERNAS_DESCARTADAS, RECETAS } from './seleccion.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CARPETA = join(AQUI, '..');
const RAIZ = join(CARPETA, '..', '..');
const COMMIT_DE_REFERENCIA = 'e4512cb';
const PAQUETE = join(RAIZ, 'docs', 'fuente_entrenamiento', 'BE_Entrenamiento_Autonomo_2026-10-06');
const PROMPTS_DEL_PAQUETE = Object.fromEntries(JSON.parse(fs.readFileSync(join(PAQUETE, 'fuentes', 'PROMPTS_IMAGENES.json'), 'utf8')).map((p) => [p.key, p.prompt]));
const CATALOGO_DEL_PAQUETE = Object.fromEntries(JSON.parse(fs.readFileSync(join(PAQUETE, 'ejercicios', 'CATALOGO.json'), 'utf8')).assets.map((a) => [a.fixtureKey, a]));
const PROMPT_POR_CLAVE = { sentadilla_goblet: 'goblet', peso_muerto_rumano_mancuernas: 'rdl', zancada_estatica: 'lunge' };

const ESTADO_EN_PALABRAS = { RAW: 'crudo', COOKED: 'cocido', AS_PURCHASED: 'listo para consumir' };
const PENDIENTE = 'PENDIENTE_DE_GENERACION';
const REAL = 'ARCHIVO_REAL_PENDIENTE_DE_REVISION_HUMANA';
const recipiente = { plato: 'plato playo blanco liso de 26 cm', cuenco: 'cuenco blanco liso de 15 cm', vaso: 'vaso de vidrio liso de 300 ml' };

const manifiesto = leerManifiesto();

/** Las medidas de un archivo real del repositorio, leídas de sus bytes (sin decodificarlo). */
function archivoReal(ruta) {
  // La ruta puede ser del repositorio o absoluta (las imágenes nuevas viven fuera, en C:/Users/bufim/BE-material-visual).
  const bytes = fs.readFileSync(resolve(RAIZ, ruta));
  const m = medidasDeImagen(bytes);
  return { ruta, tipo: m?.tipo ?? null, ancho: m?.ancho ?? null, alto: m?.alto ?? null, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

// ─── Recetas ──────────────────────────────────────────────────────────────────────────────────────────────────

function promptDeReceta(r, s) {
  // El nombre del catálogo ya dice el estado («Avena arrollada, cruda»): el prompt no lo repite.
  const ingredientes = r.ingredientes.map((i) => `${i.nombre}: ${i.cantidad.valor} ${i.cantidad.unidad}`).join('; ');
  return [
    ...ESTILO_DE_RECETAS,
    `Recipiente: ${recipiente[s.recipiente]}.`,
    `Receta: «${r.nombre}», ${r.porciones} porción. Ingredientes, en estas cantidades: ${ingredientes}.`,
    `Preparación: ${r.pasos.join(' ')}`,
    `Presentación: ${s.presentacion}`,
    `No debe aparecer: ${s.noDebe.join(', ')}.`,
  ].join('\n');
}

const recetas = manifiesto.recetas.map((r) => {
  const s = RECETAS[r.numero];
  if (!s) throw new Error(`falta la presentación de la receta ${r.numero}`);
  if (r.imagen !== archivoEsperado(r)) throw new Error(`receta ${r.numero}: el manifiesto espera «${r.imagen}» y el nombre da «${archivoEsperado(r)}»`);
  return {
    id: `receta-${String(r.numero).padStart(2, '0')}`,
    tipo: 'receta',
    identificador: { manifiesto: 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.json', numero: r.numero },
    nombre: r.nombre,
    archivo: r.imagen,
    archivoReal: s.archivoReal ? archivoReal(s.archivoReal) : null,
    dondeSeMuestra: `Website: ${COMO_SE_MUESTRA.receta.web}. APK: ${COMO_SE_MUESTRA.receta.apk}.`,
    formato: 'Horizontal 4:3, al menos 1600 × 1200 px, hasta 10 MB; el plato dentro de la franja central de 16:10',
    procedencia: 'A generar con IA para BE: se sube con la procedencia AI_GENERATED y la autoría «Generada por IA para BE» (manifiesto.json, «imagenes»)',
    prompt: promptDeReceta(r, s),
    herramienta: null,
    fuenteYAtribucion: null,
    estadoDeRevision: s.archivoReal ? REAL : PENDIENTE,
    observaciones: [s.archivoReal ? 'Imagen cargada en la selección: falta la revisión humana.' : 'Sin herramienta de generación de imágenes en esta sesión: la ficha y el prompt están listos; no hay imagen.'],
    ingredientes: r.ingredientes.map((i) => ({ nombre: i.nombre, cantidad: `${i.cantidad.valor} ${i.cantidad.unidad}`, estado: i.estado, catalogItemId: i.catalogItemId })),
    pasos: r.pasos,
    presentacion: s.presentacion,
    noDebe: s.noDebe,
  };
});

// ─── Alimentos ────────────────────────────────────────────────────────────────────────────────────────────────

const alimentos = ALIMENTOS.map((a) => ({
  id: `alimento-${a.codigo}`,
  tipo: 'alimento',
  identificador: { catalogItemId: a.catalogItemId, catalogItemVersionId: a.catalogItemVersionId, fdcId: a.fdcId, catalogo: 'Catálogo base de BE (USDA FoodData Central · SR Legacy, DL-141)' },
  nombre: a.nombre,
  estado: a.estado,
  archivo: `${a.codigo}-${sinTildes(a.nombre)}.jpg`,
  archivoReal: a.archivoReal ? archivoReal(a.archivoReal) : null,
  dondeSeMuestra: COMO_SE_MUESTRA.alimento.donde,
  formato: 'Cuadrado 1:1, 1200 × 1200 px (propuesto: no hay un recorte real porque hoy no se muestra en ningún lado)',
  procedencia: 'A generar con IA para BE (material preparado)',
  prompt: [...ESTILO_DE_ALIMENTOS, `Alimento: «${a.nombre}», ${ESTADO_EN_PALABRAS[a.estado]}.`, `Mostrar: ${a.imagen}`, `No debe aparecer: ${a.noDebe.join(', ')}.`].join('\n'),
  herramienta: null,
  fuenteYAtribucion: null,
  estadoDeRevision: a.archivoReal ? REAL : PENDIENTE,
  observaciones: [`Uso en BE: ${a.uso}.`, ...(a.observacion ? [a.observacion] : []), `Equivalente del catálogo sintético de WP-04: «${a.equivalenteDeDemostracion.clave}» (${a.equivalenteDeDemostracion.id}), cuyo nombre no dice el estado.`],
}));

// ─── Ejercicios ───────────────────────────────────────────────────────────────────────────────────────────────

const ejercicios = EJERCICIOS.map((e) => {
  if (e.origen === 'PAQUETE') {
    const a = CATALOGO_DEL_PAQUETE[e.clave];
    return {
      id: `ejercicio-${e.codigo}`,
      tipo: 'ejercicio',
      identificador: { paquete: `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/ejercicios/CATALOGO.json · ${e.clave}`, catalogo: e.identidad },
      nombre: e.nombre,
      archivo: e.archivoReal.split('/').at(-1),
      archivoReal: archivoReal(e.archivoReal),
      dondeSeMuestra: `Website: ${COMO_SE_MUESTRA.ejercicio.web}. APK: ${COMO_SE_MUESTRA.ejercicio.apk}. ${COMO_SE_MUESTRA.ejercicio.donde}.`,
      formato: 'PNG con transparencia, vertical; BE la guarda como JPEG sobre blanco',
      procedencia: `${a.origin} (${a.createdDate}); no muestra una persona real; sin licencia de terceros (externalLicenseIdentifier: null)`,
      prompt: PROMPTS_DEL_PAQUETE[PROMPT_POR_CLAVE[e.clave]],
      herramienta: a.generationMethod,
      fuenteYAtribucion: null,
      estadoDeRevision: REAL,
      observaciones: [
        `Implemento: ${e.implemento}. Uso: ${e.uso}.`,
        `Revisión técnica del paquete: ${a.technicalReviewStatus}. Ilustra para reconocer el ejercicio; no certifica la técnica.`,
        'Revisado a ojo el 2026-10-28 (no es la revisión profesional): equipo y agarre correctos, dos brazos, dos manos y dos piernas, apoyos plausibles, cuerpo entero con margen.',
        'Contorno: un halo rojizo en los píxeles semitransparentes. Sobre blanco (como la guarda y la muestra BE) queda en un 0,1 % de la imagen, con un tinte máximo de 35 a 41 niveles: no se nota a 112 dp; se notaría solo con transparencia sobre un fondo oscuro, que BE no usa.',
        'El prompt original está en inglés: es el del paquete de Dirección, tal cual.',
      ],
    };
  }
  const extra = [e.distinguir, e.decidir].filter(Boolean);
  return {
    id: `ejercicio-${e.codigo}`,
    tipo: 'ejercicio',
    identificador: { exerciseId: e.exerciseId, versionId: e.versionId, catalogo: 'Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento)' },
    nombre: e.nombre,
    archivo: `${e.codigo}-${sinTildes(e.nombre)}.jpg`,
    archivoReal: e.archivoReal ? archivoReal(e.archivoReal) : null,
    dondeSeMuestra: `Hoy en ningún lado: ${COMO_SE_MUESTRA.ejercicio.donde}. Si se cargara como ejercicio propio, se vería como las del paquete (website 5:6 y 1:1; APK 112 dp, 64 dp y 1:1, enteras sobre blanco).`,
    formato: 'Vertical 5:6, al menos 1000 × 1200 px, sobre blanco #FFFFFF',
    procedencia: 'A generar con IA para BE, en el estilo de las tres del paquete',
    prompt: [...ESTILO_DE_EJERCICIOS, `Ejercicio: «${e.nombre}». Implemento: ${e.implemento}.`, `Postura: ${e.postura}`, `No debe aparecer: ${e.evitar.join(', ')}.`].join('\n'),
    herramienta: null,
    fuenteYAtribucion: null,
    estadoDeRevision: e.archivoReal ? REAL : PENDIENTE,
    observaciones: [`Uso: ${e.uso}.`, ...extra, 'Cuando exista, queda pendiente de revisión humana (técnica y anatomía) antes de usarla como demostración.'],
  };
});

// ─── Inventario ───────────────────────────────────────────────────────────────────────────────────────────────

const todos = [...recetas, ...alimentos, ...ejercicios];
const inventario = {
  inventario: 'Material visual de BE: 16 recetas, 16 alimentos y 15 ejercicios (encargo nocturno de Dirección del 2026-10-27, §2 a §4)',
  commitDeReferencia: COMMIT_DE_REFERENCIA,
  generadoPor: 'EVIDENCIA/MATERIAL-VISUAL/herramientas/generar.mjs',
  generacionDeImagenes: 'No disponible en la sesión que preparó el material: no se generó ninguna imagen ni se contrató ningún servicio. Lo que no tiene archivoReal es una ficha con su prompt, no una imagen.',
  estados: { [PENDIENTE]: 'Ficha y prompt listos; sin imagen', [REAL]: 'Hay un archivo real; falta la revisión humana' },
  resumen: {
    recetas: recetas.length,
    alimentos: alimentos.length,
    ejercicios: ejercicios.length,
    conArchivoReal: todos.filter((x) => x.archivoReal).length,
    pendientesDeGeneracion: todos.filter((x) => x.estadoDeRevision === PENDIENTE).length,
  },
  contenidos: todos,
};
fs.writeFileSync(join(CARPETA, 'inventario.json'), JSON.stringify(inventario, null, 2) + '\n');

// ─── Fichas en Markdown ───────────────────────────────────────────────────────────────────────────────────────

const bloque = (texto) => ['```text', texto, '```'].join('\n');
const pie = `\n---\nGenerado por \`herramientas/generar.mjs\` desde el manifiesto congelado y \`herramientas/seleccion.mjs\` (commit de referencia \`${COMMIT_DE_REFERENCIA}\`). No editar a mano: cambiar la selección y volver a generar.\n`;

const md = {};
md.RECETAS = [
  '# Recetas · fichas y prompts (16)',
  '',
  'Las dieciséis recetas de ejemplo del manifiesto congelado, con su archivo esperado, lo que lleva cada una y el prompt para',
  'generar su foto. **Ninguna tiene imagen todavía:** esta sesión no tenía una herramienta que genere imágenes, y un prompt',
  'no es una imagen. La foto es una referencia visual: no mide la porción ni cambia ningún cálculo.',
  '',
  '## Cómo se va a ver',
  '',
  `- **Website:** ${COMO_SE_MUESTRA.receta.web}.`,
  `- **APK:** ${COMO_SE_MUESTRA.receta.apk}.`,
  `- **Servidor:** ${COMO_SE_MUESTRA.receta.servidor}.`,
  `- **El criterio que ya existía:** ${COMO_SE_MUESTRA.receta.criterioPrevio}. Las fichas lo usan tal cual.`,
  '',
  'Con una foto 4:3 y el plato dentro de la franja central de 16:10 (un doceavo del alto libre arriba y abajo), el plato se ve',
  'entero en las dos: el website no recorta una 4:3 y la APK recorta solo esas dos franjas. La maqueta de',
  '`encuadre-de-recetas.svg` lo dibuja.',
  '',
  '**A prestar atención al generarlas:** muchas herramientas entregan 1536 × 1024 (3:2) o 1024 × 1024. La revisión de',
  '`recetas.mjs` pide entre 1,25 y 1,40 de proporción y 1600 px en el lado mayor: hay que pedir 4:3 o recortar a 4:3 y',
  'escalar a 1600 × 1200 antes de subirla, con el plato todavía dentro de la franja central.',
  '',
  '## El estilo común (va al principio de cada prompt)',
  '',
  ...ESTILO_DE_RECETAS.map((l) => `- ${l}`),
  '',
  ...recetas.flatMap((r) => [
    `## ${String(r.identificador.numero).padStart(2, '0')} · ${r.nombre}`,
    '',
    `- **Archivo esperado:** \`${r.archivo}\` (el del manifiesto; \`fotoDe\` lo busca por el número). **Estado:** ficha lista, sin imagen.`,
    '',
    '| Ingrediente | Cantidad | Estado |',
    '|---|---|---|',
    ...r.ingredientes.map((i) => `| ${i.nombre} | ${i.cantidad} | ${ESTADO_EN_PALABRAS[i.estado]} |`),
    '',
    `- **Preparación:** ${r.pasos.join(' ')}`,
    `- **Presentación:** ${r.presentacion}`,
    `- **No debe aparecer:** ${r.noDebe.join(', ')}.`,
    '',
    '<details><summary>Prompt</summary>',
    '',
    bloque(r.prompt),
    '',
    '</details>',
    '',
  ]),
  pie,
].join('\n');

md.ALIMENTOS = [
  '# Alimentos · fichas y prompts (16)',
  '',
  'Dieciséis alimentos del catálogo real, distintos entre sí, con el estado que dice su ficha. **Ninguno tiene imagen:**',
  'esta sesión no tenía una herramienta que genere imágenes.',
  '',
  `**Dónde se verían:** ${COMO_SE_MUESTRA.alimento.donde}.`,
  '',
  '## Cómo se eligieron',
  '',
  '- **Del catálogo base de USDA (DL-141), que dice el estado en el nombre** («Arroz blanco de grano largo, cocido»). El',
  '  catálogo sintético de WP-04, el que usan la cohorte y la prueba breve, dice «Arroz blanco» o «Huevo», sin el estado: cada',
  '  ficha anota su equivalente para que Dirección decida si la imagen sirve también para él.',
  '- **Por uso:** las 16 recetas del manifiesto (41 alimentos distintos), los planes de la cohorte de test y los de la prueba',
  '  breve. Un solo estado por alimento, el que más se usa: el huevo va duro y el pollo, a la parrilla, como en los planes.',
  '- **Una variante no cuenta como otro alimento:** no hay dos estados de la misma comida.',
  '',
  '**Quedaron afuera por poco:**',
  '',
  ...ALIMENTOS_AFUERA.map((l) => `- ${l}`),
  '',
  '## El estilo común',
  '',
  ...ESTILO_DE_ALIMENTOS.map((l) => `- ${l}`),
  '',
  '| Código | Alimento | Estado | catalogItemId | Versión |',
  '|---|---|---|---|---|',
  ...alimentos.map((a) => `| ${a.id.replace('alimento-', '')} | ${a.nombre} | ${ESTADO_EN_PALABRAS[a.estado]} | \`${a.identificador.catalogItemId}\` | \`${a.identificador.catalogItemVersionId}\` |`),
  '',
  ...alimentos.flatMap((a, k) => {
    const s = ALIMENTOS[k];
    return [
      `## ${s.codigo} · ${a.nombre} (${ESTADO_EN_PALABRAS[a.estado]})`,
      '',
      `- **Archivo:** \`${a.archivo}\`. **Estado:** ficha lista, sin imagen.`,
      `- **Uso en BE:** ${s.uso}.`,
      `- **Qué se ve:** ${s.imagen}`,
      `- **No debe aparecer:** ${s.noDebe.join(', ')}.`,
      ...(s.observacion ? [`- **Ojo:** ${s.observacion}`] : []),
      `- **Equivalente en el catálogo sintético:** «${s.equivalenteDeDemostracion.clave}» (\`${s.equivalenteDeDemostracion.id}\`).`,
      '',
      '<details><summary>Prompt</summary>',
      '',
      bloque(a.prompt),
      '',
      '</details>',
      '',
    ];
  }),
  pie,
].join('\n');

md.EJERCICIOS = [
  '# Ejercicios · 15 (3 con imagen real y 12 con ficha y prompt)',
  '',
  '**Tres tienen imagen real:** las del paquete de Dirección del 2026-10-06, generadas por IA para BE, ya cargadas por el flujo',
  'real en la evidencia de Entrenamiento por serie. Las tres siguen **pendientes de revisión humana** (técnica y anatomía).',
  '**Doce son fichas con su prompt, sin imagen:** esta sesión no tenía una herramienta que genere imágenes.',
  '',
  '## Dónde se muestran y por qué el fondo es blanco',
  '',
  `- **Website:** ${COMO_SE_MUESTRA.ejercicio.web}.`,
  `- **APK:** ${COMO_SE_MUESTRA.ejercicio.apk}.`,
  `- **Servidor:** ${COMO_SE_MUESTRA.receta.servidor}.`,
  `- **Qué ejercicio puede tenerla:** ${COMO_SE_MUESTRA.ejercicio.donde}.`,
  '',
  'Como BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, **conviene generarlas',
  'sobre blanco**: la transparencia no aporta nada y deja un contorno (el de las tres del paquete se mide en `LEEME.md`).',
  '',
  '## Cómo se eligieron',
  '',
  '- **Los usados en los planes y recorridos de demostración:** los tres del paquete (la demostración de Entrenamiento por',
  '  serie) y los doce del catálogo sintético de WP-06, que usan los planes de la cohorte de test y la prueba breve.',
  '- **El implemento, cuando el nombre no lo dice,** sale de cómo los cargan los planes de la cohorte: «Zancadas», «Curl de',
  '  bíceps» y «Extensión de tríceps» van por mancuerna; «Sentadilla», «Peso muerto», «Press militar» y «Hip thrust», con',
  '  carga total (barra); «Dominadas», con el peso del cuerpo.',
  '- **Que se distingan a la vista:** la sentadilla con barra y la goblet, el peso muerto con barra y el rumano con',
  '  mancuernas, el press de banca con barra y el press con mancuernas, y las zancadas con mancuernas y la zancada estática',
  '  con las manos en la cintura.',
  '',
  '**Imágenes externas: descartadas para esta tanda** (se sondeó la API pública de wger; no se bajó ninguna imagen):',
  '',
  ...EXTERNAS_DESCARTADAS.map((l) => `- ${l}`),
  '',
  '## El estilo de los doce nuevos (el de las tres del paquete, sobre blanco)',
  '',
  ...ESTILO_DE_EJERCICIOS.map((l) => `- ${l}`),
  '',
  '| Código | Ejercicio | Imagen | Identidad en el catálogo |',
  '|---|---|---|---|',
  ...ejercicios.map((x) => `| ${x.id.replace('ejercicio-', '')} | ${x.nombre} | ${x.archivoReal ? `real (${x.archivoReal.ancho} × ${x.archivoReal.alto}, ${(x.archivoReal.bytes / 1024).toFixed(0)} KB)` : 'ficha y prompt'} | ${x.identificador.exerciseId ? `\`${x.identificador.exerciseId}\` · versión \`${x.identificador.versionId}\`` : 'propio, por ambiente'} |`),
  '',
  ...ejercicios.flatMap((x, k) => {
    const s = EJERCICIOS[k];
    return [
      `## ${s.codigo} · ${x.nombre}`,
      '',
      x.archivoReal
        ? `- **Imagen real:** \`${x.archivoReal.ruta}\` (${x.archivoReal.ancho} × ${x.archivoReal.alto} px, ${(x.archivoReal.bytes / 1024).toFixed(0)} KB, SHA-256 \`${x.archivoReal.sha256.slice(0, 12)}…\`). **Estado:** pendiente de revisión humana.`
        : `- **Archivo:** \`${x.archivo}\`. **Estado:** ficha lista, sin imagen.`,
      x.identificador.exerciseId ? `- **Catálogo:** ejercicio \`${x.identificador.exerciseId}\`, versión \`${x.identificador.versionId}\` · ${x.identificador.catalogo}.` : `- **Catálogo:** ${x.identificador.catalogo}.`,
      `- **Implemento:** ${s.implemento}${s.fuenteDelImplemento ? ` (de dónde sale: ${s.fuenteDelImplemento})` : ''}. **Uso:** ${s.uso}.`,
      ...(s.evitar ? [`- **No debe aparecer:** ${s.evitar.join(', ')}.`] : []),
      ...(s.postura ? [`- **Postura:** ${s.postura}`] : []),
      ...(s.distinguir ? [`- **Que se distinga:** ${s.distinguir}`] : []),
      ...(s.decidir ? [`- **A decidir:** ${s.decidir}`] : []),
      ...(x.archivoReal ? x.observaciones.slice(1).map((o) => `- ${o}`) : []),
      '',
      '<details><summary>Prompt</summary>',
      '',
      bloque(x.prompt),
      '',
      '</details>',
      '',
    ];
  }),
  pie,
].join('\n');

for (const [nombre, texto] of Object.entries(md)) fs.writeFileSync(join(CARPETA, `${nombre}.md`), texto);
console.log(`inventario: ${recetas.length} recetas, ${alimentos.length} alimentos, ${ejercicios.length} ejercicios · con archivo real: ${inventario.resumen.conArchivoReal} · pendientes de generación: ${inventario.resumen.pendientesDeGeneracion}`);
console.log(`escrito en ${relative(RAIZ, CARPETA)}: inventario.json, RECETAS.md, ALIMENTOS.md, EJERCICIOS.md`);
