/**
 * WP-CATALOGO-BASE (DL-141, D-6) · arma `docs/catalogo/FUENTES.md` desde los datos curados: la cita de USDA FoodData
 * Central y la atribución que piden las licencias de wger, ejercicio por ejercicio (cada texto con su licencia y su
 * autoría). Función pura, como `sql.mjs`: la usan el generador y la prueba de contenido, que exige que el documento del
 * repositorio sea exactamente este. La página «Fuentes del catálogo» del website sale de este documento.
 */
import { baseDelNombre, nombreEnInglesDeUsda, nombresAlternativosDeEjercicio } from './sql.mjs';

/** Una celda de tabla de Markdown: sin barras verticales ni saltos de línea. */
const celda = (texto) => String(texto).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');

/** Cómo se nombra cada licencia en el documento. */
const NOMBRE_DE_LICENCIA = { 'CC-BY-SA-3.0': 'CC BY-SA 3.0', 'CC-BY-SA-4.0': 'CC BY-SA 4.0', 'CC0-1.0': 'CC0 1.0', 'CC-BY-4.0': 'CC BY 4.0', 'ODbL-1.0': 'ODbL 1.0' };

function licencia(fuente, numero) {
  const l = fuente.licencias[String(numero)];
  if (!l) throw new Error(`wger declara una licencia desconocida (${numero})`);
  return `[${NOMBRE_DE_LICENCIA[l.id] ?? l.id}](${l.url})`;
}

/** «Bench Press» · CC BY-SA 3.0 · sistab2 */
const texto = (fuente, t) => `«${celda(t.nombre)}» · ${licencia(fuente, t.licencia)} · ${t.autoria ? celda(t.autoria) : 'sin autoría declarada en wger'}`;

export function fuentesEnMarkdown(ejercicios, alimentos) {
  const fe = ejercicios.fuente;
  const fa = alimentos.fuente;
  const cuantosDeWger = ejercicios.ejercicios.filter((e) => e.origenDelNombre === 'WGER').length;
  const lineas = [
    '# Fuentes del catálogo base',
    '',
    '> GENERADO por `scripts/catalogo-base/generar-migracion.mjs` desde `prisma/datos/catalogo-base/`: no se edita a mano.',
    '> Es la base de la página «Fuentes del catálogo» del website (DEUDA_LEGAJO DL-141, D-6).',
    '',
    'El catálogo base de BE trae alimentos y ejercicios de dos fuentes libres. Cada ítem dice su fuente y su licencia donde',
    'se elige; esta página reúne las atribuciones que piden esas licencias. El catálogo es para elegir: no es una',
    'recomendación ni una prescripción (INV-06-143).',
    '',
    '## Alimentos · USDA FoodData Central',
    '',
    `- **Cita:** ${fa.cita}`,
    `- **Licencia:** [${fa.licencia.label}](${fa.licencia.url}). USDA pide que se la cite como fuente: «${fa.licencia.attribution}».`,
    `- **Qué se tomó:** de ${alimentos.alimentos.length} alimentos, la composición cada 100 g (energía, proteínas, carbohidratos «by difference», grasas y`,
    '  fibra), el NDB, la fecha de publicación y la descripción original en inglés, que también es un nombre alternativo. A los',
    `  ${alimentos.alimentosDeDl119.length} alimentos de USDA que ya estaban (DL-119) se les sumó la descripción en inglés como nombre alternativo.`,
    '- **Qué es de BE:** el nombre en castellano rioplatense, la preparación en castellano y los nombres de otros países.',
    '  Ningún valor de la composición se completó ni se estimó.',
    `- **Descarga:** ${fa.descarga} (SHA-256 \`${fa.sha256}\`), el ${fa.descargadoEl}.`,
    '',
    '| Alimento en BE | FDC | Descripción original de USDA |',
    '|---|---|---|',
    ...alimentos.alimentos.map((a) => `| ${celda(a.nombre)} | [${a.fdcId}](https://fdc.nal.usda.gov/food-details/${a.fdcId}/nutrients) | ${celda(nombreEnInglesDeUsda(a.usda.descripcion))} |`),
    '',
    '## Ejercicios · wger',
    '',
    `- **Cita:** ${fe.cita}`,
    '- **Licencias:** wger publica cada texto con su licencia y su autoría: el nombre en cada idioma y los datos del ejercicio',
    '  (categoría, músculos y material). En este catálogo hay textos con CC BY-SA 3.0, CC BY-SA 4.0 y CC0 1.0. Cuando wger no',
    '  declara la autoría, se lo dice así y se cita el ejercicio en wger.',
    `- **Qué se tomó:** de ${ejercicios.ejercicios.length} ejercicios, el nombre en inglés (es un nombre alternativo), la traducción al castellano cuando BE`,
    '  la usa, la categoría, los músculos y el material. Sin imágenes ni descripciones, que tienen sus propias licencias.',
    `- **Cambios (CC BY-SA pide indicarlos):** ${cuantosDeWger} nombres en castellano son la traducción de wger revisada (a lo sumo con otras`,
    `  mayúsculas); los otros ${ejercicios.ejercicios.length - cuantosDeWger} son traducciones propias de BE del nombre en inglés de wger, y se comparten con su misma`,
    '  licencia. Los nombres de otros países los curó BE.',
    `- **Consulta:** ${fe.api} (cada ejercicio, por su número), el ${fe.descargadoEl}.`,
    '',
    '| Ejercicio en BE | wger | Nombre en castellano | Nombre en inglés | Datos del ejercicio |',
    '|---|---|---|---|---|',
    ...ejercicios.ejercicios.map((e) => {
      // La traducción de wger al castellano se cita si BE la usa: como nombre o como nombre alternativo.
      const comoAlternativo = nombresAlternativosDeEjercicio(e).some((n) => n.origen === 'PROVEEDOR' && n.idioma === 'ES');
      const castellano = baseDelNombre(e).idioma === 'es' ? texto(fe, e.traducciones.es) : `propio de BE, del inglés${comoAlternativo ? `; alternativo: ${texto(fe, e.traducciones.es)}` : ''}`;
      const datos = `${licencia(fe, e.wger.licencia.wger)} · ${e.wger.licencia.autoria ? celda(e.wger.licencia.autoria) : 'sin autoría declarada en wger'}`;
      return `| ${celda(e.nombre)} | [${e.wgerId}](${fe.api}${e.wgerId}/) | ${castellano} | ${texto(fe, e.traducciones.en)} | ${datos} |`;
    }),
    '',
  ];
  return `${lineas.join('\n')}`;
}
