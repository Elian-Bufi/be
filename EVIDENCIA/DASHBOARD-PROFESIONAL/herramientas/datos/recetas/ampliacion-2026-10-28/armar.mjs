#!/usr/bin/env node
// Arma la ampliación de las recetas de ejemplo desde su fuente escrita a mano (`fuente/`) y los datos del catálogo del
// repositorio, sin red ni base:
//   fuente/*.mjs + catálogo → manifiesto.json (las 50 recetas nuevas, con cada ingrediente resuelto y su composición)
//   + el manifiesto congelado de las 16 → vista-combinada.json (las 66, sin colisiones de código, archivo ni clave)
//
// Uso, desde cualquier carpeta: node armar.mjs [--verificar] [--resumen]
// - Sin opciones, escribe los dos archivos. Correrlo dos veces da los mismos bytes.
// - Con --verificar no escribe: falla si los archivos del repositorio no son exactamente los que salen de la fuente, o
//   si la fuente tiene un problema (un FDC que no está, un estado que no es el de su alimento, una coincidencia ambigua
//   sin decisión, un paso que nombra un ingrediente que no está en la lista…).
// - Con --resumen imprime la composición por porción de cada receta (para revisarla).
import fs from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculoIndependiente, leerManifiesto, NUTRIENTES, pedidoDeCreacion, sinTildes } from '../manifiesto.mjs';
import { archivoEsperado, claveDeIdempotencia, descripcionDe, huellaDe, ID_DEL_PAQUETE, problemasDeLaAmpliacion, RUTA_DE_LA_VISTA, RUTA_DEL_MANIFIESTO } from './ampliacion.mjs';
import { alimentoPorFdc, esAmbigua, candidatos, RAIZ } from './catalogo.mjs';
import { FAMILIAS, PAQUETE, PROCEDENCIA_COMUN, REFERENCIAS } from './fuente/comun.mjs';
import { REEMPLAZOS, RECETAS } from './fuente/index.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const verificar = process.argv.includes('--verificar');
const resumen = process.argv.includes('--resumen');
const problemas = [];

/** La familia editorial de cada receta original, solo para filtrar la galería (el manifiesto congelado no la tiene). */
const FAMILIA_DE_LAS_ORIGINALES = { 1: 'DULCES', 2: 'DULCES', 3: 'DULCES', 4: 'DULCES', 5: 'DULCES', 6: 'SANDWICHES', 7: 'HORNO', 8: 'HORNO', 9: 'PASTAS', 10: 'OLLAS', 11: 'MASAS', 12: 'FRIOS', 13: 'HORNO', 14: 'SANDWICHES', 15: 'HORNO', 16: 'DULCES' };

const redondear = (x, d = 6) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);

