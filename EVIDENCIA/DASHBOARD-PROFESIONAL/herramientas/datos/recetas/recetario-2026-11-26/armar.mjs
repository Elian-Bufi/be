#!/usr/bin/env node
// Arma las 84 recetas nuevas del Recetario de BE (R067 a R151, sin R150) desde su fuente escrita a mano (`fuente/`) y los
// datos del catálogo del repositorio, sin red ni base:
//   fuente/*.mjs + catálogo → manifiesto.json (cada ingrediente resuelto por identidad y versión, con su composición)
//
// Uso: node armar.mjs [--verificar] [--resumen] [--prompts <carpeta>]
// - Sin opciones, escribe manifiesto.json. Con --verificar no escribe: falla si el archivo no es el que sale de la fuente.
// - Con --resumen imprime la composición por porción de cada receta.
// - Con --prompts <carpeta> escribe 4-recetas-67-a-151.md, .json y .txt (los prompts de las fotos), en el mismo formato
//   que los de las 66 anteriores.
import fs from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESTILO_DE_RECETAS } from '../../../../../MATERIAL-VISUAL/herramientas/seleccion.mjs';
import { ingredientesQueFaltanEnLaLista } from '../ampliacion-2026-10-28/ampliacion.mjs';
import { alimentoPorFdc, candidatos, esAmbigua, RAIZ } from '../ampliacion-2026-10-28/catalogo.mjs';
import { calculoIndependiente, estadoCoherente, NUTRIENTES, sinTildes } from '../manifiesto.mjs';
import { A } from './fuente/alimentos.mjs';
import { RECETAS_A } from './fuente/recetas-a.mjs';
import { RECETAS_B } from './fuente/recetas-b.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const RUTA_DEL_MANIFIESTO = join(AQUI, 'manifiesto.json');
export const ID_DEL_PAQUETE = 'recetario-2026-11-26';
export const CODIGOS = Array.from({ length: 85 }, (_, k) => `R${String(67 + k).padStart(3, '0')}`).filter((c) => c !== 'R150');

const args = process.argv.slice(2);
const verificar = args.includes('--verificar');
const problemas = [];
const redondear = (x, d = 6) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);
const COCCION = /\b(cocid|cocinad|hervid|al horno|asad|a la parrilla|a la plancha|al grill|frit|revuelt|poch|omelette|dorad|brasead|al vapor)/i;
const estadoDe = (preparacion) => (COCCION.test(preparacion) ? 'COOKED' : /\b(crud|fresc)/i.test(preparacion) ? 'RAW' : 'AS_PURCHASED');
const recipiente = { plato: 'plato playo blanco liso de 26 cm', hondo: 'plato hondo blanco liso de 23 cm', platito: 'plato de postre blanco liso de 20 cm', cuenco: 'cuenco blanco liso de 15 cm', vaso: 'vaso de vidrio liso de 300 ml' };
/** Lo que no se ve en una foto (y que solo confundiría a la herramienta si se lo nombrara). */
const minuscula = (s) => `${s.charAt(0).toLowerCase()}${s.slice(1)}`;
export const descripcionDe = (r) => `${r.momento}. ${r.rendimiento} Porción: ${minuscula(r.porcion)}`;