function resolverReceta(fuente) {
  const ingredientes = fuente.ingredientes.map((x, j) => {
    const a = alimentoPorFdc(x.fdc);
    const que = `${fuente.codigo}, ingrediente ${j + 1} («${x.buscado}», FDC ${x.fdc})`;
    if (!a) {
      problemas.push(`${que}: no está en el catálogo base ni en DL-119`);
      return null;
    }
    if (esAmbigua(x.buscado) && !x.decision) problemas.push(`${que}: «${x.buscado}» es ambiguo (${candidatos(x.buscado).join(' | ') || 'ningún alimento'}) y no tiene decisión`);
    if (a.composicion.referenceAmount !== '100g') problemas.push(`${que}: la composición es cada ${a.composicion.referenceAmount}`);
    return {
      parte: x.parte,
      buscado: x.buscado,
      fuente: a.fuente,
      fdcId: a.fdcId,
      nombre: a.nombre,
      preparacionDeLaFuente: a.preparacionDeLaFuente,
      catalogItemId: a.catalogItemId,
      catalogItemVersionId: a.catalogItemVersionId,
      cantidad: { valor: x.gramos, unidad: 'g' },
      estado: x.estado,
      decision: x.decision,
      nota: x.nota,
    };
  });
  if (ingredientes.includes(null)) return null;
  const receta = {
    codigo: fuente.codigo,
    nombre: fuente.nombre,
    familia: fuente.familia,
    familiaNombre: FAMILIAS[fuente.familia]?.nombre ?? null,
    momento: fuente.momento,
    porciones: fuente.porciones,
    rendimiento: fuente.rendimiento,
    porcion: fuente.porcion,
    descripcion: descripcionDe(fuente),
    motivo: fuente.motivo,
    distingue: fuente.distingue ?? null,
    ingredientes,
    pasos: fuente.pasos,
    equipo: fuente.equipo,
    tiempos: fuente.tiempos,
    practicas: fuente.practicas,
    nota: fuente.nota ?? null,
  };
  if (!receta.familiaNombre) problemas.push(`${fuente.codigo}: la familia ${fuente.familia}`);
  const composicionDe = (i) => alimentoPorFdc(i.fdcId).composicion;
  const calculo = calculoIndependiente(receta, composicionDe);
  receta.composicion = {
    metodo: 'Gramos ÷ 100 × el valor cada 100 g del catálogo, sumado (el mismo método que SUM_SOURCE_PER_100G_V1 de BE, hecho de nuevo sin su código)',
    total: Object.fromEntries(NUTRIENTES.map((n) => [n, redondear(calculo.total[n])])),
    porPorcion: Object.fromEntries(NUTRIENTES.map((n) => [n, redondear(calculo.porPorcion[n])])),
  };
  receta.huella = huellaDe(receta);
  // La misma clave que manda cargar.mjs al crearla: sale del cuerpo de API-REC-01.
  receta.claveDeCreacion = claveDeIdempotencia(receta, 'receta', pedidoDeCreacion(receta));
  receta.foto = { archivo: archivoEsperado(receta), recipiente: fuente.foto.recipiente, presentacion: fuente.foto.presentacion, noDebe: fuente.foto.noDebe };
  // Lo común a todas (la procedencia general, las referencias y los estados) va una sola vez, en la cabecera.
  receta.procedencia = { adaptaciones: fuente.adaptaciones ?? [], supuestos: fuente.supuestos ?? [] };
  return receta;
}

const recetas = RECETAS.map(resolverReceta).filter(Boolean);
const originales = leerManifiesto();
const manifiesto = {
  manifiesto: `${PAQUETE.nombre}. ${PAQUETE.encargo}.`,
  paquete: ID_DEL_PAQUETE,
  version: PAQUETE.version,
  commitDeReferencia: PAQUETE.commitDeReferencia,
  cuenta: 'PRO_N: Lic. Sofía Paz, profesional de Nutrición de la cohorte de test (las credenciales viven fuera del repo). No se cargó en test: el encargo no lo autoriza.',
  catalogo: 'Cada ingrediente es un alimento de USDA FoodData Central · SR Legacy del catálogo base (DL-141) o de DL-119, por identidad y versión. Ninguno es de demostración.',
  originales: 'Las 16 del manifiesto congelado (../manifiesto.json) no se tocan: esta ampliación tiene otros códigos, otros archivos de foto y otras claves de idempotencia.',
  imagenes: {
    carpeta: 'Fuera del repo; se pasa con --fotos. Puede ser la misma carpeta de las 16 originales: los nombres no se cruzan.',
    archivo: 'R017-nombre.jpg (también .png o .webp): el código de la receta y su nombre sin tildes. Se busca por el código.',
    procedencia: 'AI_GENERATED',
    autoria: 'Generada por IA para BE',
  },
  procedencia: { comun: PROCEDENCIA_COMUN, referencias: Object.values(REFERENCIAS) },
  /** Los cuatro estados de una receta (§9): se dicen por separado y ninguno se da por hecho sin su evidencia. */
  estados: {
    calculadoPorElSistema: 'Lo comprueba la prueba de integración (test/integration/recetas-ampliacion.int-spec.ts): API-REC-07 en una base efímera, contra la composición de cada receta',
    revisadoPorElAgente: 'Sí, el 2026-10-28: formulación, estados, cantidades, decisiones y composición de las 50',
    cocinadoYPesado: 'No: ninguna receta se cocinó ni se pesó',
    validadoPorUnaPersona: 'No: falta la revisión de Dirección o de un profesional',
  },
  reemplazos: REEMPLAZOS,
  recetas,
};

const problemasDeForma = problemasDeLaAmpliacion(manifiesto, originales);
problemas.push(...problemasDeForma);
for (const [clave, f] of Object.entries(FAMILIAS)) {
  const n = recetas.filter((r) => r.familia === clave).length;
  if (n !== f.nuevas) problemas.push(`la familia «${f.nombre}» tiene ${n} recetas nuevas, no ${f.nuevas}`);
}