function resolver(f) {
  const ingredientes = f.ingredientes.map(([clave, gramos], j) => {
    const que = `${f.codigo}, ingrediente ${j + 1} (${clave})`;
    const alias = A[clave];
    if (!alias) {
      problemas.push(`${que}: no está en alimentos.mjs`);
      return null;
    }
    const a = alimentoPorFdc(alias[0]);
    if (!a) {
      problemas.push(`${que}: el FDC ${alias[0]} no está en el catálogo`);
      return null;
    }
    const estado = estadoDe(a.preparacionDeLaFuente);
    if (!estadoCoherente(estado, a.preparacionDeLaFuente)) problemas.push(`${que}: estado incoherente`);
    const decision = esAmbigua(alias[1] || a.nombre) ? `Se usa «${a.nombre}» del catálogo; hay otros alimentos posibles para «${alias[1] || clave}» (${candidatos(alias[1] || a.nombre).length} coincidencias).` : null;
    return { fuente: a.fuente, fdcId: a.fdcId, nombre: a.nombre, preparacionDeLaFuente: a.preparacionDeLaFuente, catalogItemId: a.catalogItemId, catalogItemVersionId: a.catalogItemVersionId, cantidad: { valor: gramos, unidad: 'g' }, estado, etiqueta: alias[1], decision };
  });
  if (ingredientes.includes(null)) return null;
  const receta = {
    codigo: f.codigo,
    nombre: f.nombre,
    momento: f.momento,
    alPaso: f.alPaso === true,
    porciones: f.porciones,
    rendimiento: f.rendimiento,
    porcion: f.porcion,
    descripcion: descripcionDe(f),
    ingredientes,
    pasos: f.pasos,
    adaptaciones: f.adaptaciones ?? [],
    nota: f.nota ?? null,
    foto: { archivo: `${f.codigo}-${sinTildes(f.nombre)}.jpg`, recipiente: f.foto[0], presentacion: f.foto[1], noDebe: f.foto[2] },
  };
  const calculo = calculoIndependiente(receta, (i) => alimentoPorFdc(i.fdcId).composicion);
  receta.composicion = {
    metodo: 'Gramos ÷ 100 × el valor cada 100 g del catálogo, sumado (SUM_SOURCE_PER_100G_V1)',
    total: Object.fromEntries(NUTRIENTES.map((n) => [n, redondear(calculo.total[n])])),
    porPorcion: Object.fromEntries(NUTRIENTES.map((n) => [n, redondear(calculo.porPorcion[n])])),
  };
  const faltan = ingredientesQueFaltanEnLaLista(receta);
  if (faltan.length > 0) problemas.push(`${f.codigo}: los pasos nombran ${faltan.join(', ')}, que no están en la lista`);
  if (receta.descripcion.length > 500) problemas.push(`${f.codigo}: la descripción pasa de 500 caracteres`);
  if (receta.pasos.some((p) => p.length > 500)) problemas.push(`${f.codigo}: un paso pasa de 500 caracteres`);
  return receta;
}

const fuentes = [...RECETAS_A, ...RECETAS_B];
if (fuentes.map((f) => f.codigo).join() !== CODIGOS.join()) problemas.push(`los códigos de la fuente no son R067 a R151 sin R150: ${fuentes.map((f) => f.codigo).join(', ')}`);
const recetas = fuentes.map(resolver).filter(Boolean);
const manifiesto = {
  manifiesto: 'Recetario de BE · 84 recetas nuevas de cocina familiar argentina (R067 a R151, sin R150), aprobadas por Dirección el 2026-11-26.',
  paquete: ID_DEL_PAQUETE,
  catalogo: 'Cada ingrediente es un alimento de USDA FoodData Central · SR Legacy del catálogo base (DL-141) o de DL-119, por identidad y versión. Ninguno es de demostración.',
  estados: {
    calculadoPorElSistema: 'El cálculo de la semilla es el mismo que el de la API (SUM_SOURCE_PER_100G_V1)',
    cocinadoYPesado: 'No: ninguna receta se cocinó ni se pesó',
    validadoPorUnaPersona: 'No: falta la revisión de un profesional',
  },
  recetas,
};

if (args.includes('--resumen')) {
  for (const r of recetas) {
    const p = r.composicion.porPorcion;
    console.log(`${r.codigo} ${r.nombre.padEnd(60)} ${String(r.porciones).padStart(2)} porc. · ${Math.round(p.energyKcal)} kcal · P ${p.proteinG.toFixed(1)} · C ${p.carbohydrateG.toFixed(1)} · G ${p.fatG.toFixed(1)}`);
  }
}

/** El prompt de la foto de una receta, con el mismo formato que los de R017 a R066. */
const NO_SE_VE = new Set(['']);
export function promptDe(r) {
  const lleva = [...new Set(r.ingredientes.map((i) => i.etiqueta))].filter((b) => !NO_SE_VE.has(b));
  const rinde = r.porciones === 1 ? `Rinde 1 porción; la foto la muestra entera: ${minuscula(r.porcion)}` : `Rinde ${r.porciones} porciones; la foto muestra una sola: ${minuscula(r.porcion)}`;
  return [
    ...ESTILO_DE_RECETAS,
    `Recipiente: ${recipiente[r.foto.recipiente]}.`,
    `Receta: «${r.nombre}». ${rinde}`,
    `Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): ${lleva.join(', ')}.`,
    `Presentación: ${r.foto.presentacion}`,
    `No debe aparecer: ${r.foto.noDebe.join(', ')}.`,
  ].join('\n');
}
export const archivoDeSalida = (r) => r.foto.archivo.replace(/\.jpg$/, '.png');

if (problemas.length > 0) {
  console.error(`La fuente tiene ${problemas.length} problema(s):\n- ${problemas.join('\n- ')}`);
  process.exit(1);
}
const texto = `${JSON.stringify(manifiesto, null, 1)}\n`;
const relativo = relative(RAIZ, RUTA_DEL_MANIFIESTO).replace(/\\/g, '/');
if (verificar) {
  if ((fs.existsSync(RUTA_DEL_MANIFIESTO) ? fs.readFileSync(RUTA_DEL_MANIFIESTO, 'utf8') : null) !== texto) {
    console.error(`${relativo}: no es el que sale de la fuente. Correr node armar.mjs`);
    process.exit(1);
  }
  console.log(`Sin problemas: ${recetas.length} recetas nuevas.`);
} else {
  fs.writeFileSync(RUTA_DEL_MANIFIESTO, texto);
  console.log(`${relativo}: ${recetas.length} recetas nuevas`);
}

const i = args.indexOf('--prompts');
if (i >= 0) {
  const carpeta = args[i + 1];
  const lista = recetas.map((r) => ({ codigo: r.codigo, archivo: archivoDeSalida(r), prompt: promptDe(r) }));
  const md = [
    '# Fotos del Recetario de BE · 84 prompts para ChatGPT (R067 a R151, sin R150)',
    '',
    'Cada bloque es un pedido completo (ya trae el estilo común). **Una imagen por mensaje.**',
    '',
    '## Cómo hacerlo',
    '',
    '1. **Primero un lote de prueba:** R067, R078, R106, R137. Si algo se aparta de la serie (luz, fondo, vajilla, escala), decíselo a ChatGPT y repetí antes de seguir.',
    '2. Pedí formato **horizontal 4:3** (si no lo ofrece, 3:2 apaisado).',
    '3. Guardá cada imagen **con el nombre exacto** que dice cada bloque, todas en `C:\\Users\\bufim\\BE-datos-locales\\fotos-recetas\\originales\\`. No las edites.',
    '4. Mirá cada una antes de seguir: la receta correcta, una sola porción, sin ingredientes que no estén, sin texto, manos ni marcas. Si no, pedila de nuevo.',
    '5. Cuando tengas un lote, avisame: yo las preparo, las reviso y las cargo al Recetario de BE.',
    '',
  ];
  for (const [k, r] of recetas.entries()) md.push(`## ${r.codigo} · ${r.nombre}`, '', `**Guardar como:** \`${lista[k].archivo}\``, '', '```text', lista[k].prompt, '```', '');
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(join(carpeta, '4-recetas-67-a-151.md'), `${md.join('\n').trimEnd()}\n`);
  fs.writeFileSync(join(carpeta, '4-recetas-67-a-151.json'), `${JSON.stringify(lista, null, 1)}\n`);
  fs.writeFileSync(join(carpeta, '4-recetas-67-a-151.txt'), `${lista.map((x) => x.prompt.replace(/\s*\n\s*/g, ' ').trim()).join('\n')}\n`);
  console.log(`Prompts: ${lista.length} en ${carpeta}`);
}