const vista = {
  vista: 'Las 66 recetas de ejemplo: las 16 originales (manifiesto congelado) y las 50 de la ampliación. El código editorial (R001 a R066) es para leerlas juntas; no es un identificador del producto ni cambia la numeración del manifiesto congelado.',
  familias: Object.fromEntries(Object.entries(FAMILIAS).map(([k, f]) => [k, f.nombre])),
  familiaDeLasOriginales: 'Las originales no tienen familia en su manifiesto: la de esta vista es editorial, solo para filtrar.',
  recetas: [
    ...originales.recetas.map((r) => ({
      codigo: `R${String(r.numero).padStart(3, '0')}`,
      origen: 'ORIGINAL',
      paquete: 'recetas-de-ejemplo-v1',
      numeroEnSuPaquete: r.numero,
      nombre: r.nombre,
      familia: FAMILIA_DE_LAS_ORIGINALES[r.numero],
      momento: r.descripcion?.replace(/\.$/, '') ?? null,
      porciones: r.porciones,
      archivoDeFoto: r.imagen,
      manifiesto: 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.json',
    })),
    ...recetas.map((r) => ({
      codigo: r.codigo,
      origen: 'NUEVA',
      paquete: ID_DEL_PAQUETE,
      numeroEnSuPaquete: null,
      nombre: r.nombre,
      familia: r.familia,
      momento: r.momento,
      porciones: r.porciones,
      archivoDeFoto: r.foto.archivo,
      manifiesto: 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/manifiesto.json',
    })),
  ],
};
const archivos = vista.recetas.map((r) => r.archivoDeFoto);
const nombres = vista.recetas.map((r) => sinTildes(r.nombre));
if (new Set(archivos).size !== archivos.length) problemas.push('dos recetas de la vista combinada esperan el mismo archivo de foto');
if (new Set(nombres).size !== nombres.length) problemas.push('dos recetas de la vista combinada tienen el mismo nombre');
if (new Set(vista.recetas.map((r) => r.codigo)).size !== vista.recetas.length) problemas.push('dos recetas de la vista combinada tienen el mismo código');

if (resumen) {
  for (const r of recetas) {
    const p = r.composicion.porPorcion;
    const atwater = 4 * p.proteinG + 4 * p.carbohydrateG + 9 * p.fatG;
    const desvio = (p.energyKcal - atwater) / p.energyKcal;
    console.log(
      `${r.codigo} ${r.nombre.padEnd(56)} ${String(r.porciones).padStart(2)} porc. · ${Math.round(p.energyKcal)} kcal · P ${p.proteinG.toFixed(1)} · C ${p.carbohydrateG.toFixed(1)} · G ${p.fatG.toFixed(1)} · F ${p.fiberG.toFixed(1)}${Math.abs(desvio) > 0.12 ? ` · 4/4/9 se aparta ${Math.round(desvio * 100)} %` : ''}`,
    );
  }
}

const salidas = [
  { archivo: RUTA_DEL_MANIFIESTO, texto: `${JSON.stringify(manifiesto, null, 1)}\n` },
  { archivo: RUTA_DE_LA_VISTA, texto: `${JSON.stringify(vista, null, 1)}\n` },
];
if (problemas.length > 0) {
  console.error(`La fuente tiene ${problemas.length} problema(s):\n- ${problemas.join('\n- ')}`);
  process.exit(1);
}
let distintas = 0;
for (const { archivo, texto } of salidas) {
  const relativo = relative(RAIZ, archivo).replace(/\\/g, '/');
  if (verificar) {
    const actual = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null;
    if (actual !== texto) {
      distintas += 1;
      console.error(`${relativo}: no es el que sale de la fuente. Correr node ${relative(process.cwd(), join(AQUI, 'armar.mjs'))}`);
    }
  } else {
    fs.writeFileSync(archivo, texto);
    console.log(`${relativo}: ${recetas.length} recetas nuevas, ${texto.length} caracteres`);
  }
}
if (distintas > 0) process.exit(1);
if (verificar) console.log(`Sin problemas: ${recetas.length} recetas nuevas y ${vista.recetas.length} en la vista combinada.`);
